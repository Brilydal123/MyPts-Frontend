import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReferralService, { ReferralTreeNode, ReferralStats } from '@/services/referralService';

export function useReferralData() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [treeData, setTreeData] = useState<ReferralTreeNode | null>(null);

  const {
    data: referralStats,
    isLoading: isReferralLoading,
    error: referralError,
    refetch
  } = useQuery({
    queryKey: ['referralStats'],
    queryFn: () => ReferralService.getReferralStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const {
    data: treeStats,
    isLoading: isTreeLoading,
    error: treeError
  } = useQuery<ReferralTreeNode>({
    queryKey: ['referralTree'],
    queryFn: () => ReferralService.getReferralTree(3), // Get 3 levels deep
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (referralStats) {
      setReferralCode(referralStats.referralCode || '');
      setReferralCount(referralStats.totalReferrals || 0);
      setIsLoading(false);
    }
  }, [referralStats]);

  useEffect(() => {
    if (treeStats) {
      setTreeData(treeStats);
    }
  }, [treeStats]);

  useEffect(() => {
    if (referralError || treeError) {
      setError((referralError || treeError) as Error);
      setIsLoading(false);
    }
  }, [referralError, treeError]);

  return {
    referralCode,
    referralCount,
    isLoading,
    isTreeLoading,
    error,
    refetch,
    referralStats,
    treeData
  };
}

export default useReferralData;
