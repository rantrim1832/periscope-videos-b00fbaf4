import { Button } from '@/components/ui/button';
import { GitCompareArrows, Check } from 'lucide-react';
import type { PropertyView } from '@/domain/property';
import { useCompare } from '@/context/CompareContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  property: PropertyView;
  score?: number | null;
}

export const AddToCompareButton = ({ property }: Props) => {
  const { has, toggle, items, max } = useCompare();
  const { toast } = useToast();
  const active = has(property.id);

  const onClick = () => {
    if (!active && items.length >= max) {
      toast({ title: 'Compare is full', description: `You can compare up to ${max} properties.`, variant: 'destructive' });
      return;
    }
    toggle({
      id: property.id,
      name: property.name,
      location: [property.city, property.state].filter(Boolean).join(', '),
    });
  };

  return (
    <Button variant={active ? 'secondary' : 'outline'} size="lg" onClick={onClick}>
      {active ? <Check className="w-5 h-5 mr-2" /> : <GitCompareArrows className="w-5 h-5 mr-2" />}
      {active ? 'Added to compare' : 'Compare'}
    </Button>
  );
};
