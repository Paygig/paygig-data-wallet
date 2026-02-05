import { useState } from 'react';
import { Mail, Phone, Lock, LogOut, Loader2 } from 'lucide-react';
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
import logo from '@/assets/logo.png';

const Profile = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    setCurrentPassword('');
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
      <header className="gradient-primary px-4 pt-6 pb-16 rounded-b-3xl">
        <h1 className="font-display font-bold text-xl text-center text-primary-foreground">
          My Profile
        </h1>
      </header>

      {/* Profile Card */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-3">
              <img src={logo} alt="PayGig" className="w-12 h-12" />
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

      {/* Actions */}
      <div className="px-4 mt-6 space-y-3">
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
