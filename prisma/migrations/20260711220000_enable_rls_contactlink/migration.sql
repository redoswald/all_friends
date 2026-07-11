-- Enable RLS on "ContactLink" (deny-all through PostgREST — no policies).
-- Every other Tend table already has this; ContactLink was missed when it
-- was added, leaving its rows readable by any authenticated Supabase user
-- via the REST API. tend-web (Prisma, table owner) and tend-mcp (service
-- role) bypass RLS and are unaffected.
ALTER TABLE "ContactLink" ENABLE ROW LEVEL SECURITY;
