import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, X, MapPin } from 'lucide-react';
import { useSaved } from '@/context/SavedContext';

const Saved = () => {
  const { items, remove } = useSaved();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Bookmark className="w-7 h-7" /> Saved properties</h1>
        {items.length === 0 ? (
          <Card className="p-10 text-center bg-muted/30 border-dashed">
            <Bookmark className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Nothing saved yet. Tap the bookmark on any property to keep it here.</p>
            <Button variant="hero" asChild><Link to="/discover">Discover properties</Link></Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((i) => (
              <Card key={i.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <Link to={`/property/${i.id}`} className="min-w-0">
                    <p className="font-semibold truncate hover:text-primary">{i.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {i.location}</p>
                  </Link>
                  <button onClick={() => remove(i.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;
