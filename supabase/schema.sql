-- Film Haven Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussions table
CREATE TABLE IF NOT EXISTS public.discussions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  avatar TEXT,
  category TEXT DEFAULT 'general',
  likes INT DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  replies INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replies table
CREATE TABLE IF NOT EXISTS public.replies (
  id BIGSERIAL PRIMARY KEY,
  discussion_id BIGINT REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  likes INT DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  likes INT DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movie comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  movie_id TEXT NOT NULL,
  movie_type TEXT DEFAULT 'movie',
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  rating INT DEFAULT 0,
  likes INT DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  movie_type TEXT DEFAULT 'movie',
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  movie_rating TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Discussions policies
CREATE POLICY "Discussions are viewable by everyone"
  ON public.discussions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON public.discussions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their discussions"
  ON public.discussions FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their discussions"
  ON public.discussions FOR DELETE USING (auth.uid() = author_id);

-- Replies policies
CREATE POLICY "Replies are viewable by everyone"
  ON public.replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON public.replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their replies"
  ON public.replies FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their replies"
  ON public.replies FOR DELETE USING (auth.uid() = author_id);

-- Chat messages policies
CREATE POLICY "Chat messages are viewable by everyone"
  ON public.chat_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create chat messages"
  ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their messages"
  ON public.chat_messages FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their messages"
  ON public.chat_messages FOR DELETE USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their comments"
  ON public.comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their comments"
  ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
  ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discussions_updated_at
  BEFORE UPDATE ON public.discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment replies count
CREATE OR REPLACE FUNCTION public.increment_replies(discussion_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.discussions 
  SET replies = replies + 1 
  WHERE id = discussion_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;