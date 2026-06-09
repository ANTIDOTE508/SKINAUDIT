<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Database — Prisma rules

- **NEVER run `prisma migrate dev` or `prisma migrate deploy` or any migration command** — schema changes are applied manually by the developer via raw SQL or external tooling
- After ANY Prisma schema change: run `pnpm db:generate` then `rm -rf .next` (Turbopack cache does not pick up new Prisma types automatically)
- All camelCase Prisma fields must have `@map("snake_case")` — no exceptions; missing `@map` causes runtime column-not-found errors
- `userId` fields must always be `@map("user_id")`

## Auth — Better Auth rules

- Never call `createAuthClient()` directly — always import the shared client: `import { authClient } from '@/lib/auth-client'`
- Every server action must call `await requireSession()` as its first line — no exceptions (security boundary)
- Session read in server context: `auth.api.getSession({ headers: await headers() })`

## GSAP animation rules

- Always wrap GSAP code in `gsap.context()` and return `ctx.revert()` for cleanup
- Capture `const node = ref.current` before any tween — never reference a ref inside a tween callback (may be null after unmount)

## Onboarding wizard

- Onboarding is complete when `onboardingCompletedAt != null` — not when `profile != null`
- Resume step formula: `initialStep >= 2 ? initialStep + 1 : 1` (step 1 welcome is skipped on resume)
