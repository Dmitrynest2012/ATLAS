/** Простая проверка связности базового интерфейса. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [html, js, css] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
]);
for (const id of ['app', 'sidebarToggle', 'sidebar', 'mainContent', 'userInitial', 'userName', 'userMenuTrigger', 'userMenuPopup', 'sidebarBackdrop']) {
  assert.match(html, new RegExp(`id="${id}"`), `Отсутствует элемент ${id}`);
}
for (const page of ['home', 'health', 'metrics', 'resources', 'settings']) {
  assert.match(html, new RegExp(`data-page="${page}"`), `Отсутствует навигация ${page}`);
}
assert.match(js, /localStorage\.setItem/);
assert.match(css, /prefers-reduced-motion/);
assert.match(html, /<html lang="ru">/);
console.log('ATLAS: базовая структура проверена.');
