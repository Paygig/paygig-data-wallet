import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { WalletCard } from '@/components/WalletCard';
import { DataPlanCard } from '@/components/DataPlanCard';
import { FundWalletModal } from '@/components/FundWalletModal';
import { PurchaseModal } from '@/components/PurchaseModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { dataPlans, type BankDetails } from '@/lib/supabase';
import logo from '@/assets/logo.png';

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof dataPlans[0] | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

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

  const handleBuyPlan = (plan: typeof dataPlans[0]) => {
    setSelectedPlan(plan);
    setPurchaseModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="gradient-primary px-4 pt-6 pb-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PayGig" className="w-10 h-10 rounded-xl" />
            <div className="text-primary-foreground">
              <h1 className="font-display font-bold text-lg">PayGig</h1>
              <p className="text-xs opacity-80">Your Digital Data Wallet</p>
            </div>
          </div>
          <div className="text-right text-primary-foreground">
            <p className="text-xs opacity-80">Welcome back</p>
            <p className="font-medium text-sm truncate max-w-[150px]">
              {profile?.email?.split('@')[0] || 'User'}
            </p>
          </div>
        </div>
      </header>

      {/* Wallet Card - Overlapping header */}
      <div className="px-4 -mt-6 relative z-10">
        <WalletCard
          balance={profile?.balance || 0}
          onFundWallet={() => setFundModalOpen(true)}
        />
      </div>

      {/* Data Plans */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-foreground">MTN Data Plans</h2>
          <span className="text-xs text-muted-foreground">Best prices guaranteed</span>
        </div>

        <div className="grid gap-4">
          {dataPlans.map((plan) => (
            <DataPlanCard
              key={plan.id}
              {...plan}
              onBuy={() => handleBuyPlan(plan)}
              disabled={(profile?.balance || 0) < plan.price}
            />
          ))}
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
        onSuccess={refreshProfile}
      />
    </div>
  );
};

export default Dashboard;
