# Vercel Speed Insights rollout

This branch enables Vercel Speed Insights without changing payment behavior.

- `@vercel/speed-insights` is installed as an application dependency.
- `<SpeedInsights />` is mounted once in the root Next.js layout.
- The pnpm lockfile was regenerated with pnpm 10.
- No live-payment environment variable, provider credential, or checkout gate is changed.
- After production deployment, visit the production site on desktop and mobile so Vercel can begin collecting real-user Web Vitals.
