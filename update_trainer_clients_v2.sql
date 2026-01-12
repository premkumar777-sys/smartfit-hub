-- Add whatsapp_group_link column to trainer_clients table
ALTER TABLE trainer_clients ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;
