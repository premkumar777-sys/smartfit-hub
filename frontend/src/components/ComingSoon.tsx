import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  className?: string;
}

export function ComingSoon({ children, feature, description, className }: ComingSoonProps) {
  return (
    <div className={className}>
      {children}
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            More Features Coming Soon
          </CardTitle>
          <CardDescription>
            {description || `More amazing ${feature} features are on the way!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Stay tuned for exciting new features and updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ComingSoonBadge() {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
      <Sparkles className="h-3 w-3" />
      Coming Soon
    </div>
  );
}
