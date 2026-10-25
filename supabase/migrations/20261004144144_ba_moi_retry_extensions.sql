-- Durable retry execution uses a single named pg_cron job plus pg_net HTTP.
-- The runtime installer stores the bearer credential in existing Supabase
-- Vault; no secret or environment-specific URL belongs in this migration.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
