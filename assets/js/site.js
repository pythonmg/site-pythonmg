(() => {
  'use strict';

  const MONTHS = {
    pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    en: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  };
  const COPY = {
    pt: {
      about: 'Sobre', nextMeetups: 'Próximos encontros', seeEvents: 'Ver eventos',
      community: 'Comunidade', members: 'Membros', events: 'Eventos', projects: 'Projetos',
      conduct: 'Código de conduta', blog: 'Blog', upcoming: 'Próximos', past: 'Eventos anteriores',
      eventsIntro: 'Nos encontramos para trocar conhecimento. A agenda é mantida em data/events.json.', meetupAgenda: 'Ver agenda no Meetup ↗',
      noEvents: 'Nenhum evento cadastrado no momento.', noMembers: 'Nenhum membro cadastrado ainda.', noPosts: 'Nenhum post publicado ainda.'
    },
    en: {
      about: 'About', nextMeetups: 'Next meetups', seeEvents: 'See events',
      community: 'Community', members: 'Members', events: 'Events', projects: 'Projects',
      conduct: 'Code of conduct', blog: 'Blog', upcoming: 'Upcoming', past: 'Past events',
      eventsIntro: 'We get together to share knowledge. The schedule lives in data/events.json.', meetupAgenda: 'View the Meetup calendar ↗',
      noEvents: 'No events have been added yet.', noMembers: 'No members have been added yet.', noPosts: 'No posts have been published yet.'
    }
  };
  const SECTIONS = ['comunidade', 'membros', 'eventos', 'projetos', 'blog', 'conduta'];
  let lang = 'pt';
  let state = {};

  const byId = (id) => document.getElementById(id);
  const clear = (node) => node.replaceChildren();
  const element = (tag, options = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(options).forEach(([key, value]) => {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else node.setAttribute(key, value);
    });
    children.filter(Boolean).forEach((child) => node.append(child));
    return node;
  };
  const pick = (value) => value && typeof value === 'object'
    ? (value[lang] || value.pt || value.en || '') : (value || '');
  const text = (key) => COPY[lang][key];
  const external = (href, label, className) => {
    const link = element('a', { href: safeHref(href), text: label, class: className });
    if (/^https?:/i.test(link.href)) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
    return link;
  };
  const safeHref = (href) => /^(https?:|mailto:|#)/i.test(href || '') ? href : '#';
  const profileUrl = (network, value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return safeHref(raw);

    const handle = raw.replace(/^@/, '');
    if (network === 'instagram') return `https://instagram.com/${encodeURIComponent(handle)}`;
    if (network === 'linkedin') return `https://www.linkedin.com/in/${encodeURIComponent(handle)}`;
    if (network === 'telegram') return `https://t.me/${encodeURIComponent(handle)}`;
    if (network === 'bluesky') return `https://bsky.app/profile/${encodeURIComponent(handle)}`;
    if (network === 'threads') return `https://www.threads.net/@${encodeURIComponent(handle)}`;
    if (network === 'mastodon') {
      const match = handle.match(/^([^@]+)@([^@]+)$/);
      return match ? `https://${match[2]}/@${encodeURIComponent(match[1])}` : '';
    }
    return '';
  };
  const linkedinHandle = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) return raw.replace(/^@/, '');
    try {
      const url = new URL(raw);
      const match = url.pathname.match(/\/in\/([^/?#]+)/i);
      return match ? decodeURIComponent(match[1]) : '';
    } catch {
      return '';
    }
  };
  const parseDate = (iso) => new Date(`${iso}T00:00:00`);
  const isUpcoming = (event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parseDate(event.date) >= today;
  };
  const eventView = (event) => {
    const date = parseDate(event.date);
    return {
      ...event,
      date,
      title: pick(event.title),
      place: pick(event.place),
      day: String(date.getDate()).padStart(2, '0'),
      month: MONTHS[lang][date.getMonth()],
      shortDate: `${String(date.getDate()).padStart(2, '0')} ${MONTHS[lang][date.getMonth()]}`,
      meta: `${event.time ? `${event.time} · ` : ''}${pick(event.place)}`
    };
  };
  const empty = (message) => element('p', { class: 'empty', text: message });

  function renderNavigation() {
    const nav = byId('navegacao');
    clear(nav);
    [
      ['comunidade', text('community')], ['membros', text('members')],
      ['eventos', text('events')], ['projetos', text('projects')], ['blog', text('blog')], ['conduta', text('conduct')]
    ].forEach(([id, label]) => nav.append(element('a', { href: `#${id}`, text: label, 'data-section': id })));
  }

  function renderHome(upcoming) {
    const site = state.site;
    byId('hero-title').textContent = pick(site.hero.title);
    byId('hero-text').textContent = pick(site.hero.text);
    byId('sobre-title').textContent = pick(site.home.heading);
    byId('about-text').textContent = pick(site.about);
    byId('community-title').textContent = text('community');
    byId('community-intro').textContent = pick(site.about);
    byId('members-title').textContent = text('members');
    byId('events-title').textContent = text('events');
    byId('projects-title').textContent = text('projects');
    byId('conduct-title').textContent = pick(site.conduct.title);
    byId('conduct-intro').textContent = pick(site.conduct.intro);
    byId('footer-about').textContent = pick(site.about);
    byId('footer-credit').textContent = pick(site.footer.credit);
    byId('repository-link').href = safeHref(site.footer.repo);

    const cards = byId('home-cards');
    clear(cards);
    (site.home.cards || []).forEach((card, index) => {
      const cardLink = element('a', { class: 'card', href: `#${card.route}` });
      cardLink.append(
        element('span', { class: 'card-index', text: String(index + 1).padStart(2, '0') }),
        element('h3', { text: pick(card.title) }),
        element('p', { text: pick(card.text) }),
        element('span', { class: 'card-cta', text: `${pick(card.cta)} ↓` })
      );
      cards.append(cardLink);
    });

    const next = byId('next-events');
    clear(next);
    if (!upcoming.length) next.append(empty(text('noEvents')));
    upcoming.slice(0, 2).forEach((event) => {
      const row = external(event.href || '#eventos', '', 'compact-event');
      row.append(element('time', { datetime: event.date, text: event.shortDate }), element('span', { text: event.title }));
      next.append(row);
    });
  }

  function renderCommunity() {
    const container = byId('community-cards');
    clear(container);
    (state.site.community || []).forEach((block) => {
      const card = element('article', { class: 'card' });
      const links = element('div', { class: 'card-links' });
      (block.links || []).forEach((link) => links.append(external(link.href, link.text, 'pill')));
      card.append(element('h3', { text: pick(block.title) }), element('p', { text: pick(block.text) }), links);
      container.append(card);
    });
  }

  function renderMembers() {
    const container = byId('members-list');
    clear(container);
    if (!state.members.length) container.append(empty(text('noMembers')));
    [...state.members]
      .sort((left, right) => (left.name || '').localeCompare(right.name || '', 'pt-BR', { sensitivity: 'base' }))
      .forEach((member) => {
      const card = element('article', { class: 'member-card' });
      const avatar = element('div', { class: 'avatar', role: 'img', 'aria-label': member.name });
      const linkedin = profileUrl('linkedin', member.linkedin);
      const linkedinUser = linkedinHandle(member.linkedin);
      const avatarUrl = member.avatar
        || (member.github ? `https://avatars.githubusercontent.com/${member.github}?size=250` : '')
        || (linkedinUser ? `https://unavatar.io/linkedin/user:${encodeURIComponent(linkedinUser)}` : '');
      if (avatarUrl) avatar.style.backgroundImage = `url("${avatarUrl.replace(/"/g, '%22')}")`;
      const links = element('div', { class: 'member-links' });
      if (member.github) links.append(external(`https://github.com/${member.github}`, `github/${member.github}`, 'pill'));
      if (member.twitter) links.append(external(`https://twitter.com/${member.twitter.replace('@', '')}`, member.twitter, 'pill'));
      const instagram = profileUrl('instagram', member.instagram);
      const telegram = profileUrl('telegram', member.telegram);
      const bluesky = profileUrl('bluesky', member.bluesky);
      const threads = profileUrl('threads', member.threads);
      const mastodon = profileUrl('mastodon', member.mastodon);
      if (instagram) links.append(external(instagram, 'Instagram', 'pill'));
      if (linkedin) links.append(external(linkedin, 'LinkedIn', 'pill'));
      if (telegram) links.append(external(telegram, 'Telegram', 'pill'));
      if (bluesky) links.append(external(bluesky, 'Bluesky', 'pill'));
      if (threads) links.append(external(threads, 'Threads', 'pill'));
      if (mastodon) links.append(external(mastodon, 'Mastodon', 'pill'));
      if (member.site && member.site.href) links.append(external(member.site.href, member.site.nome || 'site', 'pill'));
      if (member.email) links.append(external(`mailto:${member.email}`, 'email', 'pill'));
      card.append(avatar, element('h3', { text: member.name }), links);
      container.append(card);
      });
  }

  function renderEvents(upcoming, past) {
    const futureContainer = byId('upcoming-events');
    const pastContainer = byId('past-events');
    clear(futureContainer); clear(pastContainer);
    if (!upcoming.length) futureContainer.append(empty(text('noEvents')));
    if (!past.length) pastContainer.append(empty(text('noEvents')));
    upcoming.forEach((event) => {
      const item = external(event.href || '#eventos', '', 'event');
      const date = element('div', { class: 'event-date' }, [element('strong', { text: event.day }), element('span', { text: event.month })]);
      const details = element('div', {}, [element('div', { class: 'event-title', text: event.title }), element('div', { class: 'event-meta', text: event.meta })]);
      item.append(date, details, element('span', { class: 'event-kind', text: event.kind || 'evento' }));
      futureContainer.append(item);
    });
    past.forEach((event) => {
      const item = external(event.href || '#eventos', '', 'past-event');
      item.append(element('time', { datetime: event.date, text: event.date }), element('span', { text: event.title }), element('small', { text: event.place }));
      pastContainer.append(item);
    });
  }

  function renderProjectsAndConduct() {
    const projects = byId('project-cards');
    clear(projects);
    (state.site.projects || []).forEach((project) => {
      projects.append(element('article', { class: 'card' }, [element('h3', { text: project.title }), element('p', { text: pick(project.text) })]));
    });
    const conduct = byId('conduct-list');
    clear(conduct);
    (state.site.conduct.items || []).forEach((item) => conduct.append(element('li', { text: pick(item) })));
  }

  function renderPosts() {
    const container = byId('post-list');
    clear(container);
    if (!state.posts.length) {
      const panel = element('div', { class: 'empty-panel' });
      panel.append(element('p', { text: text('noPosts') }), element('code', { text: 'data/posts.json' }));
      container.append(panel);
      return;
    }
    state.posts.forEach((post) => {
      const item = external(post.href || '#blog', '', 'post');
      const content = element('span');
      content.append(element('strong', { text: pick(post.title) }));
      if (post.summary) content.append(element('p', { text: pick(post.summary) }));
      item.append(element('time', { datetime: post.date || '', text: post.date || '' }), content);
      container.append(item);
    });
  }

  function renderFooter() {
    const social = byId('social-links');
    clear(social);
    (state.site.social || []).forEach((link) => social.append(external(link.href, link.text)));
  }

  function setTranslatedLabels() {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = text(node.dataset.i18n); });
    const toggle = byId('language-toggle');
    toggle.textContent = lang === 'pt' ? 'EN' : 'PT';
    toggle.setAttribute('aria-label', lang === 'pt' ? 'Switch to English' : 'Mudar para português');
  }

  function render() {
    setTranslatedLabels();
    const events = state.events.map(eventView);
    const upcoming = events.filter(isUpcoming).sort((a, b) => a.date - b.date);
    const past = events.filter((event) => !isUpcoming(event)).sort((a, b) => b.date - a.date);
    renderNavigation(); renderHome(upcoming); renderCommunity(); renderMembers();
    renderEvents(upcoming, past); renderProjectsAndConduct(); renderPosts(); renderFooter(); observeSections();
  }

  let observer;
  function observeSections() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      document.querySelectorAll('.main-nav a').forEach((link) => link.classList.toggle('active', link.dataset.section === visible.target.id));
    }, { rootMargin: '-82px 0px -60% 0px' });
    SECTIONS.forEach((id) => observer.observe(byId(id)));
  }

  async function load() {
    const files = ['site.json', 'members.json', 'events.json', 'posts.json'];
    try {
      const results = await Promise.all(files.map(async (file) => {
        const response = await fetch(`data/${file}`);
        if (!response.ok) throw new Error(`${file}: ${response.status}`);
        return response.json();
      }));
      [state.site, state.members, state.events, state.posts] = results;
      state.members = Array.isArray(state.members) ? state.members : [];
      state.events = Array.isArray(state.events) ? state.events : [];
      state.posts = Array.isArray(state.posts) ? state.posts : [];
      render();
    } catch (error) {
      console.error('Could not load Python-MG content:', error);
      byId('hero-title').textContent = 'Python-MG';
      byId('hero-text').textContent = 'Não foi possível carregar os dados do site.';
    }
  }

  byId('language-toggle').addEventListener('click', () => { lang = lang === 'pt' ? 'en' : 'pt'; render(); });
  load();
})();
