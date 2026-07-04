import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Star, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { PropertyArtwork } from "./PropertyArtwork";

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
  units?: number | null;
  propertyId?: string;
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
  units,
  propertyId,
}: PropertyCardProps) => {
  const hasImage = !!imageUrl && imageUrl !== "/placeholder.svg";
  const card = (
    <Card className="group overflow-hidden cursor-pointer border-border/60 bg-card shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <PropertyArtwork
            name={name}
            seed={propertyId ?? `${name}-${city}-${state}`}
            units={units}
            className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {videoCount > 0 && (
          <div className="absolute top-2.5 right-2.5 flex gap-2">
            <Badge variant="default" className="bg-background/85 text-foreground backdrop-blur-md border border-border/40 shadow-sm">
              <Video className="w-3 h-3 mr-1" />
              {videoCount}
            </Badge>
          </div>
        )}
        {verified && (
          <div className="absolute top-2.5 left-2.5">
            <Badge variant="success">✓ Verified</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2.5">
        <h3 className="font-semibold text-[15px] leading-snug line-clamp-1 text-foreground group-hover:text-primary transition-colors">{name}</h3>
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">
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
        <div className="flex items-center justify-between pt-1.5 border-t border-border/40 mt-2">
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1 pt-2">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount})</span>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground pt-2 line-clamp-1">
              {videoCount > 0 ? 'Official sources · add resident input' : 'Be the first to share'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to} className="block">{card}</Link> : card;
};
