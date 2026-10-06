# AGENTS.md

Monorepo на pnpm workspaces: Fastify + TypeScript в `apps/api`, Vite + React в `apps/web`. Node.js 20.19+ или 22.12+.

## Команды (с корня)

```bash
pnpm install               # установка зависимостей
pnpm dev                   # API (:8080) и фронтенд вместе
pnpm --filter api dev      # только API
pnpm --filter web dev      # только фронтенд
pnpm generate              # контракт TypeSpec → OpenAPI → SDK (сгенерированное не править руками)
pnpm test                  # тесты API и web (Vitest)
pnpm lint                  # ESLint + tsc --noEmit в обоих пакетах
```

Перед коммитом запускать `pnpm lint` и `pnpm test`.

## Коммиты

Conventional Commits: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`. Релизы собирает release-please из истории, поэтому формат обязателен; версия растёт только от `feat:`/`fix:`.

Ссылайтесь на связанный тикет: `feat: краткое описание (#21)` или `Refs #21`. Так связь коммит → тикет видна из истории, а не только в комментариях Issues.

## Запрещено

- Редактировать, удалять или переименовывать `.github/workflows/hexlet-check.yml` (это проверка Хекслета).
- Переименовывать репозиторий.

## Agent skills

### Issue tracker

Задачи и спецификации живут в GitHub Issues. См. `docs/agents/issue-tracker.md`.

### Triage labels

Пять меток: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. См. `docs/agents/triage-labels.md`.

### Domain docs

Один контекст: `CONTEXT.md` и `docs/adr/` в корне репозитория. См. `docs/agents/domain.md`.
