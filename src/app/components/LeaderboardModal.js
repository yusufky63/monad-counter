import React from "react";
import Leaderboard from "./Leaderboard";
import { FiX } from "react-icons/fi";
import UserStats from "./UserStats";

const LeaderboardModal = ({
  theme,
  onClose,
  leaderboard,
  address,
  loading,
  userStats,
  userRank,
  rankDetails,
  contributionTarget,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="relative w-full max-w-md h-auto max-h-[80vh] flex flex-col bg-zinc-900 border-zinc-800 rounded-2xl border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-purple-400">
                Leaderboard
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full transition-colors hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            <UserStats
              userStats={userStats}
              userRank={userRank}
              contributionTarget={contributionTarget}
              rankDetails={rankDetails}
            />

            <Leaderboard
              theme={theme}
              loading={loading}
              leaderboard={leaderboard}
              userAddress={address}
              userStats={userStats}
              userRank={userRank}
              hideTitle={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
