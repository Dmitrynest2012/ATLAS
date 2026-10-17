/**
 * ATLAS — базовый интерфейс v0.1.0.
 * Здесь нет авторизации, аватаров или медицинских данных.
 */

const STORAGE_KEY = 'atlas.sidebar.collapsed.v1';
const BREAKPOINT = 860;
const guestName = 'Гость';
const pages = {
  home: {
    title: 'Главная',
    subtitle: 'Ваше персональное пространство в ATLAS.',
    welcome: 'Здоровье начинается с внимания к себе.',
    description: 'Основа портала готова. Здесь появятся инструменты, сервисы и полезные материалы для сотрудников.',
  },
  health: {
    title: 'Моё здоровье',
    subtitle: 'Раздел персонального здоровья — в разработке.',
    welcome: 'Забота о себе — каждый день.',
    description: 'Здесь будет личный раздел сотрудника. Пока он не собирает и не отображает медицинские данные.',
  },
  metrics: {
    title: 'Показатели',
    subtitle: 'Место для будущих показателей и аналитики.',
    welcome: 'Важные показатели — в одном месте.',
    description: 'На этом этапе это только экран-заготовка. Подключение реальных показателей ещё не реализовано.',
  },
  resources: {
    title: 'Материалы',
    subtitle: 'Будущая библиотека полезной информации.',
    welcome: 'Знания помогают заботиться о здоровье.',
    description: 'Позже здесь появятся материалы для сотрудников. На текущем этапе раздел демонстрационный.',
  },
  settings: {
    title: 'Настройки',
    subtitle: 'Персональные настройки портала — в разработке.',
    welcome: 'Настраивайте ATLAS под себя.',
    description: 'Сейчас доступна только настройка ширины боковой панели. Остальные параметры появятся позднее.',
  },
};

const shell = document.querySelector('#app');
const toggleButton = document.querySelector('#sidebarToggle');
const backdrop = document.querySelector('#sidebarBackdrop');
const navButtons = [...document.querySelectorAll('[data-page]')];
const menu = document.querySelector('#userMenu');
const menuTrigger = document.querySelector('#userMenuTrigger');
const menuPopup = document.querySelector('#userMenuPopup');
let collapsed = false;
let mobileOpen = false;

/** Безопасно читаем настройку даже при блокировке localStorage. */
function readCollapsed() {
  try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
  catch { return false; }
}

function saveCollapsed(value) {
  try { localStorage.setItem(STORAGE_KEY, String(value)); }
  catch { /* Режим без локального хранилища. */ }
}

function isMobile() { return window.innerWidth <= BREAKPOINT; }

/** Обновляем обе версии панели: компактную desktop и выдвижную mobile. */
function syncSidebar() {
  shell.classList.toggle('is-collapsed', collapsed && !isMobile());
  shell.classList.toggle('is-mobile-open', mobileOpen && isMobile());
  backdrop.hidden = !(mobileOpen && isMobile());
  const expanded = isMobile() ? mobileOpen : !collapsed;
  toggleButton.setAttribute('aria-expanded', String(expanded));
  toggleButton.setAttribute('aria-label', isMobile()
    ? (mobileOpen ? 'Закрыть боковую панель' : 'Открыть боковую панель')
    : (collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'));
  document.querySelector('#sidebar').inert = isMobile() && !mobileOpen;
}

function setMenuOpen(open) {
  menu.classList.toggle('is-open', open);
  menuTrigger.setAttribute('aria-expanded', String(open));
  menuPopup.hidden = !open;
}

function selectPage(pageKey) {
  const key = Object.hasOwn(pages, pageKey) ? pageKey : 'home';
  const page = pages[key];
  document.querySelector('#pageTitle').textContent = page.title;
  document.querySelector('#pageSubtitle').textContent = page.subtitle;
  document.querySelector('#welcomeTitle').textContent = page.welcome;
  document.querySelector('#welcomeDescription').textContent = page.description;
  navButtons.forEach((button) => {
    const active = button.dataset.page === key;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.title = `${page.title} — ATLAS`;
  if (mobileOpen) { mobileOpen = false; syncSidebar(); }
}

toggleButton.addEventListener('click', () => {
  if (isMobile()) mobileOpen = !mobileOpen;
  else { collapsed = !collapsed; saveCollapsed(collapsed); }
  syncSidebar();
});
backdrop.addEventListener('click', () => { mobileOpen = false; syncSidebar(); });
window.addEventListener('resize', () => { if (!isMobile()) mobileOpen = false; syncSidebar(); });

// Пока нет профиля и аватаров: выводим единственную букву имени гостя.
document.querySelector('#userName').textContent = guestName;
document.querySelector('#userInitial').textContent = Array.from(guestName.trim())[0]?.toLocaleUpperCase('ru') ?? 'Г';
menuTrigger.addEventListener('click', () => setMenuOpen(menuPopup.hidden));
document.addEventListener('pointerdown', (event) => {
  if (!menu.contains(event.target)) setMenuOpen(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!menuPopup.hidden) { setMenuOpen(false); menuTrigger.focus(); }
    if (mobileOpen) { mobileOpen = false; syncSidebar(); toggleButton.focus(); }
  }
});

navButtons.forEach((button) => button.addEventListener('click', () => {
  const hash = `#${button.dataset.page}`;
  if (window.location.hash === hash) selectPage(button.dataset.page);
  else window.location.hash = hash;
  setMenuOpen(false);
}));
window.addEventListener('hashchange', () => selectPage(window.location.hash.slice(1)));

collapsed = readCollapsed();
selectPage(window.location.hash.slice(1));
syncSidebar();
