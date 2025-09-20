"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
  const { isEmailVerified, sendVerificationEmail } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
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

  // Don't show banner if email is verified
  if (isEmailVerified) {
    return null;
  }

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-orange-800">
            Please verify your email address to access all features.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isSending}
          className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-3 w-3" />
              Resend
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
} 