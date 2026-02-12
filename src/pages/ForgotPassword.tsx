import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, CheckCircle2, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      toast({ description: 'Please enter your email', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    setLoading(false);

    if (error) {
      toast({ description: error.message, variant: 'destructive' });
      return;
    }

    setStep('otp');
    setResendCooldown(60);
    toast({ description: 'OTP sent to your email' });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextEmpty]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast({ description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpString,
      type: 'recovery',
    });
    setLoading(false);

    if (error) {
      toast({ description: 'Invalid or expired code. Please try again.', variant: 'destructive' });
      return;
    }

    setStep('newPassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast({ description: error.message, variant: 'destructive' });
      return;
    }

    setStep('success');
  };

  const otpFilled = otp.every((d) => d !== '');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-hero-dark px-6 pt-12 pb-16 rounded-b-[2rem]">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="PayGig" className="w-20 h-20 mb-4 drop-shadow-lg" />
          <h1 className="font-display font-bold text-2xl text-primary-foreground mb-1">
            {step === 'email' && 'Reset Password'}
            {step === 'otp' && 'Enter Code'}
            {step === 'newPassword' && 'New Password'}
            {step === 'success' && 'All Done!'}
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            {step === 'email' && "We'll send a 6-digit code to your email"}
            {step === 'otp' && `Code sent to ${email}`}
            {step === 'newPassword' && 'Create a strong new password'}
            {step === 'success' && 'Your password has been reset'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 -mt-6">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 gradient-primary text-primary-foreground shadow-button font-semibold"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Code
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>

              <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={loading || !otpFilled}
                className="w-full h-12 gradient-primary text-primary-foreground shadow-button font-semibold"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify Code
              </Button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in <span className="font-semibold text-foreground">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-sm text-primary font-semibold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 gradient-primary text-primary-foreground shadow-button font-semibold"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-5 animate-scale-in">
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-success/15 flex items-center justify-center animate-[bounce-in_0.6s_ease-out]">
                  <CheckCircle2 className="w-12 h-12 text-success animate-[check-pop_0.4s_ease-out_0.3s_both]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-accent animate-[particle_0.8s_ease-out_forwards]"
                      style={{
                        animationDelay: `${0.3 + i * 0.06}s`,
                        transform: `rotate(${i * 60}deg) translateY(-40px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl mb-2">Password Updated!</h3>
                <p className="text-sm text-muted-foreground">
                  You can now sign in with your new password.
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-success hover:bg-success/90 text-success-foreground shadow-lg font-semibold rounded-xl"
              >
                Go to Sign In
              </Button>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <p className="text-center mt-6 text-muted-foreground">
            <Link to="/login" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
