# 🚀 Groove Music Bot - Deployment Guide

This guide covers how to deploy **Groove Music Bot** quickly and easily on **Vercel** as well as 24/7 background hosts.

---

## ⚡ Option 1: Vercel Deployment (Web Dashboard & Status API)

Vercel provides instant serverless hosting for the Groove Music Bot Web Dashboard & Status API.

### Step 1: Push to GitHub / GitLab
Make sure your bot code is pushed to your GitHub or GitLab repository.

### Step 2: Deploy on Vercel
1. Go to [Vercel.com](https://vercel.com) and click **Add New** -> **Project**.
2. Import your **Groove Music Bot** repository.
3. In **Environment Variables**, add the following:
   - `TOKEN`: Your Discord Bot Token
   - `PREFIX`: `.` (or your preferred prefix)
   - `SPOTIFY_ID`: Your Spotify API Client ID
   - `SPOTIFY_SECRET`: Your Spotify API Client Secret
   - `LAVALINK_HOST`: `lavalinkv4.serenetia.com:443`
   - `LAVALINK_AUTH`: `https://seretia.link/discord`
4. Click **Deploy**.

> **Note on Vercel Architecture:**  
> Vercel hosts the Web Dashboard and `/api` health endpoints. Because Discord Gateway WebSockets & Voice streaming require a 24/7 persistent process, pair your Vercel deployment with a continuous background runner (Option 2 below) if you need 24/7 music playback.

---

## 🟢 Option 2: 24/7 Discord Bot Hosting (Railway, Render, Docker)

To keep the Discord Bot continuously online and connected to voice channels 24/7:

### A. Railway (Recommended - 1 Click)
1. Sign up on [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your Groove Music Bot repo.
4. Add Environment Variables (`TOKEN`, `PREFIX`, `SPOTIFY_ID`, `SPOTIFY_SECRET`, `LAVALINK_HOST`, etc.).
5. Railway will automatically build and keep the bot online 24/7!

### B. Render.com
1. Go to [Render.com](https://render.com) and create a **Web Service**.
2. Connect your GitHub repository.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variables in the Render Dashboard.

### C. Docker Container
Build and run using Docker:
```bash
docker build -t groove-bot .
docker run -d --name groove-music-bot -p 3000:3000 --env-file .env groove-bot
```

---

## ⚙️ Environment Variables Summary

| Variable | Description | Example |
|---|---|---|
| `TOKEN` | Discord Bot Token | `MTUzNzA0MjIx...` |
| `PREFIX` | Command Prefix | `.` |
| `OWNER_ID` | Bot Owner User ID(s) | `986687943789932656` |
| `SPOTIFY_ID` | Spotify Client ID | `85aab1d51a...` |
| `SPOTIFY_SECRET` | Spotify Client Secret | `b2ad05aa7...` |
| `LAVALINK_HOST` | Lavalink Server Address | `lavalinkv4.serenetia.com:443` |
| `LAVALINK_AUTH` | Lavalink Server Password | `https://seretia.link/discord` |
| `PORT` | Web Server & Keepalive Port | `3000` |
