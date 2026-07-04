import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Star, Video } from "lucide-react";
import { Link } from "react-router-dom";

interface PropertyCardProps {
  name: string;
  address: string;
  city: string;
  state: string;
  bedrooms?: number;
  bathrooms?: number;
  rating: number;
  reviewCount: number;
  videoCount: number;
  imageUrl?: string;
  verified?: boolean;
  to?: string;
}

export const PropertyCard = ({
  name,
  address,
  city,
  state,
  bedrooms,
  bathrooms,
  rating,
  reviewCount,
  videoCount,
  imageUrl = "/placeholder.svg",
  verified = false,
  to,
}: PropertyCardProps) => {
  const card = (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/80">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {videoCount > 0 && (
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge variant="default" className="bg-background/90 text-foreground backdrop-blur-sm">
              <Video className="w-3 h-3 mr-1" />
              {videoCount} content
            </Badge>
          </div>
        )}
        {verified && (
          <div className="absolute top-2 left-2">
            <Badge variant="success">✓ Verified</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1 text-foreground">{name}</h3>
        <div className="flex items-start gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {address}, {city}, {state}
          </span>
        </div>
        {(bedrooms || bathrooms) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {bedrooms && (
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {bedrooms} bed
              </span>
            )}
            {bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {bathrooms} bath
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount})</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              {videoCount > 0 ? 'Official content seeded · resident truth needed' : 'Be the first to add resident truth'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to} className="block">{card}</Link> : card;
};
