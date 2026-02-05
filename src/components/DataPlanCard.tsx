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
        'relative bg-card rounded-xl p-4 shadow-card border border-border transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        isPopular && 'ring-2 ring-accent'
      )}
    >
      {badge && (
        <Badge
          className={cn(
            'absolute -top-2 left-4 text-xs font-semibold',
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
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <img src={mtnLogo} alt="MTN" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wifi className="w-3 h-3" />
            <span className="text-xs">{validity}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-2xl font-display font-bold text-primary">{data}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(price)}</p>
        </div>
        <Button
          onClick={onBuy}
          disabled={disabled}
          size="sm"
          className="gradient-primary text-primary-foreground shadow-button font-semibold"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
};
