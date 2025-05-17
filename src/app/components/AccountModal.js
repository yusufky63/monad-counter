import React from "react";
import { LogOut, Copy, ExternalLink, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const AccountModal = ({
  isOpen,
  onClose,
  theme,
  account,
  balance,
  disconnect,
  selectedNetwork,
  supportedChains,
  lastTransaction,
  isConnected,
}) => {
  if (!isOpen) return null;

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return "0";
    return parseFloat(balance).toFixed(4);
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success("Address copied to clipboard", {
        style: {
          background: theme === "dark" ? "#1e1e1e" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
          border:
            theme === "dark"
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(0,0,0,0.1)",
        },
        duration: 2000,
      });
    }
  };

  const handleViewOnExplorer = () => {
    if (
      account &&
      selectedNetwork &&
      supportedChains[selectedNetwork]?.blockExplorerUrls?.[0]
    ) {
      const explorerUrl = `${supportedChains[selectedNetwork].blockExplorerUrls[0]}/address/${account}`;
      window.open(explorerUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-black/20" : "bg-gray-200/30"
        } backdrop-blur-sm`}
        onClick={onClose}
      />

      <div
        className={`relative mt-16 w-full max-w-sm rounded-2xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-900 border border-gray-800"
            : "bg-white border border-gray-200"
        }`}
      >
        {isConnected ? (
          <>
            {/* Account Info */}
            <div
              className={`p-4 border-b ${
                theme === "dark" ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="text-center">
                  <h3
                    className={`text-lg font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {formatAddress(account)}
                  </h3>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {formatBalance(balance)}{" "}
                    {supportedChains[selectedNetwork]?.nativeCurrency?.symbol ||
                      "ETH"}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2 space-y-1">
              <button
                onClick={handleCopyAddress}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Copy size={20} />
                <span>Copy Address</span>
              </button>

              <button
                onClick={handleViewOnExplorer}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <ExternalLink size={20} />
                <span>View on Explorer</span>
              </button>

              {lastTransaction && (
                <button
                  onClick={() => {
                    if (
                      selectedNetwork &&
                      supportedChains[selectedNetwork]?.blockExplorerUrls?.[0]
                    ) {
                      const explorerUrl = `${supportedChains[selectedNetwork].blockExplorerUrls[0]}/tx/${lastTransaction}`;
                      window.open(explorerUrl, "_blank");
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    theme === "dark"
                      ? "hover:bg-gray-800 text-gray-300"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>View Last Transaction</span>
                </button>
              )}

              <button
                onClick={handleDisconnect}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  theme === "dark"
                    ? "hover:bg-red-900/20 text-red-400"
                    : "hover:bg-red-50 text-red-600"
                }`}
              >
                <LogOut size={20} />
                <span>Disconnect</span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-4">
            <ConnectButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountModal;
