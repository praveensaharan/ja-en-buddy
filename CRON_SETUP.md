# Daily Summary Cron Setup

## What Changed

- ✅ Removed `node-cron` from server (no more in-memory cron)
- ✅ Added API endpoint: `POST /api/cron/daily-summary`
- ✅ GitHub Actions workflow triggers the API daily at 9 PM Tokyo time

## Setup Instructions

### 1. Add Environment Variable

Add to your `.env` file:
```
CRON_SECRET=your-random-secret-here
```

Generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
- `APP_URL` - Your Azure App Service URL (e.g., `https://your-app.azurewebsites.net`)
- `CRON_SECRET` - Same value as in your `.env`

### 3. Deploy

Push the code to GitHub. The workflow will:
- Run daily at 9 PM Tokyo time (12:00 UTC)
- Can be manually triggered from Actions tab

## Manual Test

Test the endpoint locally:
```bash
curl -X POST http://localhost:5000/api/cron/daily-summary \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-secret-here"}'
```

## How It Works

1. GitHub Actions runs on schedule
2. Sends POST request to your API
3. API checks secret token
4. Generates summary if needed
5. Sends email
6. Returns success/failure
