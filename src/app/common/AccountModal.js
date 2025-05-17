import React, { useState } from "react";
import { X, Copy, CheckCircle } from "lucide-react";
import SupportedChains from "../config/chains";
import Image from "next/image";

/**
 * Standard Account Modal
 * Displays user account information and transactions
 */
const AccountModal = ({ isOpen, onClose, theme }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-900"
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${
            theme === "dark"
              ? "hover:bg-gray-800"
              : "hover:bg-gray-100"
          }`}
        >
          <X size={20} />
        </button>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Account</h2>
            <div
              className={`px-3 py-1 rounded-full text-sm ${
              theme === "dark"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-green-100 text-green-600"
            }`}
          >
              Connected
            </div>
        </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-2">Address</div>
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                    theme === "dark"
                    ? "bg-gray-800"
                    : "bg-gray-50"
                  }`}
                >
                <span className="font-mono text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-lg ${
                    theme === "dark"
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-200"
                        }`}
                      >
                  {copied ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                      </button>
                    </div>
                  </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Network</div>
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  theme === "dark"
                    ? "bg-gray-800"
                    : "bg-gray-50"
                    }`}
                  >
                <div className="flex items-center space-x-2">
                  <Image
                    src="/monad-logo.png"
                    alt="Monad"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span>Monad</span>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs ${
                    theme === "dark"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-green-100 text-green-600"
                    }`}
                  >
                  {chainId === SupportedChains.monad?.chainId
                    ? "Connected"
                    : "Wrong Network"}
                  </div>
              </div>
            </div>
              </div>

          <div className="pt-4">
                <button
              onClick={handleDisconnect}
              className={`w-full py-3 rounded-lg font-medium ${
                    theme === "dark"
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
                  }`}
                >
              Disconnect Wallet
                </button>
              </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal; 