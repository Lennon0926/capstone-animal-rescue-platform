# Facebook Page Access Token — Getting a Permanent Token

This document explains step by step how to obtain a **permanent Facebook Page Access Token** for the blog feed integration.

---

## Overview

Facebook issues three types of tokens:

| Token | Lifespan | Use |
|---|---|---|
| Short-lived User Token | ~1–2 hours | Testing only |
| Long-lived User Token | ~60 days | Intermediate step |
| Permanent Page Access Token | Never expires* | Production use ✅ |

*Remains valid as long as the user does not revoke app access from Facebook settings.

---

## Prerequisites

- A Facebook Developer account at [developers.facebook.com](https://developers.facebook.com)
- A Facebook App created (type: **Business** or **Consumer**)
- Admin access to the Facebook Page you want to read posts from
- The following permissions added to your app:
  - `pages_read_engagement`
  - `pages_show_list`
  - `pages_manage_posts`
  - `pages_read_user_content`

---

## Step 1 — Get a Short-lived User Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the **"App de Meta"** dropdown
3. In **"Usuario o página"**, select your **Facebook Page** (not "Token del usuario")
4. Click **"Generate Access Token"**
5. Copy the token shown — this is your **short-lived token**

> **Note:** Make sure the required permissions above are checked before generating.

---

## Step 2 — Exchange for a Long-lived User Token

Run the following `curl` command, replacing the placeholders:

```bash
curl -s "https://graph.facebook.com/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_LIVED_TOKEN}"
```

**Example:**
```bash
curl -s "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=1257024129942698&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

**Expected response:**
```json
{
  "access_token": "EAAR3Qby9RKo...",
  "token_type": "bearer",
  "expires_in": 5182000
}
```

Save the `access_token` value — this is your **long-lived user token** (~60 days).

---

## Step 3 — Get the Permanent Page Access Token

Use the long-lived user token from Step 2 to request a permanent Page Access Token:

```bash
curl -s "https://graph.facebook.com/v21.0/{PAGE_ID}?fields=access_token&access_token={LONG_LIVED_TOKEN}"
```

**Example:**
```bash
curl -s "https://graph.facebook.com/v21.0/1103824996128900?fields=access_token&access_token=LONG_LIVED_TOKEN_FROM_STEP_2"
```

**Expected response:**
```json
{
  "access_token": "EAAR3Qby9RKoBRB1jMZC...",
  "id": "1103824996128900"
}
```

The `access_token` in this response is your **permanent Page Access Token**.

---

## Step 4 — Save to `.env.local`

Open `apps/web/.env.local` and set:

```env
FB_PAGE_ID=1103824996128900
FB_ACCESS_TOKEN=PERMANENT_TOKEN_FROM_STEP_3
```

Then restart the dev server:

```bash
npm --prefix apps/web run dev
```

---

## Where to Find App ID and App Secret

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click on your app
3. Go to **Configuración → Básica**
4. Copy **App ID** and **App Secret**

> **Never commit the App Secret or any access token to version control.**
> Always keep them in `.env.local` which is listed in `.gitignore`.

---

## Verifying the Token Works

Test with curl before adding to `.env.local`:

```bash
curl -s "https://graph.facebook.com/v21.0/{PAGE_ID}/posts
  ?fields=message,created_time
  &limit=3
  &access_token={YOUR_PERMANENT_TOKEN}"
```

A successful response returns a `data` array with your posts. An empty `data: []` means either:
- The page has no public posts yet
- The token does not have the correct permissions

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Error validating application. Application has been deleted.` | The Facebook app was deleted | Create a new app and generate a new token |
| `data: []` empty array | Using User Token instead of Page Token | In Graph Explorer, switch to Page Token |
| `OAuthException` | Token expired or revoked | Repeat Steps 1–3 to get a new permanent token |
| `Invalid OAuth access token` | Wrong token pasted | Double-check `.env.local` has no extra spaces |
