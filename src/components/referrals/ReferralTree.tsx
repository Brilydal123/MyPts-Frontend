import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReferralService, { ReferralTreeNode } from '@/services/referralService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
    <div className={`ml-2 sm:ml-6 transition-all duration-200 ease-in-out ${level === 0 ? 'ml-0' : ''}`}>
      <div
        className={`
          flex flex-wrap sm:flex-nowrap items-center p-3 sm:p-4 rounded-lg
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
              p-0 h-6 w-6 mr-2 sm:mr-3
              transition-transform duration-200
              group-hover:bg-primary/10
              ${isExpanded ? 'rotate-90' : ''}
            `}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-6 mr-2 sm:mr-3" />
        )}

        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={node.profileImage} />
          <AvatarFallback>{node.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {node.name}
            {level === 0 && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {node.successfulReferrals} successful of {node.totalReferrals} total referrals
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
          <Badge
            variant={node.successfulReferrals > 0 ? "default" : "outline"}
            className={`text-xs transition-colors duration-200
              ${node.successfulReferrals > 0 ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
          >
            {node.successfulReferrals}/{node.totalReferrals}
          </Badge>

          {node.milestoneLevel > 0 && (
            <Badge
              variant="secondary"
              className={`text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200`}
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
            border-l-2 border-primary/10 pl-2 sm:pl-4 mt-2 space-y-2
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
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full ml-4" />
        <Skeleton className="h-12 w-full ml-8" />
        <Skeleton className="h-12 w-full ml-8" />
        <Skeleton className="h-12 w-full ml-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load referral tree</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No referral data available</p>
      </div>
    );
  }

  return (
    <div className="referral-tree">
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="bg-gradient-to-br from-card via-card to-primary/5 border rounded-lg p-3 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 overflow-x-auto">
        <div className="min-w-[300px]">
          <TreeNode node={treeData} level={0} />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 text-sm text-muted-foreground bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/10">
        <p className="flex flex-wrap items-center">
          <span className="font-medium mr-2">Note:</span>
          <span>Only profiles that have reached the 1000+ MyPts threshold are shown in the tree.
            Expand nodes to view more referrals in your network.</span>
        </p>
      </div>
    </div>
  );
};

export default ReferralTree;
