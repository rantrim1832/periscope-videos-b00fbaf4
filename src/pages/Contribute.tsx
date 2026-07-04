import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { ContributeFlow } from '@/components/contribute/ContributeFlow';

const Contribute = () => {
  const { propertyId } = useParams();

  const { data: property, isLoading } = useQuery({
    queryKey: ['contribute-property', propertyId],
    queryFn: () => (propertyId ? getPropertyProvider().getProperty(propertyId) : Promise.resolve(null)),
    enabled: !!propertyId,
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {!propertyId ? (
          <Card className="max-w-xl mx-auto p-10 text-center">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h1 className="text-2xl font-bold mb-2">Find your property</h1>
            <p className="text-muted-foreground mb-6">
              Search for a property, then submit your review. Can't find it? Add it.
            </p>
            <Button variant="hero" asChild><Link to="/browse">Browse properties</Link></Button>
          </Card>
        ) : isLoading ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !property ? (
          <Card className="max-w-xl mx-auto p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Property not found</h1>
            <p className="text-muted-foreground mb-6">We couldn't find that property — but you can add it.</p>
            <Button variant="hero" asChild><Link to="/browse">Browse properties</Link></Button>
          </Card>
        ) : (
          <>
            <div className="max-w-2xl mx-auto mb-6">
              <h1 className="text-3xl font-bold">Write a review</h1>
              <p className="text-muted-foreground">Reviewing <span className="font-medium text-foreground">{property.name}</span></p>
            </div>
            <ContributeFlow propertyId={property.id} propertyName={property.name} />
          </>
        )}
      </div>
    </div>
  );
};

export default Contribute;
