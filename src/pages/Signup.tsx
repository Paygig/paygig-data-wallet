import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !phone || !password) {
      toast({ description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, phone);
    setLoading(false);

    if (error) {
      toast({ description: error.message, variant: 'destructive' });
      return;
    }

    toast({ 
      description: 'Account created successfully! Welcome to PayGig.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero px-6 pt-12 pb-16 rounded-b-[2rem]">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="PayGig" className="w-20 h-20 mb-4 drop-shadow-lg" />
          <h1 className="font-display font-bold text-2xl text-primary-foreground mb-1">
            Create Account
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            Join PayGig and start saving on data
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8 -mt-6">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
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
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
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
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
