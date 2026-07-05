import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Plug, CheckCircle, XCircle, ExternalLink, Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useIsManager } from '@/hooks/useIsManager';
import { getPropertyProvider } from '@/data/propertyProvider';
import {
  listConnectedSources, connectSource, syncSource, listQueue, reviewItem,
  type ConnectedSource, type SyncedContentItem,
} from '@/services/sourceSyncService';
import type { SourceKind } from '@/services/providers/socialSource';
import { isWatching, toggleWatch } from '@/services/watchService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const KINDS: SourceKind[] = ['instagram', 'facebook', 'tiktok', 'youtube', 'website', 'matterport'];

const ManageProperty = () => {
  const { propertyId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isManager = useIsManager(propertyId);
  const [sources, setSources] = useState<ConnectedSource[]>([]);
  const [queue, setQueue] = useState<SyncedContentItem[]>([]);
  const [kind, setKind] = useState<SourceKind>('instagram');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [alertsBusy, setAlertsBusy] = useState(false);

  const { data: property } = useQuery({ queryKey: ['manage-prop', propertyId], queryFn: () => getPropertyProvider().getProperty(propertyId) });

  const refresh = useCallback(async () => {
    setSources(await listConnectedSources(propertyId));
    setQueue(await listQueue(propertyId, 'pending'));
    setAlertsOn(await isWatching('property', propertyId));
  }, [propertyId]);

  useEffect(() => { if (isManager) refresh(); }, [isManager, refresh]);

  const onToggleAlerts = async (next: boolean) => {
    setAlertsBusy(true);
    try {
      await toggleWatch('property', propertyId, property?.name ?? 'Property', next);
      setAlertsOn(next);
      toast({
        title: next ? 'Alerts on' : 'Alerts off',
        description: next
          ? "You'll be notified whenever a new resident review is posted."
          : "You'll no longer be notified about new reviews on this property.",
      });
    } catch (e) {
      toast({ title: 'Could not update alerts', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setAlertsBusy(false);
    }
  };

  const onConnect = async () => {
    if (!handle.trim()) return;
    setBusy(true);
    try { await connectSource(propertyId, kind, handle.trim()); setHandle(''); toast({ title: 'Source connected' }); await refresh(); }
    catch (e) { toast({ title: 'Connect failed', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const onSync = async (s: ConnectedSource) => {
    setBusy(true);
    try { const n = await syncSource(s, propertyId); toast({ title: 'Synced', description: `${n} new item(s) queued for review` }); await refresh(); }
    catch (e) { toast({ title: 'Sync failed', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const onReview = async (id: string, status: 'approved' | 'rejected') => {
    await reviewItem(id, status);
    toast({ title: status === 'approved' ? 'Published as Official · Verified' : 'Rejected' });
    refresh();
  };

  if (!isManager) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Manager access required</h1>
          <p className="text-muted-foreground mb-6">Claim &amp; verify this property to connect content sources.</p>
          <Button variant="hero" asChild><Link to={`/claim/${propertyId}`}>Claim this property</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Manage official content</h1>
          <p className="text-muted-foreground">{property?.name} — connect your channels; approved content publishes as <Badge variant="success">Official · Verified</Badge>. Resident reviews remain independent.</p>
        </div>

        {/* New-review alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {alertsOn ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
              New review alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-start justify-between gap-4">
            <div className="text-sm text-muted-foreground max-w-lg">
              Get notified the moment a resident posts a new video review or written review on this property.
              Alerts show up in your <Link to="/notifications" className="text-primary hover:underline">Notifications</Link>.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={alertsOn ? 'success' : 'outline'}>{alertsOn ? 'On' : 'Off'}</Badge>
              <Switch
                checked={alertsOn}
                onCheckedChange={onToggleAlerts}
                disabled={alertsBusy}
                aria-label="Toggle new review alerts"
              />
            </div>
          </CardContent>
        </Card>

        {/* Connect */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plug className="w-5 h-5" /> Connect a source</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as SourceKind)}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="@handle, channel, or URL" value={handle} onChange={(e) => setHandle(e.target.value)} className="flex-1" />
            <Button onClick={onConnect} disabled={busy}>Connect</Button>
          </CardContent>
        </Card>

        {/* Connected sources */}
        {sources.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Connected sources</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 border-b border-border/40 pb-3 last:border-0">
                  <div>
                    <p className="font-medium capitalize">{s.kind} <span className="text-muted-foreground font-normal">· {s.handle}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {s.lastSyncedAt ? `Last synced ${formatDistanceToNow(new Date(s.lastSyncedAt), { addSuffix: true })}` : 'Never synced'}
                      {' · '}<Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onSync(s)} disabled={busy}><RefreshCw className="w-4 h-4 mr-1" /> Sync now</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Import queue */}
        <Card>
          <CardHeader><CardTitle>Official content queue ({queue.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items awaiting review. Connect a source and sync to discover content.</p>
            ) : queue.map((it) => (
              <div key={it.id} className="border border-border/50 rounded-lg p-3 space-y-2">
                {it.embedUrl && <iframe src={it.embedUrl} title={it.title ?? ''} className="w-full h-56 rounded border-0" loading="lazy" allowFullScreen />}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{it.title ?? 'Untitled'}</p>
                    <a href={it.permalink} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {it.kind} source
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onReview(it.id, 'approved')}><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => onReview(it.id, 'rejected')}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => navigate(`/property/${propertyId}`)}>← Back to property</Button>
      </div>
    </div>
  );
};

export default ManageProperty;
