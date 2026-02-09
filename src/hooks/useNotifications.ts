import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const prevBalance = useRef<number | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen for profile balance changes to show notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newBalance = Number((payload.new as any).balance);
          const oldBalance = prevBalance.current;

          if (oldBalance !== null && newBalance > oldBalance) {
            const added = newBalance - oldBalance;
            showNotification(
              'Wallet Funded! 💰',
              `₦${added.toLocaleString()} has been added to your wallet.`
            );
          }

          prevBalance.current = newBalance;
        }
      )
      .subscribe();

    // Set initial balance
    supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) prevBalance.current = Number(data.balance);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};

function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
    });
  }
}
