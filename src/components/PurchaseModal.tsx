import { useState } from 'react';
import { Loader2, CheckCircle2, Copy, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, generateCouponCode } from '@/lib/supabase';

type PurchaseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    name: string;
    data: string;
    price: number;
    validity: string;
  } | null;
  userBalance: number;
  onSuccess: () => void;
};

type Step = 'confirm' | 'processing' | 'success' | 'insufficient';

export const PurchaseModal = ({
  open,
  onOpenChange,
  plan,
  userBalance,
  onSuccess,
}: PurchaseModalProps) => {
  const [step, setStep] = useState<Step>('confirm');
  const [couponCode, setCouponCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();

  const handlePurchase = async () => {
    if (!plan || !user) return;

    if (userBalance < plan.price) {
      setStep('insufficient');
      return;
    }

    setStep('processing');

    const code = generateCouponCode();
    
    // Deduct balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: userBalance - plan.price })
      .eq('id', user.id);

    if (balanceError) {
      toast({ description: 'Failed to process purchase', variant: 'destructive' });
      setStep('confirm');
      return;
    }

    // Create transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'purchase',
      amount: plan.price,
      status: 'success',
      coupon_code: code,
      description: `${plan.name} (${plan.data}) - ${plan.validity}`,
    });

    if (txError) {
      toast({ description: 'Failed to record transaction', variant: 'destructive' });
      setStep('confirm');
      return;
    }

    setCouponCode(code);
    await refreshProfile();
    setStep('success');
    onSuccess();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast({ description: 'Coupon code copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep('confirm');
    setCouponCode('');
    onOpenChange(false);
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {step === 'confirm' && 'Confirm Purchase'}
            {step === 'processing' && 'Processing...'}
            {step === 'success' && 'Purchase Successful!'}
            {step === 'insufficient' && 'Insufficient Balance'}
          </DialogTitle>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-semibold">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Data</span>
                <span className="font-semibold">{plan.data}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Validity</span>
                <span className="font-semibold">{plan.validity}</span>
              </div>
              <div className="border-t border-border my-3" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-display font-bold text-primary">
                  {formatCurrency(plan.price)}
                </span>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <span className="font-semibold">{formatCurrency(userBalance)}</span>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              className="w-full gradient-primary text-primary-foreground shadow-button"
            >
              Confirm Purchase
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Processing your purchase...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-6 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            
            <div>
              <p className="font-display font-bold text-xl mb-2">Your Coupon Code</p>
              <div className="bg-accent/20 border-2 border-accent rounded-xl p-4 flex items-center justify-between">
                <span className="font-mono text-xl font-bold tracking-wider">{couponCode}</span>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use this code to activate your data plan
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {step === 'insufficient' && (
          <div className="py-6 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            
            <div>
              <p className="font-display font-bold text-xl mb-2">Insufficient Balance</p>
              <p className="text-sm text-muted-foreground">
                You need {formatCurrency(plan.price - userBalance)} more to complete this purchase.
              </p>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full">
              Fund Wallet
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
