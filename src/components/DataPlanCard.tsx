import { Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import mtnLogo from '@/assets/mtn-logo.jpeg';

type DataPlanCardProps = {
  name: string;
  data: string;
  price: number;
  badge?: string;
  validity: string;
  onBuy: () => void;
  disabled?: boolean;
};

export const DataPlanCard = ({
  name,
  data,
  price,
  badge,
  validity,
  onBuy,
  disabled,
}: DataPlanCardProps) => {
  const isPopular = badge === '🔥 Most Popular';
  
  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl p-4 shadow-card border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]',
        isPopular && 'ring-2 ring-accent border-accent/30'
      )}
    >
      {badge && (
        <Badge
          className={cn(
            'absolute -top-2.5 left-4 text-[10px] font-bold px-2.5 py-0.5 shadow-sm',
            isPopular
              ? 'bg-accent text-accent-foreground'
              : badge === 'Best Value'
              ? 'bg-success text-success-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {badge}
        </Badge>
      )}
      
      <div className="flex items-start gap-3 mb-3 mt-1">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-border">
          <img src={mtnLogo} alt="MTN" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate text-[15px]">{name}</h3>
          <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
            <Wifi className="w-3 h-3" />
            <span className="text-[11px] font-medium">{validity}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-display font-bold text-primary leading-none">{data}</p>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{formatCurrency(price)}</p>
        </div>
        <Button
          onClick={onBuy}
          disabled={disabled}
          size="sm"
          className="gradient-primary text-primary-foreground shadow-button font-semibold rounded-xl px-5 transition-all duration-200 active:scale-95"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
};
