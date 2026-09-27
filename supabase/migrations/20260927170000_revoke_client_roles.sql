-- Defense in depth for the public Data API. The service connects as postgres
-- through the pooler; anon and authenticated (whose key is public by design)
-- get no table or sequence privileges at all, so member data stays closed even
-- if RLS were ever switched off. Also stops Supabase's default grants from
-- reaching tables added by later migrations.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
