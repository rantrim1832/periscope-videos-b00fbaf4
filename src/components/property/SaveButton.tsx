import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { PropertyView } from '@/domain/property';
import { useSaved } from '@/context/SavedContext';

export const SaveButton = ({ property }: { property: PropertyView }) => {
  const { has, toggle } = useSaved();
  const saved = has(property.id);
  return (
    <Button
      variant={saved ? 'secondary' : 'outline'}
      size="lg"
      onClick={() => toggle({ id: property.id, name: property.name, location: [property.city, property.state].filter(Boolean).join(', ') })}
    >
      {saved ? <BookmarkCheck className="w-5 h-5 mr-2" /> : <Bookmark className="w-5 h-5 mr-2" />}
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
};
