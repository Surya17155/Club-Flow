
-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'social_media_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technical_pr_head';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technical_pr_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'general_secretary';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'deputy_secretary';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'treasurer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'deputy_treasurer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant_treasurer';
