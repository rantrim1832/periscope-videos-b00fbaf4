import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500);

  const body = await req.json().catch(() => ({}));
  const description = String(body.description ?? "").trim();
  const reportType = String(body.report_type ?? body.reportType ?? "other").trim();
  const targetType = String(body.target_type ?? body.targetType ?? "other").trim();
  const reporterEmail = String(body.reporter_email ?? body.email ?? "").trim() || null;

  if (!description) return json({ error: "description is required" }, 400);
  if (description.length > 5000) return json({ error: "description too long" }, 400);

  let reporterUserId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(supabaseUrl, serviceKey);
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    reporterUserId = user?.id ?? null;
  }

  const { data, error } = await supabase.from("safety_report").insert({
    reporter_user_id: reporterUserId,
    reporter_email: reporterEmail,
    report_type: reportType,
    target_type: targetType,
    target_id: String(body.target_id ?? body.targetId ?? "").trim() || null,
    target_url: String(body.target_url ?? body.targetUrl ?? "").trim() || null,
    description,
  }).select("id").single();
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, id: data.id });
});
