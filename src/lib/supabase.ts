import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  email: string;
  phone: string | null;
  balance: number;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'purchase';
  amount: number;
  status: 'pending' | 'success' | 'failed';
  coupon_code: string | null;
  description: string | null;
  created_at: string;
};

export type AppSetting = {
  key: string;
  value: string;
};

export type BankDetails = {
  bank: string;
  acc: string;
  name: string;
};

export const dataPlans = [
  {
    id: 'sme-starter',
    name: 'SME Starter',
    data: '50GB',
    price: 7500,
    badge: 'Try Me',
    validity: '30 Days',
  },
  {
    id: 'streamer',
    name: 'Streamer',
    data: '100GB',
    price: 14900,
    validity: '30 Days',
  },
  {
    id: 'professional',
    name: 'Professional',
    data: '200GB',
    price: 24900,
    validity: '6 Months',
  },
  {
    id: 'office-hub',
    name: 'Office Hub',
    data: '400GB',
    price: 34500,
    badge: '🔥 Most Popular',
    validity: '6 Months',
  },
  {
    id: 'mega-tera',
    name: 'Mega Tera',
    data: '1TB',
    price: 64500,
    badge: 'Best Value',
    validity: '6 Months',
  },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateCouponCode = () => {
  const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `${digits}S`;
};
