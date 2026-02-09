import { useState } from 'react';
import { Copy, Check, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, type BankDetails } from '@/lib/supabase';

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

    // Create pending transaction
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

    // Notify admin via Telegram
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

    // Simulate verification progress
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

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh] bg-zinc-50 dark:bg-zinc-950">
        <DrawerHeader className="border-b border-border/10 pb-4">
          <DrawerTitle className="font-display text-xl text-center">
            {step === 'amount' && 'Fund Your Wallet'}
            {step === 'bank' && 'Complete Payment'}
            {step === 'verifying' && 'Confirming Payment'}
            {step === 'success' && 'Payment Successful'}
          </DrawerTitle>
        </DrawerHeader>

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
                    className="h-12 border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all font-medium"
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
            <div className="space-y-6 animate-fade-in max-w-sm mx-auto">
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">Transfer exactly</p>
                <p className="text-3xl font-bold font-display text-primary mt-1">
                  {formatCurrency(parseFloat(amount))}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                <div className="p-4 border-b border-border/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest text-center font-medium">Bank Details</p>
                </div>

                <div className="p-5 space-y-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">Bank Name</span>
                    <span className="font-bold text-lg">{bankDetails.bank}</span>
                  </div>

                  <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 flex flex-col items-center justify-center relative group cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
                    onClick={() => handleCopy(bankDetails.acc)}>
                    <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Account Number</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                        {bankDetails.acc}
                      </span>
                      {copied ? (
                        <Check className="w-5 h-5 text-green-500 animate-in zoom-in" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 pt-1">
                    <span className="text-sm text-muted-foreground">Account Name</span>
                    <span className="font-medium text-center">{bankDetails.name}</span>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-3 text-center border-t border-amber-100 dark:border-amber-900/50">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Cancel and go back
              </Button>
            </div>
          )}

          {step === 'verifying' && (
            <div className="py-12 space-y-8 text-center animate-fade-in max-w-xs mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-20 h-20 mx-auto text-primary animate-spin relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl">Verifying Transaction</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Please hold on tight while we confirm your payment with the bank server...
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 space-y-8 text-center animate-scale-in max-w-sm mx-auto">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-14 h-14 text-green-600 dark:text-green-500" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-2xl text-foreground">Payment Successful!</h3>
                <p className="text-muted-foreground">
                  Your wallet has been credited with
                </p>
                <div className="bg-muted/30 py-2 px-4 rounded-lg inline-block mt-2">
                  <span className="text-xl font-bold font-display text-primary">
                    +{formatCurrency(parseFloat(amount))}
                  </span>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full h-12 gradient-success text-white shadow-lg shadow-green-500/20 font-semibold text-lg rounded-xl mt-4">
                Done
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
