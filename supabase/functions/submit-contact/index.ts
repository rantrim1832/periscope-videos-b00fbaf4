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
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();
  const topic = String(body.topic ?? "general").trim();
  const senderEmail = String(body.sender_email ?? body.email ?? "").trim() || null;
  const sourceUrl = String(body.source_url ?? "").trim() || null;

  if (!subject || !message) return json({ error: "subject and message are required" }, 400);
  if (subject.length > 200 || message.length > 5000) return json({ error: "message too long" }, 400);

  let senderUserId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(supabaseUrl, serviceKey);
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    senderUserId = user?.id ?? null;
  }

  const { data, error } = await supabase.from("contact_message").insert({
    sender_user_id: senderUserId,
    sender_email: senderEmail,
    topic,
    subject,
    message,
    source_url: sourceUrl,
  }).select("id").single();
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, id: data.id });
});
