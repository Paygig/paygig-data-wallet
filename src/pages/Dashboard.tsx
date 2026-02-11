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

      {/* Download APK Banner */}
      <section className="px-5 mt-6">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
          <div
            className="relative overflow-hidden rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(40, 100%, 45%) 100%)',
            }}
            onClick={() => window.open('#', '_blank')}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-foreground">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-sm text-foreground">Download Our App</p>
                <p className="text-xs text-foreground/70 mt-0.5">Get ₦500 bonus when you install the APK!</p>
              </div>
              <div className="bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                +₦500
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 mt-5 mb-4">
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
