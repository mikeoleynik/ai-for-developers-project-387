# Календарь звонков


[![hexlet-check](https://github.com/mikeoleynik/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/mikeoleynik/ai-for-developers-project-387/actions)

**Демо:** https://call-calendar-rw6w.onrender.com — публичный деплой на Render (бесплатный тариф, первый запрос после простоя может занять до минуты).

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- Монорепо на pnpm workspaces
- Бекенд: Fastify + TypeScript (`apps/api`)
- Фронтенд: Vite + React + TypeScript + shadcn/ui (`apps/web`)
- Тесты: Vitest (API и web)
- Контракт: TypeSpec → OpenAPI → клиентский SDK
- Линтер: ESLint (flat config) + `tsc --noEmit`
- Релизы: release-please поверх Conventional Commits

## Требования

- Node.js 20.19+ или 22.12+
- pnpm (версия закреплена полем `packageManager`, например через corepack)

## Установка

```bash
git clone https://github.com/mikeoleynik/ai-for-developers-project-387.git
cd ai-for-developers-project-387
pnpm install
```

## Использование

```bash
pnpm dev               # API и фронтенд одновременно
pnpm --filter api dev  # только API (порт 8080)
pnpm --filter web dev  # только фронтенд
pnpm generate          # перегенерировать контракт (OpenAPI + SDK)
pnpm test              # тесты API и web
pnpm lint              # ESLint + проверка типов
```

## Контракт и кодогенерация

Контракт API — единый источник правды, описан в [TypeSpec](https://typespec.io/) в `apps/api/tsp/main.tsp`. Из него одной командой генерируется:

- OpenAPI-спецификация — `apps/api/generated/openapi.yaml`;
- типизированный клиентский SDK для фронтенда — `apps/web/src/client` (heyapi/openapi-ts);
- серверные маршруты и валидация присоединяются из OpenAPI через `fastify-openapi-glue`.

Сгенерированные файлы коммитятся и не правятся руками.

Поднятый API отвечает на `GET http://localhost:8080/ping` телом `pong`.

## Docker

Образ собирается из `Dockerfile` и запускает API вместе с собранным фронтендом в одном процессе.

```bash
docker build -t call-calendar .
docker run --rm -p 8080:8080 call-calendar
```

Приложение слушает порт из переменной окружения `PORT` (по умолчанию `8080`). В контейнере API смонтирован под префиксом `/api`, а статика фронтенда и SPA-fallback отдаются с корня (`SERVE_WEB=true`, `API_PREFIX=api`). Брони хранятся в SQLite внутри контейнера.

## Агент в GitHub Actions

Агент запускается внутри GitHub Actions через [OpenCode GitHub App](https://opencode.ai/docs/github/). Модель у всех воркфлоу одна — `opencode/deepseek-v4.1-flash`; ключ провайдера лежит в секрете `OPENCODE_API_KEY`.

### Воркфлоу

| Воркфлоу | Событие | Назначение | Прогоны |
| --- | --- | --- | --- |
| `opencode.yml` | `issue_comment`, `pull_request_review_comment` с командой `/oc` | Интерактивный вызов: объяснить issue, внести правку, ответить на замечание в diff | Actions → **opencode** |
| `opencode-triage.yml` | `issues: [opened]` | Авторазбор новой задачи: причина, затронутый код, путь, постановка | Actions → **opencode-triage** |
| `opencode-review.yml` | `pull_request: [opened, synchronize, reopened, ready_for_review]` | Авторевью pull request по критериям из `prompt` | Actions → **opencode-review** |
| `opencode-scheduled.yml` | `schedule` (03:00 МСК) и `workflow_dispatch` | Ночная проверка Lighthouse: отчёт артефактом + issue с находками | Actions → **opencode-scheduled** |
| `ci.yml` | `push`, `pull_request` | Линт и тесты (API, web, e2e) | Actions → **CI** |
| `hexlet-check.yml` | `push`, теги | Проверка Хекслета | Actions → **hexlet-check** |
| `release-please.yml` | `push` в `main` | Release-PR из Conventional Commits | Actions → **release-please** |

Отчёт Lighthouse лежит в артефакте `lighthouse-report` соответствующего прогона (страница прогона → блок Artifacts).

### Решения

- **Вызов агента.** Команда сужена до `/oc` (`mentions: '/oc'`). Реагируем только на участников проекта (`author_association` = `OWNER`/`MEMBER`/`COLLABORATOR`) и отсекаем события от ботов (`*[bot]`) — иначе ответ агента сам является комментарием и запускает новый прогон. Публичный адрес проверки вынесен в переменную репозитория `APP_URL`.
- **Права — по воркфлоу, а не на весь репозиторий.** Интерактивные воркфлоу (`opencode`, `opencode-triage`) ходят через GitHub App по OIDC (`id-token: write`) и раннеру хватает чтения. Запись выдана только там, где агент публикует результат сам: `opencode-review` пишет замечания токеном раннера (`pull-requests: write`, `issues: write`), `opencode-scheduled` создаёт issue и может открывать ветки/PR (`contents: write`, `pull-requests: write`, `issues: write`).
- **Публикация сессий.** Репозиторий публичный, поэтому `share` включён по умолчанию; мы осознанно ставим `share: false` — контекст агента может содержать детали окружения, а ссылка на сессию остаётся публичной навсегда.

### Самооценка

С первого прохода получилось: разбор issue по `/oc explain`, автотриаж новых задач, создание PR по issue с привязкой `Closes #N`, правка в той же ветке по inline-замечанию, ночной отчёт Lighthouse с issue по находкам.

Потребовало итераций: сообщения коммитов агента не соответствовали Conventional Commits — правили в два круга; авторевью не запускается на PR, открытых/обновлённых ботом (action проверяет права актора, а у `opencode-agent[bot]` их нет) — проверяли на PR от человека; агенту для `gh issue create` нужен `GITHUB_TOKEN` в окружении шага; release-please потребовал включить в настройках репозитория «Allow GitHub Actions to create and approve pull requests»; часть прогонов падала на транзиентном шаге определения версии action.

## План развития

Дальнейшие фичи и баги, которые разбирает агент, — в [PLAN.md](PLAN.md).

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
