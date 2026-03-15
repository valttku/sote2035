# Digital Health Twin

A web application that connects to your Garmin or Polar wearable and visualizes your health data through a personalized digital twin. View daily activity, sleep, HRV, and respiration data, get AI-powered insights, and track trends over time.

**Live site:** https://sote2035-client.onrender.com — you can create an account and connect your device without downloading anything.

> ⚠️ **Disclaimer:** This is a student project developed at Metropolia University of Applied Sciences. It is not a production-grade application and is intended for demonstration purposes only. Use it at your own discretion.

> **Heads up for developers:** If you want to run this project locally, it is highly recommended to get API access for at least one wearable platform before getting started — the app has nothing to show without health data.
> - **Polar** — no approval needed. Register your app at [admin.polaraccesslink.com](https://admin.polaraccesslink.com) and you're ready to go.
> - **Garmin** — requires applying for Garmin Connect API access. This can take time, so apply early at [garmin.com/forms/GarminConnectDeveloperAccess](https://www.garmin.com/en-US/forms/GarminConnectDeveloperAccess/). Note that Garmin also requires a deployed HTTPS server URL for OAuth — localhost is not supported.

## Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (Neon)
- **AI:** OpenAI API
- **Testing:** Playwright
- **CI/CD:** GitHub Actions → Render

---

## Getting Started

**Requires Node.js 20 or later.**

### 1. Clone and install

```bash
git clone https://github.com/your-username/sote2035.git
cd sote2035

# Install dependencies for each package
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

> The root `npm install` installs `concurrently`, which is needed to run both client and server with a single command.

### 2. Set up environment variables

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`. At minimum you need `DATABASE_URL` and `JWT_SECRET` to run the app. All other variables are optional depending on which features you want — see the table below.

### 3. Start development

**Option A — single terminal (recommended):**

```bash
npm run dev
```

**Option B — separate terminals:**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Starts the frontend at http://localhost:3000 and the backend at http://localhost:4000. The database schema is created automatically on first run.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `4000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `PGSSLMODE` | Set to `require` for Neon or production |
| `JWT_SECRET` | Secret for signing session tokens — use a long random string |
| `APP_BASE_URL` | Frontend URL for OAuth redirects and password reset emails |
| **Polar** | |
| `POLAR_CLIENT_ID` | From [admin.polaraccesslink.com](https://admin.polaraccesslink.com) — API docs at [polar.com/accesslink-api](https://www.polar.com/accesslink-api/#polar-accesslink-api) |
| `POLAR_CLIENT_SECRET` | From Polar admin panel |
| `POLAR_REDIRECT_URI` | Must match the callback URL in Polar admin |
| `POLAR_WEBHOOK_SERVER_URL` | Deployed server URL for Polar webhook registration. Skip in local dev |
| **Garmin** | |
| `GARMIN_CLIENT_ID` | Apply for Garmin Connect API access at [garmin.com/forms/GarminConnectDeveloperAccess](https://www.garmin.com/en-US/forms/GarminConnectDeveloperAccess/) |
| `GARMIN_CLIENT_SECRET` | From Garmin Developer Portal |
| `GARMIN_REDIRECT_URI` | Must be a deployed HTTPS URL — Garmin does not support localhost |
| **Email** | |
| `MAIL_USER` | Gmail address for password reset emails |
| `MAIL_PASS` | Gmail app password ([guide](https://support.google.com/accounts/answer/185833)) |
| **AI** | |
| `OPENAI_API_KEY` | From [platform.openai.com](https://platform.openai.com) |

---

## Tests

The app must be running on http://localhost:3000 before running tests.

```bash
cd client

npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright UI (recommended)
npm run test:e2e:headed   # with browser visible
```

---

## Deployment

The project runs on [Render](https://render.com) as two separate Web Services — client and server. GitHub Actions runs lint, typecheck, and build on every PR and push to `main`. A successful merge to `main` triggers automatic deploys via Render deploy hooks.

To set up: add `RENDER_SERVER_DEPLOY_HOOK` and `RENDER_CLIENT_DEPLOY_HOOK` as GitHub Actions secrets, and set all environment variables in the Render dashboard.

---

## Project Structure

```
sote2035/
├── client/
│   ├── src/
│   │   ├── app/             # Pages (Next.js App Router)
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Translations (English / Finnish)
│   │   └── proxy.ts         # Auth guard (Next.js 16 middleware)
│   └── tests/e2e/           # Playwright tests
│
└── server/
    └── src/
        ├── ai/              # Chat AI service and safety guard
        ├── config/          # Environment config
        ├── db/
        │   ├── digitalTwin/ # Health metrics queries for home page
        │   ├── garminTables/# Garmin data mappers
        │   ├── polarTables/ # Polar data mappers
        │   ├── init/        # Schema initialization
        │   └── users/       # User queries
        ├── middleware/      # Auth and error handling
        ├── routes/
        │   ├── integrations/# OAuth flows (Garmin, Polar)
        │   └── webhooks/    # Webhook receivers (Garmin, Polar)
        └── services/
            ├── garmin-oauth/# PKCE, token exchange, state store
            ├── healthInsightsService.ts
            ├── homeService.ts
            ├── polarBackfill.ts
            ├── polarWebhookSetup.ts
            ├── openAIService.ts
            └── emailService.ts
```