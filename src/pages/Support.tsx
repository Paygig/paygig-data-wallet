import { ExternalLink } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import telegramLogo from '@/assets/telegram-logo.png';

const Support = () => {
  const handleContactSupport = () => {
    window.open('https://t.me/Thirstyfishes', '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <h1 className="font-display font-bold text-xl text-center">Support</h1>
      </header>

      {/* Content */}
      <div className="px-4 py-8">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center">
          <div className="w-24 h-24 mx-auto mb-6">
            <img src={telegramLogo} alt="Telegram" className="w-full h-full object-contain" />
          </div>
          
          <h2 className="font-display font-bold text-xl mb-2">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is available 24/7 on Telegram. Click the button below to chat with us directly.
          </p>

          <Button
            onClick={handleContactSupport}
            className="w-full gradient-primary text-primary-foreground shadow-button h-12"
          >
            <img src={telegramLogo} alt="" className="w-5 h-5 mr-2" />
            Chat on Telegram
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
            <div className="space-y-4 text-left">
              <div>
                <p className="font-medium text-sm">How long does wallet funding take?</p>
                <p className="text-sm text-muted-foreground">
                  Wallet funding is instant once the admin confirms your payment.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">How do I use my coupon code?</p>
                <p className="text-sm text-muted-foreground">
                  Dial *131*1# and follow the prompts to enter your coupon code.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Is my payment secure?</p>
                <p className="text-sm text-muted-foreground">
                  Yes, all payments are made directly to our verified bank account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Support;
