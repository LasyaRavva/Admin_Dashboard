# Deployment Guide

This project is a Vite frontend that talks directly to Supabase, so you can deploy it as a static site.

## Before Deploying

1. Make sure your Supabase schema is applied from `supabase/schema.sql`.
2. Create at least one user in Supabase Auth so you can log in after deploy.
3. Copy `.env.example` to `.env` locally and keep the real values out of git.

## Required Environment Variables

Add these in your hosting provider dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are safe to expose in the frontend as long as your Supabase Row Level Security policies are correct.

## Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Framework preset: `Vite`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add the two `VITE_...` environment variables.
7. Deploy.

## Netlify

1. Push the project to GitHub.
2. Create a new site from the repo in Netlify.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add the two `VITE_...` environment variables.
6. Deploy.

## Local Production Check

Run this before deploying:

```bash
npm run build
```

If the build succeeds, the generated production files will be in `dist/`.

## Important Security Note

The app currently depends on Supabase policies for protection. Before going live, review the write policies on `jobs` and `saved_jobs` so only the right users can create, edit, or delete data.
