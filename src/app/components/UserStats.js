import React from "react";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const StatCard = ({
  theme,
  value,
  label,
  color = "text-blue-500",
}) => (
  <div
    className={`rounded-xl backdrop-blur-sm ${
      theme === "dark" ? "border-white/10" : "border-gray-200"
    } p-4 hover:border-blue-500/50 transition-all`}
  >
    <div className="flex items-center space-x-4">
      <div>
        <div className={`text-sm font-bold ${color}`}>{value}</div>
        <div
          className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {label}
        </div>
      
      </div>
    </div>
  </div>
);

const UserStats = ({
  userStats,

}) => {
  const { theme } = useContext(ThemeContext);

  if (!userStats) {
    return null;
  }

  return (
    <div
      className={`my-1 rounded-xl border  w-full ${
        theme === "dark"
          ? "border-white/10 bg-black/30"
          : "border-black/5 bg-white/80"
      } backdrop-blur-sm shadow-md`}
    >
      <div className="flex items-center justify-between">
      
        <StatCard
          theme={theme}
          icon="🎯"
          value={userStats.contribution}
          label=" Contributions"
          color="text-blue-500"
        
        />
      </div>
    </div>
  );
};

export default UserStats;
