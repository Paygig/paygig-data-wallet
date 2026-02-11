import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({ description: 'Please enter your email', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);

    if (error) {
      toast({ description: error.message, variant: 'destructive' });
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-hero-dark px-6 pt-12 pb-16 rounded-b-[2rem]">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="PayGig" className="w-20 h-20 mb-4 drop-shadow-lg" />
          <h1 className="font-display font-bold text-2xl text-primary-foreground mb-1">
            Reset Password
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            We'll send you a link to reset your password
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 -mt-6">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          {sent ? (
            <div className="py-6 text-center space-y-4 animate-scale-in">
              <div className="w-20 h-20 mx-auto rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl mb-2">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-center gap-2 justify-center">
                <Mail className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 gradient-primary text-primary-foreground shadow-button font-semibold"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-muted-foreground">
          <Link to="/login" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
