#!/usr/bin/env bash
# Deploy edge functions + secrets to external production Supabase.
# Requires SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens).
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   export YOUTUBE_API_KEY=...
#   export TURNSTILE_SECRET_KEY=...
#   export LOVABLE_API_KEY=...
#   ./scripts/deploy-production-backend.sh

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-haciywkzvtgxemncenip}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN is required."
  exit 1
fi

export SUPABASE_ACCESS_TOKEN

echo "Setting secrets on ${PROJECT_REF}..."
SECRET_ARGS=()
for key in YOUTUBE_API_KEY GOOGLE_PLACES_API_KEY TURNSTILE_SECRET_KEY LOVABLE_API_KEY \
  RESEND_API_KEY RESEND_FROM_EMAIL RESEND_REPLY_TO APIFY_TOKEN; do
  if [[ -n "${!key:-}" ]]; then
    SECRET_ARGS+=("${key}=${!key}")
  fi
done

if [[ ${#SECRET_ARGS[@]} -gt 0 ]]; then
  npx supabase secrets set "${SECRET_ARGS[@]}" --project-ref "$PROJECT_REF"
else
  echo "No secret env vars set — skipping secrets."
fi

FUNCTIONS=(
  youtube-import
  youtube-bulk-seed
  youtube-verify-channel
  verify-turnstile
  admin-analytics
  geo-locate
  generate-video-summary
  fetch-google-reviews
  link-videos-to-properties
  verify-creator-channel
  submit-creator-video
  approve-creator-submission
)

echo "Deploying ${#FUNCTIONS[@]} functions..."
for fn in "${FUNCTIONS[@]}"; do
  echo "  → $fn"
  npx supabase functions deploy "$fn" --project-ref "$PROJECT_REF"
done

echo "Done. Verify preview:"
echo "  curl -X POST https://${PROJECT_REF}.supabase.co/functions/v1/youtube-import \\"
echo "    -H 'apikey: <anon>' -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\":\"apartment tour\",\"category\":\"test\",\"mode\":\"preview\",\"maxResults\":1}'"
