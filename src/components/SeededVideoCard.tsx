import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface SeededVideoCardProps {
  id: string;
  title: string;
  embed_url: string;
  caption?: string;
  hashtags: string[];
  city?: string;
  is_positive: boolean;
}

export const SeededVideoCard = ({
  title,
  caption,
  hashtags,
  city,
  is_positive,
}: SeededVideoCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/80">
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <p className="text-sm text-muted-foreground px-4 text-center">Video Preview</p>
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-accent text-accent-foreground backdrop-blur-sm">Sample</Badge>
        </div>
        {is_positive && (
          <div className="absolute top-2 left-2">
            <Badge variant="success">Positive</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{title}</h3>
        {city && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>{city}</p>
          </div>
        )}
        {caption && (
          <p className="text-xs text-muted-foreground line-clamp-2">{caption}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {hashtags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="muted" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="pt-1">
          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
            Sample data
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};