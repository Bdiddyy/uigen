# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time: install deps + generate Prisma client + run migrations
npm run dev          # Dev server with Turbopack (http://localhost:3000)
npm run dev:daemon   # Dev server in background, logs to logs.txt
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run db:reset     # Force-reset database migrations
```

Run a single test file:

```bash
npm run test -- src/lib/__tests__/file-system.test.ts
```

Prisma database commands:

```bash
npx prisma generate                   # Regenerate client after schema changes
npx prisma migrate dev                # Apply pending migrations (dev)
npx prisma migrate dev --name <name>  # Create + apply a new named migration
npx prisma studio                     # Open database GUI at http://localhost:5555
npx prisma migrate reset --force      # Drop and recreate the database
```

## Environment

- `ANTHROPIC_API_KEY` in `.env` — optional. Without it, a mock provider returns static component examples (useful for dev without API costs).
- `JWT_SECRET` — defaults to `"development-secret-key"` locally.
- Database: SQLite at `prisma/dev.db`, auto-created on migration.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language; Claude generates code into a virtual (in-memory) file system; a preview iframe renders the result in real time.

### Request / data flow

1. User types in the chat → `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `POST /api/chat`
2. `src/app/api/chat/route.ts` calls `streamText()` with Claude and two tools:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — view / create / edit virtual files
   - `file_manager` (`src/lib/tools/file-manager.ts`) — list / delete / rename virtual files
3. Tool calls mutate the virtual file system state; results stream back to the client
4. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) re-renders the preview iframe on each update
5. On stream finish, project state (messages + file tree as JSON) is persisted to SQLite via a Prisma server action

### Virtual file system

`src/lib/file-system.ts` (~520 lines) is the core data structure — an in-memory file tree. It is **not** disk-backed. The full serialized tree is sent with every `/api/chat` request so the server is stateless between turns. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) exposes it to the component tree.

### Authentication

JWT sessions stored in HTTP-only cookies. `src/lib/auth.ts` provides `createSession / getSession / verifySession / deleteSession`. All auth and project CRUD uses Next.js Server Actions in `src/actions/`. `src/middleware.ts` protects `/api/projects` and `/api/filesystem` routes. Anonymous users can use the chat without persistence.

### UI layout

Three resizable panels (`react-resizable-panels`) managed in `src/app/main-content.tsx`:

- **Chat** (35% default) — `src/components/chat/`
- **Preview** — `src/components/preview/PreviewFrame.tsx` (iframe)
- **Code** — File tree (`src/components/editor/FileTree.tsx`) + Monaco editor (`src/components/editor/CodeEditor.tsx`)

### AI provider

`src/lib/provider.ts` returns either the real Anthropic model or a mock that produces deterministic static output. The system prompt for component generation lives in `src/lib/prompts/generation.tsx`.

### Database schema

Two Prisma models (SQLite):

- `User` — email + bcrypt password
- `Project` — belongs to optional `User`; `messages` and `data` (file tree) stored as JSON blobs

## Key paths

| Concern | Path |
|---|---|
| Chat API route | `src/app/api/chat/route.ts` |
| Virtual file system | `src/lib/file-system.ts` |
| AI provider / model selection | `src/lib/provider.ts` |
| System prompt | `src/lib/prompts/generation.tsx` |
| Chat context (streaming) | `src/lib/contexts/chat-context.tsx` |
| Auth utilities | `src/lib/auth.ts` |
| Server actions | `src/actions/` |
| Main UI layout | `src/app/main-content.tsx` |
| DB schema | `prisma/schema.prisma` |

## Testing

Tests use Vitest + jsdom + React Testing Library. Test files live alongside source in `__tests__/` subdirectories. Coverage spans the virtual file system, JSX transformer, chat context, and several UI components.

## Code style

Only add comments when the code is genuinely complex and the intent isn't obvious from reading it. Avoid commenting straightforward logic, restating what the code does, or explaining things well-named identifiers already convey.
