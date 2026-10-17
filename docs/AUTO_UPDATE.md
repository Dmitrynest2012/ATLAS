# ATLAS — автоматическое обновление

## Поток разработки

```text
Коммит в GitHub main
     ├── GitHub Actions → npm ci → check → build → GitHub Pages
     └── Windows Task Scheduler (каждые 5 мин)
           → git fetch → проверка чистоты и истории → git merge --ff-only
           → npm ci --ignore-scripts, только если изменён package*.json
           → VS Code видит обновлённые файлы на диске
```

Это **два независимых механизма**. Сайт на GitHub Pages обновляется из Actions; исходники локального клона обновляются в Windows через Планировщик. VS Code сам по себе не выполняет автоматический `git pull`.

## Установка на Windows (один раз)

Требуются Git for Windows, Node.js LTS, локальный `git clone` и Windows PowerShell 5.1+.

```powershell
cd ПУТЬ_К_ПАПКЕ_ATLAS
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-auto-sync.ps1
```

Создаётся задание `ATLAS-AutoSync`, проверяющее GitHub каждые пять минут (первый запуск примерно через минуту). Задание работает без открытого VS Code и без npm dev-сервера, пока работает Windows и доступны сеть и Git. Планировщик не может синхронизировать выключенный компьютер.

Проверка:

```powershell
Get-ScheduledTask -TaskName ATLAS-AutoSync
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-atlas.ps1
Get-Content "$env:LOCALAPPDATA\ATLAS\auto-sync\sync.log" -Tail 20
```

Изменение частоты (например, 10 минут):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-auto-sync.ps1 -EveryMinutes 10
```

Отключение:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\remove-auto-sync.ps1
```

## Предохранители

- Обновляем только локальную ветку `main` и проверенный `origin` `Dmitrynest2012/ATLAS`.
- Есть локальные изменения, неизвестные файлы, другая ветка или расходящаяся история — **никакого слияния**. Лог указывает причину.
- `git reset --hard`, удаление пользовательских файлов и принудительные слияния запрещены.
- npm запускается **только после изменения** `package.json` / `package-lock.json`; `--ignore-scripts` блокирует исполнение install/postinstall-скриптов пакетов.
- Флаг несостоявшегося `npm ci` хранится вне репозитория, чтобы установка была повторена на следующем цикле.
- Логи и состояние лежат в `%LOCALAPPDATA%\ATLAS\auto-sync\`, а не в рабочей папке.
- Git не может видеть **несохранённые буферы** VS Code — сохраняйте изменения перед уходом; для собственных правок желательно работать в отдельной ветке.

## Если автообновление остановилось

1. Проверьте журнал и `git status`.
2. Если были ваши правки — сохраните их в отдельной ветке/коммите и лишь затем возвращайтесь на чистую `main`.
3. Убедитесь, что `git remote -v` указывает на ATLAS и доступен интернет.
4. Проверьте состояние задания командой `Get-ScheduledTask -TaskName ATLAS-AutoSync`.
5. Если изменялись npm-пакеты, проверьте `npm ci` и журнал.

**Важно:** автоматическое обновление *файлов* не означает, что сайт локально запущен. Для браузерного режима `http://127.0.0.1:5173` dev-сервер `npm run dev` нужен, пока вы хотите просматривать сайт локально. Публичная версия обновляется без вашего компьютера.

## GitHub Pages

Workflow `.github/workflows/pages.yml` запускается при коммитах в `main`. Для первого деплоя в репозитории нужно один раз открыть `Settings → Pages` и выбрать `Source: GitHub Actions`. После успешного deploy адрес страницы обычно `https://dmitrynest2012.github.io/ATLAS/`. Если Pages ещё не включён, сборка может пройти, но публикация завершится ошибкой — выполните первичную настройку.
