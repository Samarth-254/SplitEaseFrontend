import { motion } from 'framer-motion';
import { Screen } from '../../components/layout';

export const DashboardSkeleton = () => {
  return (
    <Screen>
      <div className="space-y-5 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-3 w-20 bg-neutral-800 rounded mb-2"></div>
            <div className="h-7 w-32 bg-neutral-800 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-neutral-800 rounded-lg"></div>
            <div className="h-9 w-20 bg-neutral-800 rounded-lg"></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-neutral-800 rounded-lg"></div>
                <div className="h-3 w-12 bg-neutral-800 rounded"></div>
              </div>
              <div className="h-8 sm:h-10 bg-neutral-800 rounded-lg mb-2"></div>
              <div className="h-3 sm:h-4 w-20 bg-neutral-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Groups and Debts Grid */}
        <div className="grid gap-3 lg:grid-cols-2">
          {/* Groups Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 w-32 bg-neutral-800 rounded"></div>
              <div className="h-8 w-16 bg-neutral-800 rounded"></div>
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-800 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-neutral-800 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-neutral-800 rounded"></div>
                  </div>
                  <div className="w-16 h-5 bg-neutral-800 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Debts Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 w-32 bg-neutral-800 rounded"></div>
              <div className="h-4 w-16 bg-neutral-800 rounded"></div>
            </div>
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-neutral-800 rounded-xl flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-neutral-800 rounded"></div>
                    </div>
                    <div className="w-16 h-5 bg-neutral-800 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                    <div className="h-3 w-32 bg-neutral-800 rounded"></div>
                    <div className="h-4 w-16 bg-neutral-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
};
