import { CheckCircle2, Phone, CreditCard, Clock, Wifi, ArrowRight } from 'lucide-react';

const steps = [
  { icon: CreditCard, text: 'Send payment for your chosen plan' },
  { icon: CheckCircle2, text: 'System generates unique coupon code' },
  { icon: Phone, text: 'Redeem by dialing: *460*6*1#' },
  { icon: ArrowRight, text: "Enter the code ending with 'S'" },
];

const benefits = [
  { icon: Clock, text: 'Valid for 6 months once redeemed (200GB+ plans)' },
  { icon: Phone, text: 'Check balance with *3234#' },
  { icon: Wifi, text: 'Works instantly on MTN lines' },
  { icon: CreditCard, text: 'Payment via Bank Transfer' },
];

export const HowToRedeemCard = () => {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="gradient-primary px-5 py-4">
        <h3 className="font-display font-bold text-base text-primary-foreground">
          📖 How to Redeem
        </h3>
        <p className="text-xs text-primary-foreground/80 mt-0.5">
          Get your data in 4 simple steps
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Steps */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            How it works
          </p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-foreground leading-snug">{step.text}</p>
                </div>
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mt-1">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Benefits */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Benefits
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-muted/50 rounded-xl px-3.5 py-2.5 transition-colors hover:bg-muted">
                <benefit.icon className="w-4 h-4 text-success flex-shrink-0" />
                <p className="text-sm text-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
