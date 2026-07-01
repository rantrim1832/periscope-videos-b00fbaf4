import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { PropertyView } from '@/domain/property';

// Layer 1 (always present): a real map so no page feels abandoned. Uses
// OpenStreetMap's keyless embed; a static-image maps provider can replace it
// later without changing this interface.
export const LocationSection = ({ property }: { property: PropertyView }) => {
  const { latitude: lat, longitude: lng } = property;
  const location = [property.addressLine1, property.city, property.state].filter(Boolean).join(', ');

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><MapPin className="w-6 h-6" /> Location &amp; neighborhood</h2>
      <p className="text-muted-foreground mb-4">{location || 'Location details coming soon.'}</p>
      <Card className="overflow-hidden">
        {lat != null && lng != null ? (
          <iframe
            title={`Map of ${property.name}`}
            className="w-full h-72 border-0"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012}%2C${lat - 0.008}%2C${lng + 0.012}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`}
          />
        ) : (
          <div className="h-72 flex items-center justify-center bg-muted/40 text-muted-foreground">
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Map coming soon for this property</p>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
};
