# Connected Sources — Official Content Sync

Verified property managers connect their existing channels; content is discovered,
previewed, approved, and published as **Official · Verified** — with future
auto-sync. **Resident truth stays independent and can never be edited or deleted
by managers** (RLS-enforced).

## Flow
```
Claim property → verify manager → /manage/:propertyId
  → connect source (IG/FB/TikTok/YouTube/website/Matterport)
  → Sync now → items enter the pending queue
  → preview → Approve/Reject
  → approved → published as Official · Verified (property_channel, embed, attribution preserved)
  → future auto-sync (server-side, scheduled)
```

## Architecture (interface-driven, mock-safe)
- **`connected_source`** — per-property channel connections (metadata only; **OAuth tokens are NOT stored here** — `access_ref` points to a secret in Supabase Vault / edge secrets).
- **`synced_content`** — the import/approval queue.
- **`SocialSourceProvider`** interface + **mock providers** (deterministic content, no OAuth). Real providers (Meta Graph, TikTok, YouTube Data API) plug in behind the same interface.
- **Approval trigger** → publishes to `property_channel` (embed, `source='sync'`, `is_verified=true`) + logs a timeline event.

## Safety rules (enforced)
1. Official content is separate from Resident Truth (distinct tables/labels).
2. Imported content is `source='official/sync'` — never implies resident endorsement.
3. Managers add context/tours/amenities/events/responses.
4. Managers **cannot** edit/delete/suppress resident reviews (no RLS grant on `canonical_review`).
5. Attribution + source `permalink` preserved on every imported item.
6. **Embed/link by default; re-host only** with permission + platform rules.
7. Manual approval before publish (the queue).

## Production setup (per platform — escalation items)
| Source | API | Requires |
|---|---|---|
| Instagram/Facebook | Meta Graph API | Meta app + review/approval, Business login, page/IG tokens |
| TikTok | TikTok Content Posting/Display API | TikTok developer app + approval |
| YouTube | YouTube Data API v3 | Google Cloud project + OAuth |
| Website/Matterport | oEmbed / sitemap / link | none (embed/link) |

**Escalate for:** OAuth app approvals, platform policy decisions, or any paid vendor. Until then, mock providers keep the entire flow functional.

### Server-side auto-sync (production)
Run a scheduled edge function that, per `connected_source` with `auto_sync=true`, uses the stored token (Vault) to fetch new items via the real provider and upsert into `synced_content` (pending) — same shape the mock uses. The client approval UI is unchanged.
