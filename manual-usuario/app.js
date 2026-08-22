const sections = [...document.querySelectorAll('.manual-section')];
const sidebar = document.querySelector('.sidebar');
const navScrim = document.querySelector('.nav-scrim');
const navToggle = document.querySelector('.nav-toggle');
const sidebarLinks = [...document.querySelectorAll('.sidebar nav a')];
const onPageNav = document.querySelector('#on-page-nav');
const progress = document.querySelector('#reading-progress');
const backToTop = document.querySelector('#back-to-top');
const search = document.querySelector('#manual-search');
const searchResults = document.querySelector('#search-results');

const normalize = (value) => value
  .toLocaleLowerCase('es')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const slugify = (value) => normalize(value)
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const usedIds = new Set(sections.map((section) => section.id));
document.querySelectorAll('.manual-section h3').forEach((heading) => {
  const base = slugify(heading.textContent) || 'tema';
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) id = `${base}-${suffix++}`;
  heading.id = id;
  usedIds.add(id);
});
if (location.hash) {
  requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
}

const searchable = [
  ...sections.map((section) => ({
    id: section.id,
    title: section.dataset.title || section.querySelector('h2,h1')?.textContent || section.id,
    context: 'Capítulo',
    text: normalize(section.textContent.replace(/\s+/g, ' ').trim())
  })),
  ...[...document.querySelectorAll('.manual-section h3')].map((heading) => ({
    id: heading.id,
    title: heading.textContent.trim(),
    context: heading.closest('.manual-section')?.dataset.title || 'Tema',
    text: normalize(`${heading.textContent} ${heading.nextElementSibling?.textContent || ''}`)
  }))
];

onPageNav.innerHTML = sections
  .map((section) => `<a href="#${section.id}">${section.dataset.title}</a>`)
  .join('');

function setActiveSection(id) {
  sidebarLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${id}`));
  [...onPageNav.children].forEach((link) => link.classList.toggle('active', link.hash === `#${id}`));
}

const sectionObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) setActiveSection(visible.target.id);
}, { rootMargin: '-18% 0px -65% 0px', threshold: [0, .2, .6] });

sections.forEach((section) => sectionObserver.observe(section));

function updateReadingProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  backToTop.classList.toggle('visible', window.scrollY > 900);
}

window.addEventListener('scroll', updateReadingProgress, { passive: true });
updateReadingProgress();

function setMobileNav(open, { restoreFocus = false } = {}) {
  sidebar.classList.toggle('open', open);
  navScrim.classList.toggle('visible', open);
  document.body.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.textContent = open ? 'Cerrar índice' : 'Abrir índice';
  if (open) sidebar.focus();
  if (!open && restoreFocus) navToggle.focus();
}

navToggle.addEventListener('click', () => setMobileNav(!sidebar.classList.contains('open')));
navScrim.addEventListener('click', () => setMobileNav(false, { restoreFocus: true }));

sidebar.addEventListener('click', (event) => {
  if (event.target.closest('a') && window.innerWidth <= 820) {
    setMobileNav(false);
  }
});

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function closeSearch() {
  searchResults.hidden = true;
  searchResults.innerHTML = '';
  search.setAttribute('aria-expanded', 'false');
}

function runSearch() {
  const query = normalize(search.value.trim());
  if (query.length < 2) {
    closeSearch();
    return;
  }
  const words = query.split(/\s+/).filter(Boolean);
  const results = searchable
    .map((item) => ({ ...item, score: words.reduce((score, word) => score + (item.text.includes(word) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  searchResults.innerHTML = results.length
    ? results.map((item, index) => `<a id="search-option-${index}" role="option" href="#${item.id}"><strong>${item.title}</strong><small>${item.context} · ${item.score === words.length ? 'Coincidencia directa' : 'Tema relacionado'}</small></a>`).join('')
    : '<span class="no-results">No encontramos ese tema. Pruebe con otra palabra, por ejemplo “APU”, “revisión” o “BIM”.</span>';
  searchResults.hidden = false;
  search.setAttribute('aria-expanded', 'true');
}

search.addEventListener('input', runSearch);
search.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' && !searchResults.hidden) {
    event.preventDefault();
    searchResults.querySelector('a')?.focus();
  }
  if (event.key === 'Escape') {
    closeSearch();
    search.blur();
  }
});

searchResults.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeSearch();
});
searchResults.addEventListener('keydown', (event) => {
  const options = [...searchResults.querySelectorAll('a')];
  const current = options.indexOf(document.activeElement);
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    options[(current + 1) % options.length]?.focus();
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (current <= 0) search.focus();
    else options[current - 1]?.focus();
  }
  if (event.key === 'Escape') {
    closeSearch();
    search.focus();
  }
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.search-wrap')) closeSearch();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sidebar.classList.contains('open')) {
    setMobileNav(false, { restoreFocus: true });
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    search.focus();
    search.select();
  }
});
