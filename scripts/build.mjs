/** Собираем полностью статическую версию без внешних зависимостей. */
import { cp, mkdir, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  copyFile(resolve(root, 'index.html'), resolve(output, 'index.html')),
  cp(resolve(root, 'src'), resolve(output, 'src'), { recursive: true }),
  cp(resolve(root, 'public'), resolve(output, 'public'), { recursive: true }),
]);
console.log('ATLAS: статическая сборка создана в dist/');
