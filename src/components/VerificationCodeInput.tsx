"use client";

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationCodeInputProps {
  email: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
  onResendCode: () => Promise<void>;
}

export function VerificationCodeInput({ 
  email, 
  onVerificationSuccess, 
  onBack,
  onResendCode 
}: VerificationCodeInputProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode: string) => {
    setIsLoading(true);
    try {
      // Here you would call your verification service
      // For now, we'll simulate a verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Replace with actual verification
      // const isValid = await EmailVerificationService.verifyCode(email, verificationCode);
      
      // For demo purposes, accept any 6-digit code
      const isValid = verificationCode.length === 6 && /^\d{6}$/.test(verificationCode);
      
      if (isValid) {
        toast({
          title: "✅ Email verified!",
          description: "Your email has been successfully verified.",
        });
        onVerificationSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Invalid code",
          description: "Please check your email and enter the correct verification code.",
        });
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await onResendCode();
      setCountdown(60); // 60 second countdown
      toast({
        title: "📧 Code resent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: "Could not resend the verification code. Please try again.",
      });
    } finally {
      setIsResending(false);
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
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center space-x-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-12 text-center text-lg font-semibold"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleResendCode}
            disabled={isResending || countdown > 0}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend in {countdown}s
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend code
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to signup
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Didn't receive the code? Check your spam folder or try resending.</p>
        </div>
      </CardContent>
    </Card>
  );
} 