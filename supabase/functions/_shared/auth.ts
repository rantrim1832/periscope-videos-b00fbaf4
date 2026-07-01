// Shared authorization helpers for Pariscope edge functions.
//
// Phase 0 security: privileged operations (scraping, enrichment,
// deletion, imports) must be restricted to admins. Webhooks, which are
// called by external services without a user session, are protected by
// a shared secret instead.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Verifies the caller is an authenticated admin.
 * Throws AuthError (caught by the caller) when not authorized.
 * Returns the admin user's id on success.
 */
export async function requireAdmin(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthError("Missing Authorization header", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new AuthError("Server auth not configured", 500);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, serviceKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Invalid or expired session", 401);
  }

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    throw new AuthError("Authorization check failed", 500);
  }
  if (!roles) {
    throw new AuthError("Admin privileges required", 403);
  }

  return user.id;
}

/**
 * Verifies the caller is any authenticated user.
 * Returns the user's id on success; throws AuthError otherwise.
 */
export async function requireAuth(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthError("Missing Authorization header", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new AuthError("Server auth not configured", 500);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, serviceKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Invalid or expired session", 401);
  }
  return user.id;
}

/**
 * Verifies an inbound webhook carries the shared secret.
 * Accepts the secret via the `x-webhook-secret` header.
 */
export function requireWebhookSecret(req: Request): void {
  const expected = Deno.env.get("WEBHOOK_SECRET");
  if (!expected) {
    // Fail closed: if no secret is configured, reject rather than
    // silently accepting anonymous writes.
    throw new AuthError("Webhook secret not configured", 500);
  }
  const provided = req.headers.get("x-webhook-secret");
  if (!provided || provided !== expected) {
    throw new AuthError("Invalid webhook secret", 401);
  }
}

export function authErrorResponse(err: unknown): Response {
  const status = err instanceof AuthError ? err.status : 401;
  const message = err instanceof Error ? err.message : "Unauthorized";
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
