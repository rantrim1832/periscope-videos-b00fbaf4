import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}

// Consistent, invitational empty state — every gap is an opportunity to
// contribute, never an abandoned dead end.
export const EmptyState = ({ icon: Icon, title, description, primary, secondary }: Props) => (
  <div className="text-center py-16 px-4">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-primary" />
    </div>
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {primary && <Button variant="hero" asChild><Link to={primary.to}>{primary.label}</Link></Button>}
      {secondary && <Button variant="outline" asChild><Link to={secondary.to}>{secondary.label}</Link></Button>}
    </div>
  </div>
);
