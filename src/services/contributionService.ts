// Contribution submission service. Orchestrates: media upload (VideoProvider),
// FAIL-CLOSED moderation (ModerationProvider), and persistence (ContributionSink).
// Every dependency is a provider abstraction with a mock fallback, so the flow
// works end-to-end with no vendor keys.

import type { ContributionDraft, SubmissionResult, SubmissionStatus } from '@/domain/contribution';
import { getModerationProvider, type ModerationProvider } from './providers/moderation';
import { getVideoProvider, type VideoProvider } from './providers/video';
import { supabase } from '@/integrations/supabase/client';

export interface ContributionSink {
  save(
    draft: ContributionDraft,
    status: SubmissionStatus,
    moderation: { score: number; flags: string[]; reason?: string },
  ): Promise<{ id: string }>;
}

// In-memory sink so the confirmation + share loop work without a database.
export class InMemoryContributionSink implements ContributionSink {
  public saved: Array<{ id: string; draft: ContributionDraft; status: SubmissionStatus }> = [];
  async save(draft: ContributionDraft, status: SubmissionStatus): Promise<{ id: string }> {
    const id = `contrib_${this.saved.length + 1}_${Date.now()}`;
    this.saved.push({ id, draft, status });
    return { id };
  }
}

const MODERATION_UNCERTAIN = ['moderation_unavailable', 'moderation_error', 'moderation_exception'];

export interface ContributionDeps {
  moderation?: ModerationProvider;
  video?: VideoProvider;
  sink?: ContributionSink;
}

export function createContributionService(deps: ContributionDeps = {}) {
  const moderation = deps.moderation ?? getModerationProvider();
  const video = deps.video ?? getVideoProvider();
  const sink = deps.sink ?? new InMemoryContributionSink();

  return {
    /** Reserve a direct upload target for video/photo (bytes go direct-to-provider). */
    async createUpload() {
      return video.createDirectUpload();
    },

    async submit(draft: ContributionDraft): Promise<SubmissionResult> {
      const text = [draft.title, draft.body].filter(Boolean).join('\n').trim();
      const mod = await moderation.moderate(text || draft.title || ' ');

      // FAIL-CLOSED: uncertainty → human review queue; toxic → rejected; else publish.
      const uncertain = mod.flags.some((f) => MODERATION_UNCERTAIN.includes(f));
      const status: SubmissionStatus = uncertain
        ? 'pending'
        : mod.approved
          ? 'published'
          : 'rejected';

      const { id } = await sink.save(draft, status, {
        score: mod.score,
        flags: mod.flags,
        reason: mod.reason,
      });

      return { status, reviewId: id, reason: mod.reason };
    },
  };
}

export type ContributionService = ReturnType<typeof createContributionService>;

// Dispatcher used by the UI. In canonical mode, submission goes through the
// server-side `submit-review` edge function (tamper-proof moderation + insert +
// auto Truth Score recompute). Otherwise the mock in-memory service runs the
// full flow offline for development/demo.
const mockService = createContributionService();

export async function submitContribution(draft: ContributionDraft): Promise<SubmissionResult> {
  const { data, error } = await supabase.functions.invoke('submit-review', { body: draft });
  if (error) throw error;
  return data as SubmissionResult;
}

export async function createContributionUpload() {
  return getVideoProvider().createDirectUpload();
}
