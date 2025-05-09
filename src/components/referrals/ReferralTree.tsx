import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReferralService, { ReferralTreeNode } from '@/services/referralService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Helper function to format profile name
const formatProfileName = (profile: any) => {
  if (!profile) return '';

  // Extract profile type for display
  const profileType = profile.profileType
    ? profile.profileType.charAt(0).toUpperCase() + profile.profileType.slice(1)
    : profile.type?.subtype
      ? profile.type.subtype.charAt(0).toUpperCase() + profile.type.subtype.slice(1)
      : '';

  // Get the base name (either username or name)
  let baseName = profile.name;

  // If the name already includes the profile type and "Profile", return it as is
  if (baseName && baseName.includes(profileType) && baseName.includes('Profile')) {
    return baseName;
  }

  // Extract just the name part (without profile type and "Profile")
  if (baseName) {
    // Remove any existing "Profile" suffix
    baseName = baseName.replace(/\s+Profile$/i, '');

    // Remove any existing profile type
    baseName = baseName.replace(new RegExp(`\\s+${profileType}\\s*`, 'i'), ' ');

    // Trim any extra spaces
    baseName = baseName.trim();

    // Capitalize the first letter
    if (baseName.length > 0) {
      baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
  }

  // Format the name as "Name ProfileType Profile"
  return `${baseName} ${profileType} `;
};

interface TreeNodeProps {
  node: ReferralTreeNode;
  level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`ml-1 sm:ml-3 md:ml-6 transition-all duration-200 ease-in-out ${level === 0 ? 'ml-0' : ''}`}>
      <div
        className={`
          flex flex-wrap sm:flex-nowrap items-center p-2 sm:p-3 md:p-4 rounded-lg
          hover:bg-muted/80 active:bg-muted/90 cursor-pointer
          transition-all duration-300 ease-out
          ${level === 0 ? 'bg-gradient-to-r from-primary/5 via-background to-background shadow-sm' : 'hover:shadow-sm'}
          ${isExpanded ? 'bg-muted/50 ring-1 ring-primary/10' : ''}
          group
        `}
        onClick={toggleExpand}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className={`
              p-0 h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 md:mr-3
              transition-transform duration-200
              group-hover:bg-primary/10
              ${isExpanded ? 'rotate-90' : ''}
            `}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        ) : (
          <div className="w-5 sm:w-6 mr-1 sm:mr-2 md:mr-3" />
        )}

        <Avatar
          className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mr-1 sm:mr-2 md:mr-3 transition-transform duration-200 group-hover:scale-105 ring-1 ring-blue-100"
          style={{ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)" }}
        >
          <AvatarImage src={node.profileImage} />
          <AvatarFallback className='font-extrabold' style={{ background: "black", color: "white" }}>
            {(node.name || node.profileInformation?.username || 'N/A').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-xs sm:text-sm truncate"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            {(node.name || node.profileInformation?.username || 'N/A').split(' ').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')}
            {level === 0 && <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-muted-foreground">(You)</span>}
          </p>
          <div className="flex items-center space-x-1 sm:space-x-2 mb-0.5 sm:mb-1">
            <span
              className="inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                fontSize: '0.6rem'
              }}
            >
              {node.profileType
                ? node.profileType.charAt(0).toUpperCase() + node.profileType.slice(1)
                : node.type?.subtype
                  ? node.type.subtype.charAt(0).toUpperCase() + node.type.subtype.slice(1)
                  : node.profileInformation?.profileType
                    ? node.profileInformation.profileType.charAt(0).toUpperCase() + node.profileInformation.profileType.slice(1)
                    : 'Personal'}
            </span>
          </div>
          <p
            className="text-[10px] sm:text-xs text-muted-foreground"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
              fontWeight: 400,
              letterSpacing: '-0.01em'
            }}
          >
            {node.successfulReferrals} successful of {node.totalReferrals} total referrals
          </p>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-0 w-full sm:w-auto justify-end">
          <Badge
            variant={node.successfulReferrals > 0 ? "default" : "outline"}
            className={`text-[10px] sm:text-xs transition-colors duration-200 rounded-full px-1.5 sm:px-2.5 py-0.5
              ${node.successfulReferrals > 0 ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100' : ''}`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
              fontWeight: 500,
              letterSpacing: '-0.01em'
            }}
          >
            {node.successfulReferrals}/{node.totalReferrals}
          </Badge>

          {node.milestoneLevel > 0 && (
            <Badge
              variant="secondary"
              className={`text-[10px] sm:text-xs rounded-full px-1.5 sm:px-2.5 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors duration-200`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                fontWeight: 500,
                letterSpacing: '-0.01em'
              }}
            >
              Level {node.milestoneLevel}
            </Badge>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            border-l-2 border-primary/10 pl-1 sm:pl-2 md:pl-4 mt-1 sm:mt-2 space-y-1 sm:space-y-2
            animate-in slide-in-from-top-2
          `}
          style={{
            borderImage: 'linear-gradient(to bottom, rgb(var(--primary) / 0.2), transparent) 1',
            borderImageSlice: '1'
          }}
        >
          {node.children.map((child) => (
            <TreeNode key={child.profileId} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReferralTree: React.FC = () => {
  const {
    data: treeData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['referralTree'],
    queryFn: () => ReferralService.getReferralTree(3), // Get 3 levels deep
  });

  if (isLoading) {
    return (
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        <Skeleton className="h-10 sm:h-12 w-full" />
        <Skeleton className="h-10 sm:h-12 w-full ml-2 sm:ml-4" />
        <Skeleton className="h-10 sm:h-12 w-full ml-4 sm:ml-8" />
        <Skeleton className="h-10 sm:h-12 w-full ml-4 sm:ml-8" />
        <Skeleton className="h-10 sm:h-12 w-full ml-2 sm:ml-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 sm:py-6 md:py-8">
        <p className="text-red-500 mb-2 sm:mb-4 text-sm sm:text-base">Failed to load referral tree</p>
        <Button variant="outline" size="sm" className="h-8 sm:h-10" onClick={() => refetch()}>
          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Try Again
        </Button>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="text-center py-4 sm:py-6 md:py-8">
        <p className="text-muted-foreground text-sm sm:text-base">No referral data available</p>
      </div>
    );
  }

  return (
    <div className="referral-tree">
      <div className="flex justify-end mb-2 sm:mb-3 md:mb-4">
        <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Refresh
        </Button>
      </div>

      <div className="bg-gradient-to-br from-card via-card to-primary/5 border rounded-lg p-2 sm:p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 overflow-x-auto">
        <div className="min-w-[280px] w-full">
          <TreeNode node={treeData} level={0} />
        </div>
      </div>

      <div className="mt-3 sm:mt-4 md:mt-6 text-xs sm:text-sm text-muted-foreground bg-primary/5 p-2 sm:p-3 md:p-4 rounded-lg border border-primary/10">
        <p className="flex flex-wrap items-center">
          <span className="font-medium mr-1 sm:mr-2">Note:</span>
          <span>Only profiles that have reached the 1000+ MyPts threshold are shown in the tree.
            Expand nodes to view more referrals in your network.</span>
        </p>
      </div>
    </div>
  );
};

export default ReferralTree;
