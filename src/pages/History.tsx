import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Package } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, type Transaction } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const typeFilters = [
  { value: 'all', label: 'All' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'purchase', label: 'Purchases' },
];

const statusFilters = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

const History = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
  const [couponVisible, setCouponVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      setLoading(true);

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;

      if (data) {
        setTransactions(data as Transaction[]);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [user, typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning-foreground';
      case 'failed':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <h1 className="font-display font-bold text-xl text-center">Transaction History</h1>
      </header>

      {/* Filters */}
      {/* Filters */}
      <div className="px-4 pt-4 pb-2 sticky top-[60px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                typeFilter === f.value
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="w-[1px] h-6 bg-border mx-1 self-center" />
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                statusFilter === f.value
                  ? 'bg-accent border-accent text-accent-foreground shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground">
              {typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try changing your filters'
                : 'Your transaction history will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-card rounded-xl p-4 shadow-card border border-border"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      tx.type === 'deposit' ? 'bg-success/20' : 'bg-primary/20'
                    )}
                  >
                    {tx.type === 'deposit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate">
                        {tx.type === 'deposit' ? 'Wallet Funding' : 'Data Purchase'}
                      </p>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          getStatusColor(tx.status)
                        )}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {tx.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                      </p>
                      <p
                        className={cn(
                          'font-display font-bold',
                          tx.type === 'deposit' ? 'text-success' : 'text-foreground'
                        )}
                      >
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>

                    {tx.type === 'purchase' && tx.status === 'success' && tx.coupon_code && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => {
                          setSelectedCoupon(tx.coupon_code);
                          setCouponVisible(false);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Coupon
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Coupon Dialog */}
      <Dialog open={!!selectedCoupon} onOpenChange={() => setSelectedCoupon(null)}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="font-display">Your Coupon Code</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-accent/20 border-2 border-accent rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {couponVisible ? (
                  <span className="font-mono text-2xl font-bold tracking-wider">
                    {selectedCoupon}
                  </span>
                ) : (
                  <span className="font-mono text-2xl font-bold tracking-wider">
                    ••••••••••
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCouponVisible(!couponVisible)}
                >
                  {couponVisible ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Use this code to activate your MTN data plan
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
