import React, { useState, useMemo, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const MIN_CONTRIBUTIONS_FOR_LEADERBOARD = 1; // Minimum number of contributions

const Leaderboard = ({ leaderboard = [], userAddress, loading, hideTitle = false }) => {
  const { theme } = useContext(ThemeContext);
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  // Process and memoize leaderboard data
  const processedLeaderboard = useMemo(() => {
    if (!Array.isArray(leaderboard)) return [];
    return leaderboard
      .filter(
        (user) =>
          user &&
          user.userAddress &&
          user.userAddress !== "0x0000000000000000000000000000000000000000" &&
          Number(user.contributions) >= MIN_CONTRIBUTIONS_FOR_LEADERBOARD
      )
      .sort((a, b) => Number(b.contributions) - Number(a.contributions));
  }, [leaderboard]);

  // Loading skeleton UI
  if (loading) {
    return (
      <div
        className={`p-4 rounded-2xl border ${
          theme === "dark"
            ? "border-white/10 bg-black/30"
            : "border-black/5 bg-white/80"
        } backdrop-blur-sm shadow-md`}
      >
        {!hideTitle && (
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-1/3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg"></div>
          <div className="h-6 w-1/4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full"></div>
        </div>
        )}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 mb-4 animate-pulse"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded w-1/4"></div>
              <div className="h-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!processedLeaderboard.length) {
    return (
      <div
        className={`p-4 rounded-2xl border ${
          theme === "dark"
            ? "border-white/10 bg-black/30"
            : "border-black/5 bg-white/80"
        } backdrop-blur-sm shadow-md`}
      >
        {!hideTitle && <h2 className="text-xl font-bold mb-4">Leaderboard</h2>}
        <div
          className={`text-center py-8 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-lg mb-2">No one is on the leaderboard yet</p>
          <p className="text-sm opacity-75">
            Be the first leader! You can enter the list by making at least {MIN_CONTRIBUTIONS_FOR_LEADERBOARD} contribution{MIN_CONTRIBUTIONS_FOR_LEADERBOARD > 1 ? "s" : ""}.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(processedLeaderboard.length / itemsPerPage);
  const currentPageData = processedLeaderboard.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  const formatAddress = (address) => {
    if (!address) return "Unknown";
    if (address === userAddress) return "You";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    return new Date(Number(timestamp) * 1000).toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPositionEmoji = (position) => {
    if (position === 1) return "👑";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return position;
  };

  return (
    <div
      className={`p-4 rounded-2xl border ${
        theme === "dark"
          ? "border-white/10 bg-black/30"
          : "border-black/5 bg-white/80"
      } backdrop-blur-sm shadow-md`}
    >
      {!hideTitle && (
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
          Leaderboard
        </h2>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            theme === "dark"
              ? "bg-blue-500/10 text-blue-400"
              : "bg-blue-500/10 text-blue-600"
          }`}
        >
          Total: {processedLeaderboard.length} User
          {processedLeaderboard.length !== 1 ? "s" : ""}
        </div>
      </div>
      )}

      <div className="max-h-[50vh] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pr-1">
        {currentPageData.map((user, index) => {
          const position = page * itemsPerPage + index + 1;
          const isCurrentUser = user.userAddress === userAddress;

          return (
            <div
              key={user.userAddress}
              className={`relative group flex items-center p-3 rounded-xl border transition-all ${
                isCurrentUser
                  ? theme === "dark"
                    ? "bg-blue-500/10 border-blue-500/50 hover:bg-blue-500/20"
                    : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                  : theme === "dark"
                  ? "bg-black/20 border-white/5 hover:border-white/10"
                  : "bg-white/60 border-black/5 hover:border-black/10"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${
                  position <= 3
                    ? theme === "dark"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-yellow-100 text-yellow-700"
                    : theme === "dark"
                    ? "bg-gray-800/50 text-gray-400"
                    : "bg-gray-100 text-gray-600"
                } font-bold text-lg`}
              >
                {getPositionEmoji(position)}
              </div>

              <div className="ml-3 flex-grow min-w-0">
                <div
                  className={`font-medium truncate ${
                    isCurrentUser
                      ? "bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent"
                      : theme === "dark"
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {formatAddress(user.userAddress)}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {Number(user.contributions).toLocaleString()} contribution
                    {Number(user.contributions) !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs opacity-50 hidden sm:inline">•</span>
                  <span
                    className={`text-xs ${
                      theme === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {formatDate(user.lastUpdate)}
                  </span>
                </div>
              </div>

              <div
                className={`absolute inset-0 rounded-xl transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none ${
                  theme === "dark" ? "bg-blue-500/5" : "bg-blue-50/50"
                }`}
              />
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div
            className={`text-sm mb-2 sm:mb-0 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Page {page + 1} / {totalPages}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`px-4 py-2 rounded-xl border transition-all ${
                theme === "dark"
                  ? "bg-black/20 border-white/10 hover:bg-black/30 disabled:bg-black/10 disabled:border-white/5"
                  : "bg-white/60 border-black/5 hover:bg-white/80 disabled:bg-white/40 disabled:border-black/5"
              } disabled:cursor-not-allowed text-sm`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className={`px-4 py-2 rounded-xl border transition-all ${
                theme === "dark"
                  ? "bg-black/20 border-white/10 hover:bg-black/30 disabled:bg-black/10 disabled:border-white/5"
                  : "bg-white/60 border-black/5 hover:bg-white/80 disabled:bg-white/40 disabled:border-black/5"
              } disabled:cursor-not-allowed text-sm`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;