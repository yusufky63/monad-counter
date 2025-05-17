import React from "react";
import Leaderboard from "./Leaderboard";
import { FiX } from "react-icons/fi";

const LeaderboardModal = ({
  theme,
  onClose,
  leaderboard,
  address,
  loading,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 flex items-start md:items-center justify-center p-2 md:p-3">
        {/* Backdrop */}
        <div className={`absolute inset-0 ${theme === "dark" ? "bg-black/50" : "bg-black/20"} backdrop-blur-sm`} onClick={onClose} />

        {/* Modal */}
        <div
          className={`relative w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col ${
            theme === "dark"
              ? "bg-black/90 border-white/10"
              : "bg-white border-gray-200"
          } rounded-2xl border mt-4 md:mt-0 shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`p-2 border-b ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-medium tracking-tight ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>
                <span className="bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                  Leaderboard
                </span>
              </h3>
              <button
                onClick={onClose}
                className={`p-1 rounded-full transition-colors ${
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-100"
                }`}
              >
                <FiX className="text-red-500" />
              </button>
            </div>
          </div>

          {/* Content - Pass hideTitle prop to Leaderboard */}
          <div className="flex-1 overflow-y-auto p-2">
            <Leaderboard
              theme={theme}
              isLoading={loading}
              leaderboard={leaderboard}
              userAddress={address}
              hideTitle={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal; 