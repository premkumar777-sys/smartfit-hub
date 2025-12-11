-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to send welcome email via edge function
CREATE OR REPLACE FUNCTION public.send_welcome_email(user_email TEXT, user_name TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  function_url text;
  supabase_url text;
  service_key text;
BEGIN
  -- Get Supabase URL and service key from vault or use defaults
  -- In production, these should be set via Supabase environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Fallback to constructing URL (this works in Supabase hosted environments)
  IF supabase_url IS NULL THEN
    supabase_url := 'https://ideehirwwovbeezlqoqj.supabase.co';
  END IF;
  
  function_url := supabase_url || '/functions/v1/send-welcome-email';
  
  -- Make async HTTP POST request to edge function
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'email', user_email,
      'username', user_name
    )
  ) INTO request_id;
  
  -- Log the request
  RAISE LOG 'Welcome email request queued with id: %', request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
END;
$$;

-- Update the handle_new_user trigger function to send welcome email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, user_id, username)
  VALUES (NEW.id, NEW.id, NEW.raw_user_meta_data->>'username');
  
  -- Send welcome email asynchronously (non-blocking)
  PERFORM public.send_welcome_email(
    NEW.email,
    NEW.raw_user_meta_data->>'username'
  );
  
  RETURN NEW;
END;
$$;