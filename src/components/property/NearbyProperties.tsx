import { useQuery } from '@tanstack/react-query';
import { PropertyCard } from '@/components/PropertyCard';
import { getPropertyProvider } from '@/data/propertyProvider';
import type { PropertyView } from '@/domain/property';

// Keeps the page connected (never a dead end) and reinforces perceived density.
export const NearbyProperties = ({ property }: { property: PropertyView }) => {
  const { data = [] } = useQuery({
    queryKey: ['nearby', property.id, property.state, property.city],
    queryFn: async () => {
      if (!property.state || !property.city) return [];
      const list = await getPropertyProvider().listByLocation(property.state, property.city);
      return list.filter((p) => p.id !== property.id).slice(0, 4);
    },
  });

  if (data.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-4">Nearby in {property.city}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((p) => (
          <PropertyCard
            key={p.id}
            name={p.name}
            address={p.addressLine1 ?? ''}
            city={p.city ?? ''}
            state={p.state ?? ''}
            rating={0}
            reviewCount={0}
            videoCount={0}
            to={`/property/${p.id}`}
          />
        ))}
      </div>
    </section>
  );
};
