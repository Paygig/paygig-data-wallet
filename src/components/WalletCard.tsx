import { Wallet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/supabase';
import logo from '@/assets/logo.png';

type WalletCardProps = {
  balance: number;
  onFundWallet: () => void;
};

export const WalletCard = ({ balance, onFundWallet }: WalletCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground shadow-button">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-foreground/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-primary-foreground/20" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PayGig" className="w-10 h-10 rounded-lg bg-primary-foreground/20 p-1" />
            <div>
              <h3 className="text-sm font-medium opacity-90">PayGig Wallet</h3>
              <p className="text-xs opacity-70">Your Digital Data Wallet</p>
            </div>
          </div>
          <Wallet className="w-8 h-8 opacity-80" />
        </div>
        
        <div className="mb-6">
          <p className="text-sm opacity-80 mb-1">Available Balance</p>
          <p className="text-3xl font-display font-bold tracking-tight">
            {formatCurrency(balance)}
          </p>
        </div>
        
        <Button
          onClick={onFundWallet}
          variant="secondary"
          className="w-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Fund Wallet
        </Button>
      </div>
    </div>
  );
};
