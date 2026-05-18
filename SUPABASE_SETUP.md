# Film Haven - Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your Project URL and anon key from Settings > API

## 2. Run Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL

## 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_TMDB_API_KEY=5379707d6401cbd1e2f7d1d2b8576fce
```

## 4. Enable Real-time (for chat)

1. Go to Database > Replication in Supabase
2. Enable replication for `chat_messages` table

## 5. Deploy

```bash
npm run build
npm run preview
```

## Features with Supabase

- **Real-time chat** - messages appear instantly without refresh
- **Persistent user data** - profile, avatar, favorites survive browser clear
- **Auth** - email/password authentication
- **RLS policies** - users can only modify their own data

## Fallback

If Supabase is not configured, the app automatically falls back to localStorage.