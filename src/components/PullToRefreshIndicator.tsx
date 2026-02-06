import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
};

export const PullToRefreshIndicator = ({ pullDistance, isRefreshing, threshold = 80 }: Props) => {
  if (pullDistance === 0 && !isRefreshing) return null;
  
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: pullDistance > 0 ? `${pullDistance}px` : 0 }}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-full bg-card shadow-md border border-border flex items-center justify-center transition-transform',
          isRefreshing && 'animate-spin'
        )}
        style={{ transform: isRefreshing ? undefined : `rotate(${rotation}deg)`, opacity: progress }}
      >
        <RefreshCw className="w-4 h-4 text-primary" />
      </div>
    </div>
  );
};
