"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

const PRESET_AMOUNTS = [10, 20, 50, 100];

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');

  const handlePresetSelect = (presetAmount: number) => {
    setAmount(presetAmount.toString());
    setSelectedPreset(presetAmount);
  };

  const handleCustomAmount = (value: string) => {
    setAmount(value);
    setSelectedPreset(null);
  };

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue >= 1 && numValue <= 1000;
  };

  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (!validateAmount(amount)) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount between $1 and $1000."
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual Stripe payment integration
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate payment processing
      
      // Mock successful payment
      const paymentData = {
        amount: numAmount,
        currency: 'USD',
        paymentMethod: paymentMethod,
        userId: user?.uid,
        status: 'completed'
      };

      console.log('Payment data:', paymentData);

      toast({
        title: "Payment Successful! 🎉",
        description: `Your wallet has been topped up with $${numAmount.toFixed(2)}.`
      });

      onSuccess(numAmount);
      onClose();
      
      // Reset form
      setAmount("");
      setSelectedPreset(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Something went wrong with your payment. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const isAmountValid = validateAmount(amount);
  const numAmount = parseFloat(amount) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Top Up Your Wallet
          </DialogTitle>
          <DialogDescription>
            Add funds to your Qmuter wallet to book rides and offer routes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="flex-1"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Credit Card
                </Button>
                <Button
                  variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('wallet')}
                  className="flex-1"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Digital Wallet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Amount Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Amounts */}
              <div className="grid grid-cols-2 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={selectedPreset === preset ? 'default' : 'outline'}
                    onClick={() => handlePresetSelect(preset)}
                    className="h-12"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>

              {/* Custom Amount */}
              <div>
                <label className="text-sm font-medium">Custom Amount</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    className="pl-8"
                    min="1"
                    max="1000"
                    step="0.01"
                  />
                </div>
                {amount && !isAmountValid && (
                  <p className="text-sm text-red-600 mt-1">
                    Please enter an amount between $1 and $1000
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Amount</span>
                <span className="font-semibold">${numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Processing Fee</span>
                <span className="text-muted-foreground">$0.00</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span>${numAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Secure Payment</p>
              <p>Your payment information is encrypted and secure. We use industry-standard security measures.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={loading || !isAmountValid || numAmount === 0}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ${numAmount.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 