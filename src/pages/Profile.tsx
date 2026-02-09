import { useState } from 'react';
import { Mail, Phone, Lock, LogOut, Loader2, Share2, Copy, Check, Gift, User } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';


const Profile = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/signup?ref=${profile.referral_code}`
    : '';

  const handleCopyReferral = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ description: 'Referral link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareReferral = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join PayGig',
          text: `Join PayGig and get cheap MTN data! Use my referral link:`,
          url: referralLink,
        });
      } catch {
        handleCopyReferral();
      }
    } else {
      handleCopyReferral();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      toast({ description: error.message, variant: 'destructive' });
      return;
    }

    toast({ description: 'Password updated successfully!' });
    setPasswordDialogOpen(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="gradient-hero-dark px-4 pt-6 pb-16 rounded-b-3xl">
        <h1 className="font-display font-bold text-xl text-center text-primary-foreground">
          My Profile
        </h1>
      </header>

      {/* Profile Card */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border animate-fade-in">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-3">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <p className="font-display font-bold text-lg">
              {profile?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-sm text-muted-foreground">PayGig Member</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="font-medium">{profile?.phone || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Card */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-accent" />
            <h3 className="font-display font-bold text-base">Refer & Earn ₦500</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Share your referral link with friends. You earn ₦500 wallet credit for every friend who signs up!
          </p>

          {profile?.referral_code && (
            <div className="space-y-3">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                <p className="font-mono font-bold text-lg text-primary">{profile.referral_code}</p>
              </div>
              
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground mb-1">Your Link</p>
                <p className="text-xs font-mono truncate">{referralLink}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopyReferral}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  className="flex-1 gap-2 gradient-primary text-primary-foreground"
                  onClick={handleShareReferral}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-4 space-y-3">
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-3 h-14">
              <Lock className="w-5 h-5 text-primary" />
              <span>Change Password</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="font-display">Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                className="w-full gradient-primary text-primary-foreground"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
