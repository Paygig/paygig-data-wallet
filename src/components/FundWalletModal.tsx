import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, CheckCircle2, Sparkles, ArrowLeft } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
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

  const quickAmounts = [1000, 5000, 10000, 20000];

  const Content = (
    <div className="px-6 py-6 overflow-y-auto">
      {step === 'amount' && (
        <div className="space-y-6 animate-fade-in max-w-sm mx-auto">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-muted-foreground mb-2">How much would you like to add?</span>
            <div className="relative w-full max-w-[200px]">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-2xl">
                ₦
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-3xl font-bold border-none shadow-none text-center h-14 bg-transparent focus-visible:ring-0 px-0"
                autoFocus
              />
            </div>
            <div className="h-[1px] w-full bg-border mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                variant="outline"
                onClick={() => setAmount(amt.toString())}
                className="h-12 border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all font-medium rounded-xl"
              >
                ₦{amt.toLocaleString()}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleProceed}
            className="w-full h-12 gradient-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold text-lg rounded-xl mt-4"
          >
            Continue to Payment
          </Button>
        </div>
      )}

      {step === 'bank' && bankDetails && (
        <div className="space-y-5 animate-fade-in max-w-sm mx-auto">
          <div className="text-center mb-2">
            <p className="text-sm text-muted-foreground">Transfer exactly</p>
            <p className="text-3xl font-bold font-display text-primary mt-1">
              {formatCurrency(parseFloat(amount))}
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-card border border-border/40 overflow-hidden">
            <div className="p-3 border-b border-border/10">
              <p className="text-xs text-muted-foreground uppercase tracking-widest text-center font-medium">Bank Details</p>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Bank Name</span>
                <span className="font-bold text-lg">{bankDetails.bank}</span>
              </div>

              <div className="bg-secondary rounded-xl p-4 flex flex-col items-center justify-center relative group cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => handleCopy(bankDetails.acc)}>
                <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Account Number</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                    {bankDetails.acc}
                  </span>
                  {copied ? (
                    <Check className="w-5 h-5 text-success animate-scale-in" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Account Name</span>
                <span className="font-medium text-center">{bankDetails.name}</span>
              </div>
            </div>

            <div className="bg-accent/10 p-3 text-center border-t border-accent/20">
              <p className="text-xs text-accent-foreground font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Use this account for this transaction only
              </p>
            </div>
          </div>

          <Button
            onClick={handleConfirmPayment}
            className="w-full h-12 gradient-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold text-lg rounded-xl"
          >
            I've Sent the Money
          </Button>

          <Button
            variant="ghost"
            onClick={() => setStep('amount')}
            className="w-full text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="py-10 space-y-6 text-center animate-fade-in max-w-xs mx-auto">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl">Verifying Payment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Please hold on while we confirm your payment...
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
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
            {/* Celebration particles */}
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

          <Button onClick={handleClose} className="w-full h-12 bg-success hover:bg-success/90 text-success-foreground shadow-lg font-semibold text-lg rounded-xl">
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
