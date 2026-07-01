import { Card, CardContent } from '@/components/ui/card';
import { Landmark, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { TruthScoreResult } from '@/domain/truthScore';

// Deposit Return Intelligence — the signature wedge. Money is visceral; this
// surfaces the deposit-return signal prominently (residents' #1 silent grievance).
export const DepositIntelligence = ({ result }: { result: TruthScoreResult }) => {
  const cat = result.categories.depositReturn;
  if (cat.score == null) return null;

  const bad = cat.score < 2.5;
  const great = cat.score >= 4;
  const pctReturnedApprox = Math.round((cat.score / 5) * 100);

  return (
    <section className="container mx-auto px-4 py-6">
      <Card className={bad ? 'border-destructive/50 bg-destructive/5' : great ? 'border-success/50 bg-success/5' : ''}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="shrink-0">
            {bad ? <AlertTriangle className="w-8 h-8 text-destructive" /> : great ? <ShieldCheck className="w-8 h-8 text-success" /> : <Landmark className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div>
            <p className="font-semibold">
              Deposit Return: {cat.score.toFixed(1)}/5
              <span className="text-muted-foreground font-normal"> · based on {cat.count} resident report{cat.count === 1 ? '' : 's'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {bad && `Residents report deposits are often withheld — roughly ${pctReturnedApprox}% return experience. Document your move-out.`}
              {!bad && !great && 'Deposit-return experiences are mixed here.'}
              {great && 'Residents generally report getting their deposits back.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
