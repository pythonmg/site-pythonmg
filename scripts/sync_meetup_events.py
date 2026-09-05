#!/usr/bin/env python3
"""Export public Python-MG Meetup events to the site's JSON schema.

This proof of concept makes one request per invocation and reads the public
Next.js payload embedded in the group events page. It deliberately has no
scheduler, retry loop, or browser automation.
"""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


DEFAULT_URL = "https://www.meetup.com/pythonmg/events/"
DEFAULT_OUTPUT = Path("data/events.meetup.json")
USER_AGENT = "Python-MG Meetup sync POC (community website)"


class NextDataParser(HTMLParser):
    """Collect the payload from Next.js's public __NEXT_DATA__ script tag."""

    def __init__(self) -> None:
        super().__init__()
        self.in_next_data = False
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.in_next_data = tag == "script" and dict(attrs).get("id") == "__NEXT_DATA__"

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self.in_next_data = False

    def handle_data(self, data: str) -> None:
        if self.in_next_data:
            self.parts.append(data)


def fetch_page(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urlopen(request, timeout=30) as response:
        return response.read().decode(response.headers.get_content_charset() or "utf-8")


def apollo_state(page: str) -> dict[str, object]:
    parser = NextDataParser()
    parser.feed(page)
    if not parser.parts:
        raise ValueError("Meetup page does not contain a __NEXT_DATA__ payload")

    payload = json.loads("".join(parser.parts))
    try:
        return payload["props"]["pageProps"]["__APOLLO_STATE__"]
    except (KeyError, TypeError) as error:
        raise ValueError("Meetup page payload has an unexpected structure") from error


def venue_label(event: dict[str, object], state: dict[str, object]) -> str:
    if event.get("isOnline"):
        return "Online"
    venue_ref = event.get("venue")
    if not isinstance(venue_ref, dict):
        return "A confirmar"
    venue = state.get(venue_ref.get("__ref"))
    if not isinstance(venue, dict):
        return "A confirmar"
    return ", ".join(part for part in (venue.get("name"), venue.get("city")) if isinstance(part, str)) or "A confirmar"


def normalize_events(state: dict[str, object], include_past: bool) -> list[dict[str, object]]:
    today = datetime.now(timezone.utc).date()
    events: list[dict[str, object]] = []
    seen_ids: set[str] = set()

    for value in state.values():
        if not isinstance(value, dict) or value.get("__typename") != "Event":
            continue
        event_id = value.get("id")
        raw_date = value.get("dateTime")
        title = value.get("title")
        event_url = value.get("eventUrl")
        if not all(isinstance(item, str) for item in (event_id, raw_date, title, event_url)):
            continue
        if event_id in seen_ids:
            continue
        seen_ids.add(event_id)

        try:
            starts_at = datetime.fromisoformat(raw_date)
        except ValueError:
            continue
        if not include_past and starts_at.date() < today:
            continue

        kind = str(value.get("eventType") or "evento").lower()
        events.append({
            "title": {"pt": title, "en": title},
            "date": starts_at.date().isoformat(),
            "time": starts_at.strftime("%H:%M"),
            "place": {"pt": venue_label(value, state), "en": venue_label(value, state)},
            "href": event_url,
            "kind": kind,
            "source": "meetup",
        })

    return sorted(events, key=lambda event: (event["date"], event["time"]))


def write_json(output: Path, events: list[dict[str, object]]) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output.parent, delete=False) as handle:
        json.dump(events, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary_path = Path(handle.name)
    temporary_path.replace(output)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=DEFAULT_URL, help="Public Meetup group events URL")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="JSON output path")
    parser.add_argument("--include-past", action="store_true", help="Export past events too")
    parser.add_argument("--dry-run", action="store_true", help="Print JSON instead of writing it")
    args = parser.parse_args()

    try:
        events = normalize_events(apollo_state(fetch_page(args.url)), args.include_past)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Meetup sync failed: {error}", file=sys.stderr)
        return 1

    if args.dry_run:
        json.dump(events, sys.stdout, ensure_ascii=False, indent=2)
        print()
    else:
        write_json(args.output, events)
        print(f"Exported {len(events)} event(s) to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
