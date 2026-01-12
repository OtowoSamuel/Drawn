import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export const ComingSoon = ({ feature, description }: ComingSoonProps) => {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <Sparkles className="h-12 w-12 mb-4 text-muted-foreground/50" />
        <h3 className="text-xl font-semibold mb-2">{feature}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        <p className="text-sm font-medium text-primary">Coming in Future Updates!</p>
      </CardContent>
    </Card>
  );
};
