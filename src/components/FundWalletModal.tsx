import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, CheckCircle2, Sparkles, ArrowLeft, Wallet, Banknote, Send } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { formatCurrency, type BankDetails } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/use-mobile';

type FundWalletModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankDetails: BankDetails | null;
};

type Step = 'amount' | 'bank' | 'verifying' | 'success';

export const FundWalletModal = ({
  open,
  onOpenChange,
  bankDetails,
}: FundWalletModalProps) => {
  const [step, setStep] = useState<Step>('amount');
  const isMobile = useIsMobile();
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ description: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    setStep('bank');
  };

  const handleConfirmPayment = async () => {
    if (!user) return;

    setStep('verifying');

    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'pending',
      description: `Wallet funding - ${formatCurrency(parseFloat(amount))}`,
    })
      .select()
      .single();

    if (error) {
      toast({ description: 'Failed to create transaction', variant: 'destructive' });
      setStep('bank');
      return;
    }

    try {
      await supabase.functions.invoke('telegram-notify', {
        body: {
          type: 'deposit',
          email: user.email,
          amount: parseFloat(amount),
          userId: user.id,
          transactionId: data?.id,
        },
      });
    } catch (e) {
      console.error('Failed to send telegram notification:', e);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('success');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleClose = () => {
    setStep('amount');
    setAmount('');
    setProgress(0);
    onOpenChange(false);
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  const handleAmountInput = (digit: string) => {
    if (digit === 'clear') {
      setAmount('');
      return;
    }
    if (digit === 'back') {
      setAmount((prev) => prev.slice(0, -1));
      return;
    }
    if (amount.length >= 7) return;
    setAmount((prev) => prev + digit);
  };

  const Content = (
    <div className="px-5 py-5 overflow-y-auto">
      {step === 'amount' && (
        <div className="space-y-5 animate-fade-in max-w-sm mx-auto">
          {/* Amount display */}
          <div className="flex flex-col items-center pt-2 pb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Enter Amount</p>
            <div className="flex items-baseline gap-1">
              <span className="text-muted-foreground font-semibold text-3xl">₦</span>
              <span className="text-4xl font-bold font-display text-foreground min-h-[3rem] min-w-[2rem] text-center">
                {amount ? parseInt(amount).toLocaleString() : '0'}
              </span>
            </div>
            <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-2" />
          </div>

          {/* Quick amounts as pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  amount === amt.toString()
                    ? 'bg-primary text-primary-foreground border-primary shadow-button'
                    : 'bg-secondary/50 text-foreground border-border/40 hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((key) => (
              <button
                key={key}
                onClick={() => handleAmountInput(key)}
                className={`h-14 rounded-xl font-semibold text-lg transition-all active:scale-95 ${
                  key === 'clear'
                    ? 'text-destructive bg-destructive/10 text-sm'
                    : key === 'back'
                    ? 'text-muted-foreground bg-secondary/50 text-sm'
                    : 'text-foreground bg-secondary/30 hover:bg-secondary/60'
                }`}
              >
                {key === 'back' ? '⌫' : key === 'clear' ? 'C' : key}
              </button>
            ))}
          </div>

          <Button
            onClick={handleProceed}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full h-13 gradient-primary text-primary-foreground shadow-button font-semibold text-base rounded-xl mt-2"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 'bank' && bankDetails && (
        <div className="space-y-5 animate-fade-in max-w-sm mx-auto">
          {/* Amount badge */}
          <div className="flex flex-col items-center mb-1">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-3">
              <Banknote className="w-7 h-7 text-accent-foreground" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Transfer exactly</p>
            <p className="text-3xl font-bold font-display text-primary mt-1">
              {formatCurrency(parseFloat(amount))}
            </p>
          </div>

          {/* Bank card */}
          <div className="bg-gradient-to-b from-card to-secondary/20 rounded-2xl border border-border/40 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Bank</span>
                  <p className="font-bold text-base">{bankDetails.bank}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
              </div>

              <button
                onClick={() => handleCopy(bankDetails.acc)}
                className="w-full bg-background rounded-xl p-4 flex items-center justify-between group hover:bg-primary/5 transition-colors border border-border/30"
              >
                <div className="text-left">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Account Number</span>
                  <p className="font-mono text-xl font-bold tracking-wider text-foreground mt-0.5">
                    {bankDetails.acc}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {copied ? (
                    <Check className="w-5 h-5 text-success animate-scale-in" />
                  ) : (
                    <Copy className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Account Name</span>
                <p className="font-semibold text-base mt-0.5">{bankDetails.name}</p>
              </div>
            </div>

            <div className="bg-accent/10 px-4 py-2.5 border-t border-accent/20">
              <p className="text-[11px] text-accent-foreground/80 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Use this account for this transaction only
              </p>
            </div>
          </div>

          <Button
            onClick={handleConfirmPayment}
            className="w-full h-13 gradient-primary text-primary-foreground shadow-button font-semibold text-base rounded-xl flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            I've Sent the Money
          </Button>

          <button
            onClick={() => setStep('amount')}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Change amount
          </button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="py-10 space-y-6 text-center animate-fade-in max-w-xs mx-auto">
          {/* Pulsing orb */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-[pulse-ring_2s_ease-in-out_infinite]" />
            <div className="absolute inset-3 rounded-full bg-primary/30 animate-[pulse-ring_2s_ease-in-out_infinite_0.3s]" />
            <div className="absolute inset-6 rounded-full gradient-primary flex items-center justify-center shadow-button">
              <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl">Verifying Payment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hold on while we confirm your transfer...
            </p>
          </div>

          {/* Bouncing dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-primary animate-[bounce-dot_1.4s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          {/* Gradient progress */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
              }}
            />
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="py-6 space-y-6 text-center animate-scale-in max-w-sm mx-auto">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-success/15 flex items-center justify-center animate-[bounce-in_0.6s_ease-out]">
              <CheckCircle2 className="w-14 h-14 text-success animate-[check-pop_0.4s_ease-out_0.3s_both]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-accent animate-[particle_0.8s_ease-out_forwards]"
                  style={{
                    animationDelay: `${0.3 + i * 0.06}s`,
                    transform: `rotate(${i * 60}deg) translateY(-40px)`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-2xl text-foreground">Payment Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              Your wallet will be credited once the admin confirms your payment.
            </p>
          </div>

          <div className="bg-success/10 border border-success/20 rounded-2xl p-4 inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-success" />
            <span className="text-xl font-bold font-display text-success">
              +{formatCurrency(parseFloat(amount))}
            </span>
          </div>

          <Button onClick={handleClose} className="w-full h-13 bg-success hover:bg-success/90 text-success-foreground shadow-lg font-semibold text-base rounded-xl">
            Done
          </Button>
        </div>
      )}
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-border/40">
          <DialogHeader className="pt-6 px-6 border-b border-border/10 pb-4">
            <DialogTitle className="font-display text-xl text-center">
              {step === 'amount' && 'Fund Your Wallet'}
              {step === 'bank' && 'Complete Payment'}
              {step === 'verifying' && 'Confirming Payment'}
              {step === 'success' && 'Payment Submitted'}
            </DialogTitle>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border/10 pb-4">
          <DrawerTitle className="font-display text-xl text-center">
            {step === 'amount' && 'Fund Your Wallet'}
            {step === 'bank' && 'Complete Payment'}
            {step === 'verifying' && 'Confirming Payment'}
            {step === 'success' && 'Payment Submitted'}
          </DrawerTitle>
        </DrawerHeader>
        {Content}
      </DrawerContent>
    </Drawer>
  );
};
