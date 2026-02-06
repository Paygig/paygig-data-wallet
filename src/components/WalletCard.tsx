import { Wallet, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/supabase';
import logo from '@/assets/logo.png';

type WalletCardProps = {
  balance: number;
  onFundWallet: () => void;
};

export const WalletCard = ({ balance, onFundWallet }: WalletCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground shadow-xl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-[3px] border-primary-foreground" />
        <div className="absolute -right-2 -top-2 w-20 h-20 rounded-full border-[3px] border-primary-foreground" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full border-[3px] border-primary-foreground" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PayGig" className="w-10 h-10 rounded-lg bg-primary-foreground/20 p-1 backdrop-blur-sm" />
            <div>
              <h3 className="text-sm font-semibold opacity-95">PayGig Wallet</h3>
              <p className="text-[10px] opacity-60 font-medium">Digital Data Wallet</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm">
            <Wallet className="w-5 h-5 opacity-90" />
          </div>
        </div>
        
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs opacity-70 font-medium">Available Balance</p>
            <TrendingUp className="w-3 h-3 opacity-50" />
          </div>
          <p className="text-[2rem] font-display font-bold tracking-tight leading-none animate-balance-pop">
            {formatCurrency(balance)}
          </p>
        </div>
        
        <Button
          onClick={onFundWallet}
          variant="secondary"
          className="w-full bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border border-primary-foreground/10 font-semibold backdrop-blur-sm transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Fund Wallet
        </Button>
      </div>
    </div>
  );
};
