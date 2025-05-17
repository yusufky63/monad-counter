import { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { getContractAddress } from "../utils/ContractAddresses";
import counterABI from "../contract/ABI";

// Cache süreleri (saniye cinsinden)
const CACHE_DURATION = {
  USER_STATS: 120, // 2 dakika
  LEADERBOARD: 600, // 10 dakika
  CONTRIBUTION: 300, // 5 dakika
};

const MIN_CONTRIBUTIONS_FOR_LEADERBOARD = 1;

const initialData = {
  userStats: null,
  leaderboard: [],
  userRank: null,
  lastUpdate: {
    userStats: 0,
    leaderboard: 0,
    contribution: 0,
  },
  contributionTarget: null,
  rankDetails: null,
};

// Sadece RPC provider kullanarak çalışan simplify edilmiş useCounter hook'u
export const useCounter = ({ chainId, address, isConnected }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(initialData);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [lastChainId, setLastChainId] = useState(chainId);
  
  // Sabit Monad Testnet RPC Provider (hiçbir browser wallet gerektirmez)
  const provider = useMemo(() => {
    try {
      return new ethers.providers.JsonRpcProvider(
        "https://testnet-rpc.monad.xyz"
      );
    } catch (error) {
      console.error("Failed to create RPC provider:", error);
      return null;
    }
  }, []);
  
  // Contract address memoization
  const contractAddress = useMemo(() => {
    if (!chainId) return null;
    try {
      const address = getContractAddress("Counter", chainId);
      return address;
    } catch (error) {
      console.error("Contract address error:", error?.message);
      return null;
    }
  }, [chainId]);
  
  // Create ethers contract instance
  const ethersContract = useMemo(() => {
    if (!provider || !contractAddress) return null;
    try {
      return new ethers.Contract(contractAddress, counterABI, provider);
    } catch (error) {
      console.error("Failed to create contract instance:", error?.message);
      return null;
    }
  }, [provider, contractAddress]);

  // Reset data when network changes
  useEffect(() => {
    if (chainId !== lastChainId) {
      setData(initialData);
      setError(null);
      setLoading(true);
      setShouldRefresh(true);
      setLastChainId(chainId);
    }
  }, [chainId, lastChainId]);

  // Check if data needs refresh
  const needsRefresh = useCallback(
    (lastUpdate, cacheDuration) => {
      if (chainId !== lastChainId) return true;
      const now = Math.floor(Date.now() / 1000);
      return now - lastUpdate >= cacheDuration;
    },
    [chainId, lastChainId]
  );

  // Fetch user stats from blockchain
  const fetchUserStats = useCallback(async () => {
    try {
      if (!address || !ethersContract) return null;
      
      setLoading(true);
      
      const userContribution = await ethersContract.userContributions(address);
      const userStats = {
        address,
        contribution: userContribution.toNumber(),
      };
      
      return userStats;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  }, [address, ethersContract]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      if (!ethersContract) return [];
      // Get leaderboard size
      const leaderboardSize = await ethersContract.leaderboardSize();
      if (leaderboardSize.eq(0)) return [];
      // Fetch top users
      const leaderboardData = await ethersContract.getTopUsers(leaderboardSize);
      // Format the data
      const formatted = leaderboardData.map((entry, index) => ({
        address: entry.user,
        contribution: entry.score.toNumber(),
        rank: index + 1,
        lastUpdate: entry.lastUpdate?.toNumber?.() ?? 0,
      }));
      // Sort by contribution (highest first)
      return formatted.sort((a, b) => b.contribution - a.contribution);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
  }, [ethersContract]);

  // Update user rank
  const updateUserRank = useCallback(
    (leaderboard, userStats) => {
      if (!userStats || !leaderboard.length) return null;

      // Find the user in the leaderboard
      const userInLeaderboard = leaderboard.find(
        (entry) => entry.address.toLowerCase() === address.toLowerCase()
      );

      // If user is in the leaderboard, use that rank
      if (userInLeaderboard) {
        return userInLeaderboard.rank;
      }

      // Otherwise calculate a virtual rank
      const userContribution = userStats.contribution;
      
      // If user has no contributions, they're unranked
      if (userContribution < MIN_CONTRIBUTIONS_FOR_LEADERBOARD) {
        return null;
      }

      // Find where user would be in the leaderboard
      let virtualRank = leaderboard.length + 1;
      for (let i = 0; i < leaderboard.length; i++) {
        if (userContribution > leaderboard[i].contribution) {
          virtualRank = i + 1;
          break;
        }
      }

      return virtualRank;
    },
    [address]
  );

  // Get contribution needed for next rank
  const getContributionTarget = useCallback(
    (leaderboard, userStats, userRank) => {
      if (!userStats || !leaderboard.length || !userRank) return null;

      // If user is already #1, no target needed
      if (userRank === 1) return null;

      const userContribution = userStats.contribution;
      let targetContribution = null;

      // Find the person ahead of the user
      if (userRank <= leaderboard.length) {
        // User is in the leaderboard - find person at rank above
        const targetRank = userRank - 1;
        const targetPerson = leaderboard.find((e) => e.rank === targetRank);
        if (targetPerson) {
          targetContribution = targetPerson.contribution;
        }
      } else if (leaderboard.length > 0) {
        // User is outside leaderboard - target the last person
        targetContribution = leaderboard[leaderboard.length - 1].contribution;
      }

      if (targetContribution !== null) {
        const needed = Math.max(1, targetContribution - userContribution + 1);
        return {
          current: userContribution,
          target: targetContribution,
          needed: needed,
        };
      }

      return null;
    },
    []
  );

  // Get detailed rank info
  const getRankDetails = useCallback(
    (leaderboard, userRank, userStats) => {
      if (!leaderboard.length || !userStats) return null;

      const totalParticipants =
        leaderboard.length +
        (userRank > leaderboard.length && userStats.contribution >= MIN_CONTRIBUTIONS_FOR_LEADERBOARD
          ? 1
          : 0);

      return {
        rank: userRank || "Unranked",
        totalParticipants,
        percentile:
          userRank && totalParticipants
            ? Math.floor((userRank / totalParticipants) * 100)
            : null,
      };
    },
    []
  );

  // Main data refresh function
  const refreshData = useCallback(async () => {
    if (!provider || !contractAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const now = Math.floor(Date.now() / 1000);
      const updates = { ...data.lastUpdate };
      let updatedData = { ...data };

      // Refresh user stats if needed
      if (
        needsRefresh(data.lastUpdate.userStats, CACHE_DURATION.USER_STATS) &&
        address &&
        isConnected
      ) {
        const userStats = await fetchUserStats();
        updatedData.userStats = userStats;
        updates.userStats = now;
      }

      // Refresh leaderboard if needed
      if (needsRefresh(data.lastUpdate.leaderboard, CACHE_DURATION.LEADERBOARD)) {
        const leaderboard = await fetchLeaderboard();
        updatedData.leaderboard = leaderboard;
        updates.leaderboard = now;
      }

      // Update derived data if we have all needed info
      if (updatedData.userStats && updatedData.leaderboard.length && address && isConnected) {
        // Update user rank
        const userRank = updateUserRank(updatedData.leaderboard, updatedData.userStats);
        updatedData.userRank = userRank;

        // Get contribution target
        if (
          needsRefresh(
            data.lastUpdate.contribution,
            CACHE_DURATION.CONTRIBUTION
          ) ||
          !data.contributionTarget
        ) {
          const contributionTarget = getContributionTarget(
            updatedData.leaderboard,
            updatedData.userStats,
            userRank
          );
          updatedData.contributionTarget = contributionTarget;
          updates.contribution = now;
        }

        // Get rank details
        const rankDetails = getRankDetails(
          updatedData.leaderboard,
          userRank,
          updatedData.userStats
        );
        updatedData.rankDetails = rankDetails;
      }

      // Update data with new values and timestamps
      updatedData.lastUpdate = updates;
      setData(updatedData);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [
    provider,
    contractAddress,
    data,
    address,
    isConnected,
    needsRefresh,
    fetchUserStats,
    fetchLeaderboard,
    updateUserRank,
    getContributionTarget,
    getRankDetails,
  ]);

  // Process auto-refresh requests
  useEffect(() => {
    if (shouldRefresh) {
      refreshData();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, refreshData]);

  // Initial data load and network change handler
  useEffect(() => {
    if (isConnected && provider && contractAddress) {
      setShouldRefresh(true);
    }
  }, [isConnected, provider, contractAddress, chainId]);

  return useMemo(
    () => ({
      userStats: data.userStats,
      leaderboard: data.leaderboard,
      userRank: data.userRank,
      contributionTarget: data.contributionTarget,
      rankDetails: data.rankDetails,
      loading,
      error,
      refreshData,
    }),
    [
      data.userStats,
      data.leaderboard,
      data.userRank,
      data.contributionTarget,
      data.rankDetails,
      loading,
      error,
      refreshData,
    ]
  );
};

export default useCounter;
