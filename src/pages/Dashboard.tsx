import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { WalletCard } from '@/components/WalletCard';
import { DataPlanCard } from '@/components/DataPlanCard';
import { HowToRedeemCard } from '@/components/HowToRedeemCard';
import { FundWalletModal } from '@/components/FundWalletModal';
import { PurchaseModal } from '@/components/PurchaseModal';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeBalance } from '@/hooks/useRealtimeBalance';
import { useNotifications } from '@/hooks/useNotifications';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { supabase } from '@/integrations/supabase/client';
import { dataPlans, type BankDetails } from '@/lib/supabase';
import logo from '@/assets/logo.png';

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof dataPlans[0] | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

  useRealtimeBalance();
  useNotifications();

  const handleRefresh = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    const fetchBankDetails = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'bank_details')
        .maybeSingle();
      
      if (data) {
        setBankDetails(JSON.parse(data.value));
      }
    };
    fetchBankDetails();
  }, []);

  // Realtime bank details updates from admin bot
  useEffect(() => {
    const channel = supabase
      .channel('bank-details-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.bank_details',
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData?.value) {
            setBankDetails(JSON.parse(newData.value));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleBuyPlan = (plan: typeof dataPlans[0]) => {
    setSelectedPlan(plan);
    setPurchaseModalOpen(true);
  };

  const getEffectiveBalance = (plan: typeof dataPlans[0]) => {
    const balance = profile?.balance || 0;
    const bonus = (profile as any)?.bonus_balance || 0;
    return plan.bonusEligible ? balance + bonus : balance;
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background pb-24 overflow-y-auto"
    >
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
      />

      <header className="gradient-hero-dark px-5 pt-7 pb-12 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PayGig" className="w-11 h-11" />
            <div className="text-primary-foreground">
              <h1 className="font-display font-bold text-xl tracking-tight">PayGig</h1>
              <p className="text-[11px] opacity-75 font-medium">Your Digital Data Wallet</p>
            </div>
          </div>
          <div className="text-right text-primary-foreground">
            <p className="text-[11px] opacity-75 font-medium">Welcome back</p>
            <p className="font-semibold text-sm truncate max-w-[140px]">
              {profile?.email?.split('@')[0] || 'User'}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-8 relative z-10 animate-scale-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
        <WalletCard
          balance={profile?.balance || 0}
          bonusBalance={(profile as any)?.bonus_balance || 0}
          onFundWallet={() => setFundModalOpen(true)}
        />
      </div>

      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-5 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <h2 className="font-display font-bold text-lg text-foreground">MTN Data Plans</h2>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Best prices ⚡
          </span>
        </div>

        <div className="grid gap-3.5">
          {dataPlans.map((plan, i) => (
            <div
              key={plan.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${0.25 + i * 0.07}s`, opacity: 0 }}
            >
              <DataPlanCard
                {...plan}
                onBuy={() => handleBuyPlan(plan)}
                disabled={getEffectiveBalance(plan) < plan.price}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 mt-7 mb-4">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
          <HowToRedeemCard />
        </div>
      </section>

      <BottomNav />
      
      <FundWalletModal
        open={fundModalOpen}
        onOpenChange={setFundModalOpen}
        bankDetails={bankDetails}
      />

      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        plan={selectedPlan}
        userBalance={profile?.balance || 0}
        bonusBalance={(profile as any)?.bonus_balance || 0}
        onSuccess={refreshProfile}
      />
    </div>
  );
};

export default Dashboard;
