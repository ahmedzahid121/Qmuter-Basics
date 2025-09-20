"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface FirebaseEmailVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

export function FirebaseEmailVerification({ 
  email, 
  onVerificationComplete, 
  onBack 
}: FirebaseEmailVerificationProps) {
  const { sendVerificationEmail, isEmailVerified } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { toast } = useToast();

  const handleSendVerification = async () => {
    setIsSending(true);
    try {
      await sendVerificationEmail();
      toast({
        title: "📧 Verification email sent!",
        description: "Please check your email and click the verification link.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send verification",
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = () => {
    setHasChecked(true);
    if (isEmailVerified) {
      toast({
        title: "✅ Email verified!",
        description: "Your email has been successfully verified.",
      });
      onVerificationComplete();
    } else {
      toast({
        variant: "destructive",
        title: "Email not verified yet",
        description: "Please check your email and click the verification link, then try again.",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We've sent a verification link to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please check your email and click the verification link to continue.
            </p>
            
            {isEmailVerified && (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Email verified!</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleCheckVerification}
            className="w-full"
            disabled={isSending}
          >
            {hasChecked && isEmailVerified ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Continue to Onboarding
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                I've verified my email
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSendVerification}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={onBack}
            disabled={isSending}
          >
            Back to signup
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>Didn't receive the email? Check your spam folder.</p>
          <p>Make sure to click the verification link in your email.</p>
        </div>
      </CardContent>
    </Card>
  );
} 