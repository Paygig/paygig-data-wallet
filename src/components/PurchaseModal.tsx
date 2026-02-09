import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Copy, Check, AlertCircle, Phone, Gift } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
    bonusEligible?: boolean;
  } | null;
  userBalance: number;
  bonusBalance: number;
  onSuccess: () => void;
};

type Step = 'confirm' | 'processing' | 'success' | 'insufficient';

export const PurchaseModal = ({
  open,
  onOpenChange,
  plan,
  userBalance,
  bonusBalance,
  onSuccess,
}: PurchaseModalProps) => {
  const [step, setStep] = useState<Step>('confirm');
  const [couponCode, setCouponCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (open) {
      setStep('confirm');
      setCouponCode('');
      setShowSuccess(false);
    }
  }, [open]);

  const effectiveBalance = plan?.bonusEligible
    ? userBalance + bonusBalance
    : userBalance;

  const handlePurchase = async () => {
    if (!plan || !user) return;

    if (effectiveBalance < plan.price) {
      setStep('insufficient');
      return;
    }

    setStep('processing');

    const code = generateCouponCode();

    // Calculate deductions
    const bonusToUse = plan.bonusEligible ? Math.min(bonusBalance, plan.price) : 0;
    const balanceToDeduct = plan.price - bonusToUse;

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({
        balance: userBalance - balanceToDeduct,
        bonus_balance: bonusBalance - bonusToUse,
      })
      .eq('id', user.id);

    if (balanceError) {
      toast({ description: 'Failed to process purchase', variant: 'destructive' });
      setStep('confirm');
      return;
    }

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

    setTimeout(async () => {
      await refreshProfile();
      setShowSuccess(true);
      setStep('success');
      onSuccess();
    }, 5000);
  };

  const handleCopy = async () => {
    const textToCopy = `${couponCode}\n\nRedeem by dialing: *460*6*1#`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({ description: 'Coupon code & instructions copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep('confirm');
    setCouponCode('');
    setShowSuccess(false);
    onOpenChange(false);
  };

  if (!plan) return null;

  const bonusUsed = plan.bonusEligible ? Math.min(bonusBalance, plan.price) : 0;

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display text-xl">
            {step === 'confirm' && 'Confirm Purchase'}
            {step === 'processing' && 'Processing...'}
            {step === 'success' && 'Purchase Successful!'}
            {step === 'insufficient' && 'Insufficient Balance'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8">
          {step === 'confirm' && (
            <div className="space-y-4 animate-fade-in">
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

              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Balance</span>
                  <span className="font-semibold">{formatCurrency(userBalance)}</span>
                </div>
                {plan.bonusEligible && bonusBalance > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-accent" />
                      Bonus Applied
                    </span>
                    <span className="font-semibold text-accent">
                      -{formatCurrency(bonusUsed)}
                    </span>
                  </div>
                )}
              </div>

              {plan.bonusEligible && bonusBalance > 0 && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-2.5">
                  <p className="text-xs text-center text-accent-foreground">
                    🎁 ₦{bonusUsed.toLocaleString()} signup bonus applied to this plan!
                  </p>
                </div>
              )}

              <Button
                onClick={handlePurchase}
                className="w-full gradient-primary text-primary-foreground shadow-button"
              >
                Confirm Purchase
              </Button>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center animate-fade-in">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <p className="font-display font-semibold text-lg mb-1">Processing Purchase</p>
              <p className="text-sm text-muted-foreground">Generating your coupon code...</p>
              <div className="mt-4 mx-auto w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-[progress_5s_ease-in-out_forwards]" />
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className={`py-6 space-y-5 text-center ${showSuccess ? 'animate-scale-in' : ''}`}>
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-success/20 flex items-center justify-center animate-[bounce-in_0.6s_ease-out]">
                  <CheckCircle2 className="w-14 h-14 text-success animate-[check-pop_0.4s_ease-out_0.3s_both]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-accent animate-[particle_0.8s_ease-out_forwards]"
                      style={{
                        animationDelay: `${0.3 + i * 0.05}s`,
                        transform: `rotate(${i * 45}deg) translateY(-40px)`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="font-display font-bold text-xl mb-3">Your Coupon Code</p>
                <div className="bg-accent/20 border-2 border-accent rounded-xl p-4 flex items-center justify-between">
                  <span className="font-mono text-xl font-bold tracking-wider">{couponCode}</span>
                  <Button variant="ghost" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <p className="font-semibold text-sm">How to Redeem</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copy and redeem this code by dialing:
                </p>
                <p className="font-mono font-bold text-primary text-lg mt-1">*460*6*1#</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the code ending with 'S' when prompted
                </p>
              </div>

              <Button onClick={handleClose} className="w-full gradient-primary text-primary-foreground shadow-button">
                Done
              </Button>
            </div>
          )}

          {step === 'insufficient' && (
            <div className="py-6 space-y-6 text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>

              <div>
                <p className="font-display font-bold text-xl mb-2">Insufficient Balance</p>
                <p className="text-sm text-muted-foreground">
                  You need {formatCurrency(plan.price - effectiveBalance)} more to complete this purchase.
                </p>
              </div>

              <Button onClick={handleClose} variant="outline" className="w-full">
                Fund Wallet
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
