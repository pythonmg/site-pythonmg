# Python-MG

Site estático de página única da comunidade Python de Minas Gerais. Usa apenas
HTML, CSS e JavaScript vanilla — não há dependências, etapa de build ou gerador
de site.

## Rodar localmente

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Também funciona em qualquer hospedagem de
arquivos estáticos, incluindo GitHub Pages.

## Atualizar conteúdo

Os arquivos abaixo são copiados para o site sem transformação. Não é preciso
editar HTML, CSS ou JavaScript para alterar as listas:

- `data/events.json` — agenda de eventos;
- `data/members.json` — pessoas colaboradoras;
- `data/posts.json` — posts do blog (opcional);
- `data/site.json` — textos institucionais, links, projetos e código
  de conduta.

Depois de mudar um JSON, valide a sintaxe:

```sh
python3 -m json.tool data/events.json >/dev/null
python3 -m json.tool data/members.json >/dev/null
```

### Evento

```json
{
  "title": { "pt": "Nome do encontro", "en": "Event name" },
  "date": "2026-10-10",
  "time": "19:00",
  "place": { "pt": "Belo Horizonte", "en": "Belo Horizonte" },
  "href": "https://exemplo.org/evento",
  "kind": "palestra"
}
```

Use a data no formato `AAAA-MM-DD`. Eventos a partir de hoje aparecem em
**Próximos**; os demais ficam em **Eventos anteriores**.

### Membro

```json
{
  "name": "Nome da pessoa",
  "github": "usuario-github",
  "twitter": "@usuario",
  "instagram": "usuario",
  "linkedin": "usuario",
  "telegram": "usuario",
  "bluesky": "usuario.bsky.social",
  "threads": "usuario",
  "mastodon": "@usuario@mastodon.social",
  "email": "pessoa@exemplo.org",
  "site": { "nome": "Meu site", "href": "https://exemplo.org" }
}
```

Todos os campos, exceto `name`, são opcionais. Com `github`, o cartão usa o
avatar público do GitHub. Sem `github`, um perfil `linkedin` é usado como
fallback de avatar. Também é possível informar `"avatar"` com uma URL de imagem,
que sempre tem prioridade. Os campos de rede social aceitam um usuário (com ou
sem `@`) ou a URL completa do perfil. Para `mastodon`, use a URL completa ou o
formato `@usuario@servidor`.

## POC: importar eventos do Meetup

Com autorização do Meetup, a POC em `scripts/sync_meetup_events.py` faz uma
única requisição manual à página pública do grupo e exporta os eventos para o
mesmo formato do site. Ela não usa credenciais, navegador automatizado ou
agendamento.

```sh
# Inspeciona a agenda, sem alterar arquivos.
python3 scripts/sync_meetup_events.py --dry-run

# Grava uma cópia para revisão.
python3 scripts/sync_meetup_events.py --output data/events.meetup.json

# Depois de revisar, substitui a agenda publicada.
python3 scripts/sync_meetup_events.py --output data/events.json
```

Por padrão, a POC exporta somente eventos a partir da data atual. Use
`--include-past` apenas para uma exportação histórica pontual.
