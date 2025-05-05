import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ReferralService from '@/services/referralService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Trophy, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ReferralLeaderboard: React.FC = () => {
  const {
    data: leaderboardResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['referralLeaderboard'],
    queryFn: () => ReferralService.getLeaderboard(10),
  });

  // Extract leaderboard data and user position
  const leaderboardData = leaderboardResponse?.leaderboard || [];
  const userPosition = leaderboardResponse?.userPosition;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="relative">
            <Trophy className="h-6 w-6 text-yellow-500 animate-shine" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          </div>
        );
      case 2:
        return (
          <div className="relative">
            <Medal className="h-5 w-5 text-gray-400" />
            <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-gray-300 rounded-full" />
          </div>
        );
      case 3:
        return (
          <div className="relative">
            <Medal className="h-5 w-5 text-amber-700" />
            <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-amber-600 rounded-full" />
          </div>
        );
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium">{rank}</span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`
                flex items-center p-4 rounded-lg border animate-pulse
                ${i === 1 ? 'bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200/50 dark:border-yellow-800/30' :
                  i === 2 ? 'bg-gray-50/50 dark:bg-gray-800/10 border-gray-200/50 dark:border-gray-800/30' :
                    i === 3 ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30' :
                      'bg-muted/30 border-muted/50'}
              `}
            >
              <div className="flex items-center justify-center h-8 w-8 mr-4">
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full mr-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-[180px]" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
              <div className="text-right pl-4 space-y-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-card border rounded-lg p-6">
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-full inline-flex items-center justify-center mb-4">
          <RefreshCw className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">Failed to Load Leaderboard</h3>
        <p className="text-muted-foreground mb-6">
          There was an error loading the referral leaderboard data
        </p>
        <Button
          variant="default"
          onClick={() => refetch()}
          className="bg-red-500 hover:bg-red-600 transition-colors duration-300 group active:scale-95"
        >
          <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="text-center py-8 bg-card border rounded-lg p-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-full inline-flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Leaderboard Data Yet</h3>
        <p className="text-muted-foreground mb-6">
          Be the first to start referring friends and appear on the leaderboard!
        </p>
        <Button
          variant="default"
          onClick={() => refetch()}
          className="bg-amber-500 hover:bg-amber-600 transition-colors duration-300 group active:scale-95"
        >
          <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          Refresh Leaderboard
        </Button>
      </div>
    );
  }

  return (
    <div className="referral-leaderboard">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium">Top Performers</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="transition-all hover:shadow-sm group hover:bg-primary hover:text-primary-foreground active:scale-95"
        >
          <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </Button>
      </div>

      {/* User's position if not in top 10 */}
      {userPosition && (
        <div className="mb-6 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex items-center justify-center h-8 w-8 mr-2 sm:mr-4 flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">#{userPosition.rank}</span>
                </div>
              </div>

              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-2 sm:mr-4 ring-2 ring-offset-2 ring-offset-background ring-primary/30 flex-shrink-0">
                <AvatarImage src={userPosition.profile?.profileImage} />
                <AvatarFallback>{userPosition.profile?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {userPosition.profile?.name} <span className="text-sm font-normal text-muted-foreground">(You)</span>
                </p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <Badge
                    variant={userPosition.successfulReferrals > 0 ? "default" : "outline"}
                    className={`text-xs transition-colors duration-200
                      ${userPosition.successfulReferrals > 0 ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
                  >
                    {userPosition.successfulReferrals}/{userPosition.totalReferrals}
                  </Badge>

                  {userPosition.milestoneLevel > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                    >
                      Level {userPosition.milestoneLevel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right pl-4 border-l border-border w-full sm:w-auto flex-shrink-0">
              <p className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {userPosition.earnedPoints}
              </p>
              <p className="text-xs text-muted-foreground">MyPts</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {leaderboardData.map((entry, index) => (
          <div
            key={entry.profile?._id}
            className={`
              flex flex-wrap sm:flex-nowrap items-center p-3 sm:p-4 rounded-lg transition-all duration-200
              ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 shadow-sm' :
                index === 1 ? 'bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800' :
                  index === 2 ? 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50' :
                    'bg-muted hover:bg-muted/80'}
              hover:shadow-md gap-2 sm:gap-0
            `}
          >
            <div className="flex items-center justify-center h-8 w-8 mr-2 sm:mr-4 flex-shrink-0">
              {getRankIcon(index + 1)}
            </div>

            <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 mr-2 sm:mr-4 ring-2 ring-offset-2 ring-offset-background transition-all duration-200 flex-shrink-0
              ${index === 0 ? 'ring-yellow-500/50' :
                index === 1 ? 'ring-gray-400/50' :
                  index === 2 ? 'ring-amber-700/50' : 'ring-primary/20'}`}
            >
              <AvatarImage src={entry.profile?.profileImage} />
              <AvatarFallback>{entry.profile?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{entry.profile?.name}</p>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <Badge
                  variant={entry.successfulReferrals > 0 ? "default" : "outline"}
                  className={`text-xs transition-colors duration-200
                    ${entry.successfulReferrals > 0 ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
                >
                  {entry.successfulReferrals}/{entry.totalReferrals}
                </Badge>

                {entry.milestoneLevel > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                  >
                    Level {entry.milestoneLevel}
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right pl-4 border-l border-border w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
              <p className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {entry.earnedPoints}
              </p>
              <p className="text-xs text-muted-foreground">MyPts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferralLeaderboard;
