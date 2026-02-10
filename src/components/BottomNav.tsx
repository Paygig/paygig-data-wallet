import { Home, History, User, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: History, label: 'History', path: '/history' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: MessageCircle, label: 'Support', path: '/support' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div
        className="relative mx-auto max-w-md rounded-[22px] px-2 py-1.5"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.55) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.45)',
        }}
      >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 w-16 h-12 transition-all duration-300 rounded-2xl',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground/70 hover:text-foreground/80 active:scale-90'
                )}
              >
                {/* Active pill background */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl animate-scale-in"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 100%)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                      border: '1px solid rgba(255,255,255,0.5)',
                    }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  <item.icon
                    className={cn(
                      'w-[20px] h-[20px] transition-all duration-300',
                      isActive && 'scale-110'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span
                    className={cn(
                      'text-[9px] mt-0.5 transition-all duration-300',
                      isActive ? 'font-bold opacity-100' : 'font-medium opacity-70'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
