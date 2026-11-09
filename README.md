# Collaborative Documents

Stage 1 is a private document application built with Next.js, Better Auth, Prisma, and PostgreSQL. Google is the only enabled sign-in provider. Document CRUD is the next implementation step.

## Local setup

1. Install dependencies with `npm install`.
2. Start PostgreSQL and create a database for this project.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 random characters), `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
4. In Google Cloud Console, create a Web application OAuth client. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Use the exact deployed origin with `/api/auth/callback/google` in production.
5. Run `npm run db:migrate` and `npm run db:generate`.
6. Run `npm run dev` and open `http://localhost:3000/login`.

The configured `BETTER_AUTH_URL` must match the browser origin. Keep `.env` private; only `.env.example` is committed.

## Checks

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. To verify authentication end to end, sign in with Google, refresh `/dashboard`, sign out, and confirm `/dashboard` redirects to `/login`.
