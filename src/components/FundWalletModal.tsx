import { useState } from 'react';
import { Copy, Check, Loader2, CheckCircle2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'pending',
      description: `Wallet funding - ${formatCurrency(parseFloat(amount))}`,
    });

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {step === 'amount' && 'Fund Wallet'}
            {step === 'bank' && 'Complete Payment'}
            {step === 'verifying' && 'Verifying Transaction...'}
            {step === 'success' && 'Payment Submitted!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Enter Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg font-semibold"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                  className="flex-1"
                >
                  ₦{amt.toLocaleString()}
                </Button>
              ))}
            </div>

            <Button onClick={handleProceed} className="w-full gradient-primary text-primary-foreground shadow-button">
              Proceed to Pay
            </Button>
          </div>
        )}

        {step === 'bank' && bankDetails && (
          <div className="space-y-4">
            <div className="bg-accent/20 rounded-xl p-4 border border-accent">
              <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {formatCurrency(parseFloat(amount))}
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Name</p>
                    <p className="font-semibold">{bankDetails.bank}</p>
                  </div>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-semibold font-mono text-lg">{bankDetails.acc}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(bankDetails.acc)}
                    className="h-8 w-8"
                  >
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="font-semibold">{bankDetails.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <p className="text-xs text-center text-warning-foreground">
                ⚠️ Transfer exact amount of <strong>{formatCurrency(parseFloat(amount))}</strong> to avoid delays
              </p>
            </div>

            <Button onClick={handleConfirmPayment} className="w-full gradient-primary text-primary-foreground shadow-button">
              I've Sent the Money
            </Button>
          </div>
        )}

        {step === 'verifying' && (
          <div className="py-8 space-y-6 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <div>
              <p className="font-semibold mb-2">Verifying Your Transaction</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your payment...
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div>
              <p className="font-display font-bold text-xl mb-2">Payment Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Your wallet will be credited instantly upon confirmation.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
