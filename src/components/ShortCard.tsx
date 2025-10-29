import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, ThumbsUp, Zap } from "lucide-react";

interface ShortCardProps {
  id: string;
  title: string;
  embed_url: string;
  tags: string[];
  city?: string;
  views: number;
  likes: number;
  source: string;
}

export const ShortCard = ({
  title,
  tags,
  city,
  views,
  likes,
}: ShortCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/90">
      <div className="relative aspect-[9/16] overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground px-4 text-center">Short Video Preview</p>
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-accent text-accent-foreground backdrop-blur-sm">
            <Zap className="w-3 h-3 mr-1" />
            Viral Short
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center gap-3 text-white text-xs">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{views}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{likes}</span>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{title}</h3>
        {city && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>{city}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="muted" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="pt-1">
          <Badge variant="outline" className="text-xs border-accent/50 text-accent">
            Viral Short – Add Yours!
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
