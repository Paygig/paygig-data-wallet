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
        className="relative mx-auto max-w-md rounded-[28px] px-2 py-1.5"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.42) 50%, rgba(240,245,255,0.5) 100%)',
          backdropFilter: 'blur(50px) saturate(200%)',
          WebkitBackdropFilter: 'blur(50px) saturate(200%)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.07), 0 1.5px 4px rgba(0,0,0,0.04), inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -0.5px 0 rgba(0,0,0,0.03)',
          border: '0.5px solid rgba(255,255,255,0.55)',
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
                    className="absolute inset-0 rounded-[18px] animate-scale-in"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 100%)',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(255,255,255,0.6), inset 0 1.5px 0 rgba(255,255,255,0.9)',
                      border: '0.5px solid rgba(255,255,255,0.5)',
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
