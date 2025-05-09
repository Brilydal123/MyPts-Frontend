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
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500 animate-shine" />
            <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-pulse" />
          </div>
        );
      case 2:
        return (
          <div className="relative">
            <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400" />
            <span className="absolute -bottom-1 -right-1 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-300 rounded-full" />
          </div>
        );
      case 3:
        return (
          <div className="relative">
            <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-amber-700" />
            <span className="absolute -bottom-1 -right-1 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-600 rounded-full" />
          </div>
        );
      default:
        return (
          <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-[10px] sm:text-xs md:text-sm font-medium">{rank}</span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full" />
            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
          </div>
          <Skeleton className="h-8 sm:h-9 w-full sm:w-24 rounded-md" />
        </div>

        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`
                flex items-center p-2 sm:p-3 md:p-4 rounded-lg border animate-pulse
                ${i === 1 ? 'bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200/50 dark:border-yellow-800/30' :
                  i === 2 ? 'bg-gray-50/50 dark:bg-gray-800/10 border-gray-200/50 dark:border-gray-800/30' :
                    i === 3 ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30' :
                      'bg-muted/30 border-muted/50'}
              `}
            >
              <div className="flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 mr-1 sm:mr-2 md:mr-4">
                <Skeleton className="h-4 w-4 sm:h-6 sm:w-6 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full mr-1 sm:mr-2 md:mr-4" />
              <div className="space-y-1 sm:space-y-2 flex-1">
                <Skeleton className="h-4 sm:h-5 w-[120px] sm:w-[180px]" />
                <div className="flex gap-1 sm:gap-2">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 rounded-full" />
                  <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 rounded-full" />
                </div>
              </div>
              <div className="text-right pl-2 sm:pl-4 space-y-1">
                <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
                <Skeleton className="h-2 sm:h-3 w-8 sm:w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 sm:py-6 md:py-8 bg-card border rounded-lg p-3 sm:p-4 md:p-6">
        <div className="bg-red-50 dark:bg-red-950/20 p-3 sm:p-4 rounded-full inline-flex items-center justify-center mb-2 sm:mb-4">
          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
        </div>
        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Failed to Load Leaderboard</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-6">
          There was an error loading the referral leaderboard data
        </p>
        <Button
          variant="default"
          size="sm"
          onClick={() => refetch()}
          className="bg-red-500 hover:bg-red-600 transition-colors duration-300 group active:scale-95 h-8 sm:h-10 text-xs sm:text-sm"
        >
          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="text-center py-4 sm:py-6 md:py-8 bg-card border rounded-lg p-3 sm:p-4 md:p-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 sm:p-4 rounded-full inline-flex items-center justify-center mb-2 sm:mb-4">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
        </div>
        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No Leaderboard Data Yet</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-6">
          Be the first to start referring friends and appear on the leaderboard!
        </p>
        <Button
          variant="default"
          size="sm"
          onClick={() => refetch()}
          className="bg-amber-500 hover:bg-amber-600 transition-colors duration-300 group active:scale-95 h-8 sm:h-10 text-xs sm:text-sm"
        >
          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:rotate-180 transition-transform duration-500" />
          Refresh Leaderboard
        </Button>
      </div>
    );
  }

  return (
    <div className="referral-leaderboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <p className="text-xs sm:text-sm font-medium">Top Performers</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="transition-all hover:shadow-sm group hover:bg-primary hover:text-primary-foreground active:scale-95 h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
        >
          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </Button>
      </div>

      {/* User's position if not in top 10 */}
      {userPosition && (
        <div className="mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 md:p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 mr-1 sm:mr-2 md:mr-4 flex-shrink-0">
                <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-primary">#{userPosition.rank}</span>
                </div>
              </div>

              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mr-1 sm:mr-2 md:mr-4 ring-1 sm:ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-background ring-primary/30 flex-shrink-0">
                <AvatarImage src={userPosition.profile?.profileImage} />
                <AvatarFallback>
                  {userPosition.profile && (userPosition.profile.name || userPosition.profile.profileInformation?.username)
                    ? (userPosition.profile.name || userPosition.profile.profileInformation?.username)!.substring(0, 2).toUpperCase()
                    : 'N/A'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="font-semibold truncate text-sm sm:text-base">{(userPosition.profile?.name || userPosition.profile?.profileInformation?.username)} <span className="text-xs sm:text-sm font-normal text-muted-foreground">(You)</span></p>
                <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                  <Badge
                    variant={userPosition.successfulReferrals > 0 ? "default" : "outline"}
                    className={`text-[10px] sm:text-xs transition-colors duration-200 px-1.5 sm:px-2.5 py-0.5
                      ${userPosition.successfulReferrals > 0 ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
                  >
                    {userPosition.successfulReferrals}/{userPosition.totalReferrals}
                  </Badge>

                  {userPosition.milestoneLevel > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] sm:text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 px-1.5 sm:px-2.5 py-0.5"
                    >
                      Level {userPosition.milestoneLevel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right pl-2 sm:pl-4 border-l border-border w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
              <p className="font-bold text-base sm:text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {userPosition.earnedPoints}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">MyPts</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {leaderboardData.map((entry, index) => (
          <div
            key={entry.profile?._id}
            className={`
              flex flex-wrap sm:flex-nowrap items-center p-2 sm:p-3 md:p-4 rounded-lg transition-all duration-200
              ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 shadow-sm' :
                index === 1 ? 'bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800' :
                  index === 2 ? 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50' :
                    'bg-muted hover:bg-muted/80'}
              hover:shadow-md gap-1 sm:gap-2
            `}
          >
            <div className="flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 mr-1 sm:mr-2 md:mr-4 flex-shrink-0">
              {getRankIcon(index + 1)}
            </div>

            <Avatar className={`h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mr-1 sm:mr-2 md:mr-4 ring-1 sm:ring-2 ring-offset-1 sm:ring-offset-2 ring-offset-background transition-all duration-200 flex-shrink-0
              ${index === 0 ? 'ring-yellow-500/50' :
                index === 1 ? 'ring-gray-400/50' :
                  index === 2 ? 'ring-amber-700/50' : 'ring-primary/20'}`}
            >
              <AvatarImage src={entry.profile?.profileImage} />
              <AvatarFallback>
                {entry.profile && (entry.profile.name || entry.profile.profileInformation?.username)
                  ? (entry.profile.name || entry.profile.profileInformation?.username)!.substring(0, 2).toUpperCase()
                  : 'N/A'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm sm:text-base">{entry.profile?.name || entry.profile?.profileInformation?.username}</p>
              <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                <Badge
                  variant={entry.successfulReferrals > 0 ? "default" : "outline"}
                  className={`text-[10px] sm:text-xs transition-colors duration-200 px-1.5 sm:px-2.5 py-0.5
                    ${entry.successfulReferrals > 0 ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
                >
                  {entry.successfulReferrals}/{entry.totalReferrals}
                </Badge>

                {entry.milestoneLevel > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 px-1.5 sm:px-2.5 py-0.5"
                  >
                    Level {entry.milestoneLevel}
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right pl-2 sm:pl-4 border-l border-border w-full sm:w-auto mt-1 sm:mt-0 flex-shrink-0">
              <p className="font-bold text-base sm:text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {entry.earnedPoints}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">MyPts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferralLeaderboard;
