# Trading Journal

A free, local-first personal trading journal built with React + Vite.

## What this app does

- Add trades with setup, strategy, emotion, notes, and risk details
- Auto-calculate P&L
- Show dashboard KPIs: net P&L, win rate, profit factor, best trade
- Show insights and basic strategy summary
- Filter trades by setup or symbol
- Export all trades as JSON
- Import previously exported JSON
- Reset local data safely
- Save data in the browser using localStorage

## Run locally

1. Open the project in VS Code.
2. In terminal, run:

   ```bash
   npm install
   npm run dev -- --host 0.0.0.0
   ```

3. Open this in your browser:

   ```text
   http://localhost:5173/
   ```

## Free deployment options

### Cloudflare Pages
- Best choice for this app
- Free static hosting
- Free subdomain like `your-project.pages.dev`
- Very good for React apps

### Vercel
- Easy React hosting
- Free hobby plan
- Free subdomain like `your-project.vercel.app`

### Netlify
- Also free
- Simple for front-end static apps

### GitHub Pages
- Free, but only static hosting
- Good if you do not need DB/auth later

## Recommended future stack

Use this later when you want database + login:

- Frontend: React + Vite
- Hosting: Cloudflare Pages or Vercel
- Database/Auth: Supabase free tier
- Charts: Recharts

## Supabase setup (future step)

1. Create a Supabase project.
2. Copy `.env.example` to `.env`.
3. Add your Supabase URL and anon key.
4. Connect your app later to a `trades` table for live storage.

## Notes

This version is intentionally local-first and keeps things simple so you can use it without buying a domain or paying for hosting.
