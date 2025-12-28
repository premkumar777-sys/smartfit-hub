import React from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  className?: string;
}

export function PremiumGate({ children, feature, description, className }: PremiumGateProps) {
  const { hasPremiumAccess, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-muted h-32 rounded-lg"></div>
      </div>
    );
  }

  if (hasPremiumAccess) {
    return <>{children}</>;
  }

  return (
    <Card className={`border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Premium Feature
        </CardTitle>
        <CardDescription>
          {description || `Unlock ${feature} with a premium subscription`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button
          onClick={() => navigate('/pricing')}
          className="w-full"
        >
          Upgrade to Premium
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Starting from ₹199/month
        </p>
      </CardContent>
    </Card>
  );
}

export function PremiumBadge() {
  const { hasPremiumAccess } = useSubscription();

  if (!hasPremiumAccess) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
      <Crown className="h-3 w-3" />
      Premium
    </div>
  );
}
