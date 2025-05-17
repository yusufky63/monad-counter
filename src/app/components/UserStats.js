import React from "react";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const StatCard = ({
  theme,
  icon,
  value,
  label,
  color = "text-blue-500",
  subValue,
}) => (
  <div
    className={`rounded-xl backdrop-blur-sm ${
      theme === "dark" ? "border-white/10" : "border-gray-200"
    } p-4 hover:border-blue-500/50 transition-all`}
  >
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${color.replace("text", "bg")}/10`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <div className={`text-sm sm:text-base font-bold ${color}`}>{value}</div>
        <div
          className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {label}
        </div>
        {subValue && (
          <div
            className={`text-xs mt-1 ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {subValue}
          </div>
        )}
      </div>
    </div>
  </div>
);

const UserStats = ({
  userStats,
  userRank,

  contributionTarget,
  rankDetails,
}) => {
  const { theme } = useContext(ThemeContext);

  if (!userStats) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return "No data";
    return new Date(timestamp * 1000).toLocaleString("en-US");
  };

  return (
    <div
      className={`p-4 rounded-xl border ${
        theme === "dark"
          ? "border-white/10 bg-black/30"
          : "border-black/5 bg-white/80"
      } backdrop-blur-sm shadow-md`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          theme={theme}
          icon="🎯"
          value={userStats.contributions}
          label="Total Contributions"
          color="text-blue-500"
          subValue={
            contributionTarget
              ? `Target: ${contributionTarget.target} (${contributionTarget.remaining} remaining)`
              : null
          }
        />

        <StatCard
          theme={theme}
          icon="🏆"
          value={`#${userRank}`}
          label="Current Rank"
          color="text-purple-500"
          subValue={
            rankDetails?.nextRankDiff > 0
              ? `${rankDetails.nextRankDiff} contributions to the next rank`
              : "Top rank!"
          }
        />

        <StatCard
          theme={theme}
          icon="⏰"
          value={formatDate(userStats.lastInteraction)}
          label="Last Update"
          color="text-green-500"
        />
      </div>
    </div>
  );
};

export default UserStats;
