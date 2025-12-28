import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/Container';
import { useAuth } from '@/hooks/use-auth';
import { useUpgradePlan } from '@/hooks/use-subscription';
import { Check, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentTest = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { upgradePlan, isLoading: upgradeLoading, error: upgradeError } = useUpgradePlan();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<{
    stripeKey: boolean;
    supabaseConnection: boolean;
    userAuth: boolean;
  }>({
    stripeKey: false,
    supabaseConnection: false,
    userAuth: false,
  });

  const runTests = async () => {
    const results = { ...testResults };

    // Test Stripe Key
    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      results.stripeKey = stripeKey && stripeKey.startsWith('pk_test_');
    } catch {
      results.stripeKey = false;
    }

    // Test Supabase Connection
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      // Just check if the client was created, don't make actual API calls
      results.supabaseConnection = !!supabase && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';
    } catch {
      results.supabaseConnection = false;
    }

    // Test User Auth
    results.userAuth = !!user;

    setTestResults(results);
  };

  const testPaymentFlow = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first to test payments",
        variant: "destructive",
      });
      return;
    }

    try {
      await upgradePlan('premium', 'monthly');
    } catch (error) {
      toast({
        title: "Payment Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    runTests();
  }, [user]);

  if (authLoading) {
    return (
      <Container className="py-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Payment Integration Test</h1>
          <p className="text-muted-foreground">
            Test your Stripe payment integration setup
          </p>
        </div>

        {/* Status Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Integration Status
            </CardTitle>
            <CardDescription>
              Check if all required services are properly configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Stripe Key</div>
                  <div className="text-sm text-muted-foreground">Publishable key configured</div>
                </div>
                <Badge variant={testResults.stripeKey ? "default" : "destructive"}>
                  {testResults.stripeKey ? "✓" : "✗"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Supabase</div>
                  <div className="text-sm text-muted-foreground">Database connection</div>
                </div>
                <Badge variant={testResults.supabaseConnection ? "default" : "destructive"}>
                  {testResults.supabaseConnection ? "✓" : "✗"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Authentication</div>
                  <div className="text-sm text-muted-foreground">User signed in</div>
                </div>
                <Badge variant={testResults.userAuth ? "default" : "destructive"}>
                  {testResults.userAuth ? "✓" : "✗"}
                </Badge>
              </div>
            </div>

            <Button onClick={runTests} variant="outline" className="w-full">
              Re-run Tests
            </Button>
          </CardContent>
        </Card>

        {/* Payment Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Flow Test
            </CardTitle>
            <CardDescription>
              Test the complete payment flow with a real Stripe checkout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    Test Mode Notice
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will create a test payment using Stripe test mode.
                    Use card number <code className="bg-muted px-1 py-0.5 rounded text-xs">4242 4242 4242 4242</code> with any future expiry and CVC.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Premium Plan Test</div>
                <div className="text-sm text-muted-foreground">₹199/month subscription</div>
              </div>
              <Button
                onClick={testPaymentFlow}
                disabled={!user || upgradeLoading}
                className="min-w-[120px]"
              >
                {upgradeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : user ? (
                  'Test Payment'
                ) : (
                  'Sign In First'
                )}
              </Button>
            </div>

            {upgradeError && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <p className="text-sm text-destructive">
                  Error: {upgradeError}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>What to Expect</CardTitle>
            <CardDescription>
              How to verify your payment integration is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <div className="font-medium">Stripe Checkout Opens</div>
                  <div className="text-sm text-muted-foreground">
                    You'll be redirected to Stripe's secure checkout page
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <div className="font-medium">Complete Test Payment</div>
                  <div className="text-sm text-muted-foreground">
                    Use test card: <code className="bg-muted px-1 py-0.5 rounded">4242 4242 4242 4242</code>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <div className="font-medium">Success Redirect</div>
                  <div className="text-sm text-muted-foreground">
                    You'll be redirected back to dashboard with success message
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <div className="font-medium">Premium Access</div>
                  <div className="text-sm text-muted-foreground">
                    AI Workout Generator and other premium features will be unlocked
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default PaymentTest;
