import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Play } from "lucide-react";
import { CATEGORY_LABELS, type CategoryKey } from "@/domain/truthScore";
import { LIFE_STAGE_LABELS, type LifeStage } from "@/domain/property";
import type { ResidentTrustTier } from "@/domain/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CanonicalReview {
  id: string;
  title: string;
  body: string | null;
  ratings: Partial<Record<CategoryKey, number>>;
  life_stage: LifeStage;
  trust_tier: ResidentTrustTier;
  content_type: string;
  has_video: boolean;
  moderation_status: string;
  moderation_score: number;
  ai_flags: string[];
  created_at: string;
}

const TRUST_LABEL: Record<ResidentTrustTier, string> = {
  verified_resident: 'Verified resident',
  likely_resident: 'Likely resident',
  unverified: 'Unverified',
};

const AdminModeration = () => {
  const [reviews, setReviews] = useState<CanonicalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('canonical_review')
      .select('*')
      .eq('moderation_status', filter)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load reviews');
      console.error(error);
    } else {
      setReviews((data ?? []).map((r: any) => ({
        ...r,
        ratings: r.ratings ?? {},
        ai_flags: Array.isArray(r.ai_flags) ? r.ai_flags : [],
        moderation_score: r.moderation_score ?? 0,
      })));
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    // Updating moderation_status fires the DB trigger → Truth Score recompute.
    const { error } = await (supabase as any)
      .from('canonical_review')
      .update({ moderation_status: status })
      .eq('id', id);
    if (error) {
      toast.error(`Failed to ${status} review`);
      console.error(error);
    } else {
      toast.success(`Review ${status} — Truth Score will recompute`);
      fetchReviews();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Review Moderation</h1>
          <p className="text-muted-foreground">Approve or reject resident reviews on the canonical graph. Uncertain content lands here (fail-closed).</p>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {(['pending', 'approved', 'rejected'] as const).map((f) => {
            const Icon = f === 'pending' ? Clock : f === 'approved' ? CheckCircle : XCircle;
            return (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                <Icon className="w-4 h-4 mr-2" /> {f[0].toUpperCase() + f.slice(1)}
                {filter === f ? ` (${reviews.length})` : ''}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">No {filter} reviews</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{r.title}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{TRUST_LABEL[r.trust_tier]}</Badge>
                    <Badge variant="muted">{LIFE_STAGE_LABELS[r.life_stage]}</Badge>
                    {r.has_video && <Badge variant="secondary" className="gap-1"><Play className="w-3 h-3" /> Video</Badge>}
                    {r.moderation_score > 0 && (
                      <Badge variant={r.moderation_score > 0.7 ? 'destructive' : r.moderation_score > 0.4 ? 'secondary' : 'outline'}>
                        AI: {(r.moderation_score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  {r.ai_flags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {r.ai_flags.map((flag, i) => <Badge key={i} variant="destructive" className="text-xs">🚩 {flag}</Badge>)}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {r.body && <p className="text-sm text-muted-foreground line-clamp-4">{r.body}</p>}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(r.ratings).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="text-xs">{CATEGORY_LABELS[k as CategoryKey]}: {v}</Badge>
                    ))}
                  </div>
                  {filter === 'pending' && (
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="flex-1" onClick={() => updateStatus(r.id, 'approved')}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => updateStatus(r.id, 'rejected')}>
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                  {filter === 'rejected' && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => updateStatus(r.id, 'approved')}>
                      Restore &amp; approve
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
