import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ThumbsUp, MessageCircle, Eye } from "lucide-react";

interface VideoCardProps {
  id: string;
  thumbnailUrl: string;
  title: string;
  propertyName: string;
  propertyAddress: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  verified?: boolean;
}

export const VideoCard = ({
  thumbnailUrl,
  title,
  propertyName,
  propertyAddress,
  tags,
  likes,
  comments,
  views,
  verified = false,
}: VideoCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/80">
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-background/90 text-foreground backdrop-blur-sm">
            <Eye className="w-3 h-3 mr-1" />
            {views.toLocaleString()}
          </Badge>
        </div>
        {verified && (
          <div className="absolute top-2 left-2">
            <Badge variant="success">✓ Verified</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground">{title}</h3>
        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground">{propertyName}</p>
            <p>{propertyAddress}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="muted" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {comments}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
