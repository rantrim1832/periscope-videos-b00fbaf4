import { authErrorResponse, corsHeaders, requireAdmin } from "../_shared/auth.ts";

type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function sanitizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list.map((x) => String(x).trim()).filter(Boolean).slice(0, 50);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    await requireAdmin(req);
  } catch (err) {
    return authErrorResponse(err);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json({ error: "RESEND_API_KEY is not configured" }, 500);

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const to = sanitizeRecipients(payload.to);
  const subject = String(payload.subject ?? "").trim();
  const html = payload.html?.trim();
  const text = payload.text?.trim();

  if (to.length === 0) return json({ error: "At least one recipient is required" }, 400);
  if (!subject) return json({ error: "Subject is required" }, 400);
  if (!html && !text) return json({ error: "HTML or text body is required" }, 400);

  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "Periscope <team@joinperiscope.com>";
  const replyTo = payload.replyTo ?? Deno.env.get("RESEND_REPLY_TO") ?? "team@joinperiscope.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
      tags: payload.tags,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({ error: "Resend send failed", details: data }, response.status);
  }

  return json({ ok: true, data });
});
