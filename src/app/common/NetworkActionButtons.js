import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "react-hot-toast";
import { Send, Loader2, Clock, Wallet } from "lucide-react";

/**
 * NetworkActionButtons - A reusable component that provides GM and Contract Deployer functionality
 * for a specific network with a single click.
 * 
 * @param {Object} props
 * @param {Object} props.network - The network object from SupportedChains
 * @param {Function} props.onGMSuccess - Callback function when GM is sent successfully
 * @param {Function} props.onDeploySuccess - Callback function when contract is deployed successfully
 * @param {Function} props.onShare - Callback function to share the network
 * @param {string} props.theme - Theme ('dark' or 'light')
 * @param {boolean} props.showShareButton - Whether to show the share button
 * @param {boolean} props.showGMButton - Whether to show the GM button
 * @param {boolean} props.showDeployButton - Whether to show the deploy button
 * @param {Function} props.handleSendGM - Function to handle sending GM
 * @param {Function} props.handleDeploy - Function to handle contract deployment
 * @param {string} props.customButtonClass - Custom class for the GM button
 * @param {string} props.customDeployButtonClass - Custom class for the deploy button
 * @param {boolean} props.canSendGM - Whether the GM can be sent
 * @param {Object} props.timer - Timer object
 */
export default function NetworkActionButtons({
  network,
  onGMSuccess,
  onDeploySuccess,
  onShare,
  theme,
  showShareButton = true,
  showGMButton = true,
  showDeployButton = true,
  handleSendGM,
  handleDeploy,
  customDeployButtonClass,
  canSendGM = true,
  timer,
}) {
  const { isConnected } = useWallet();
  const { openConnectModal } = useConnectModal();
  const [loading, setLoading] = useState(false);

  const isDeployerSupported = network?.features?.Deployer;

  const handleGMClick = async () => {
    try {
      setLoading(true);
      
      // Önce işlemi mevcut ağda gerçekleştirebilecek miyiz kontrol et
      if (!canSendGM && timer) {
        const timeString = `${String(timer.hours).padStart(2, "0")}:${String(timer.minutes).padStart(2, "0")}:${String(timer.seconds).padStart(2, "0")}`;
        toast.error(`Please wait ${timeString} before sending another GM`, {
          style: {
            background: theme === "dark" ? "#1e293b" : "#fff",
            color: theme === "dark" ? "#ef4444" : "#dc2626",
          },
        });
        setLoading(false);
        return;
      }
      
      // Cüzdan bağlı değilse bağlanmayı iste
      if (!isConnected) {
        if (openConnectModal) {
          openConnectModal();
        }
        setLoading(false);
        return;
      }
      
      // İşlem yapmaya çalış
      const response = await handleSendGM(network);
      console.log("GM transaction response:", response);

      // Başarı durumu
      if (response && response.success) {
        // Başarı durumunda başarı mesajı göster
        toast.success(`GM sent successfully!`, {
          style: {
            background: theme === "dark" ? "#1e293b" : "#fff",
            color: theme === "dark" ? "#10b981" : "#059669",
          },
        });
        
        if (onGMSuccess) {
          onGMSuccess(network, response);
        }
      } 
      // İşlem cooldown durumunda
      else if (response && response.status === 'cooldown') {
        // Cooldown mesajı zaten UI'da gösteriliyor
        return;
      }
      // İşlem kullanıcı tarafından reddedildi
      else if (response && response.message && response.message.includes("rejected")) {
        toast.error("Transaction rejected", {
          style: {
            background: theme === "dark" ? "#1e293b" : "#fff",
            color: theme === "dark" ? "#ef4444" : "#dc2626",
          },
        });
      }
      // Diğer hata durumları
      else if (response && response.status === 'error') {
        toast.error(response.message || "Failed to send GM", {
          style: {
            background: theme === "dark" ? "#1e293b" : "#fff",
            color: theme === "dark" ? "#ef4444" : "#dc2626",
          },
        });
      }
    } catch (error) {
      console.error("Error in handleGMClick:", error);
      // Hata mesajı göster (ama kullanıcı reddetme hatası için gösterme)
      if (!error.message.includes("rejected")) {
        toast.error(error.message || "Failed to send GM", {
          style: {
            background: theme === "dark" ? "#1e293b" : "#fff",
            color: theme === "dark" ? "#ef4444" : "#dc2626",
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeployClick = async (e) => {
    e.stopPropagation();
    
    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    if (!isDeployerSupported) {
      toast.error("Contract deployment is not supported on this network", {
        style: {
          background: theme === "dark" ? "#1e293b" : "#fff",
          color: theme === "dark" ? "#ef4444" : "#dc2626",
        },
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if network and chainId exist
      if (!network || network.chainId === undefined) {
        toast.error("Invalid network configuration", {
          style: {
            background: theme === "dark" ? "#1e293b" : "#fff",
            color: theme === "dark" ? "#ef4444" : "#dc2626",
          },
        });
        setLoading(false);
        return;
      }
      
      // Switch to the network first
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
      } catch (error) {
        // If network is not added (error code 4902), add it
        if (error.code === 4902) {
          // Check if we have the necessary network information
          if (!network.chainName || !network.nativeCurrency || !network.rpcUrls) {
            toast.error("Incomplete network information. Cannot add network to wallet.", {
              style: {
                background: theme === "dark" ? "#1e293b" : "#fff",
                color: theme === "dark" ? "#ef4444" : "#dc2626",
              },
            });
            setLoading(false);
            return;
          }
          
          const userResponse = await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.chainName,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: network.rpcUrls,
                blockExplorerUrls: network.blockExplorerUrls
              }
            ],
          });
          
          // If user rejected adding the network, stop
          if (!userResponse) {
            setLoading(false);
            return;
          }
        } else {
          throw error;
        }
      }

      // Call the provided handleDeploy function or use default behavior
      if (handleDeploy) {
        try {
          const contractAddress = await handleDeploy(network);
          console.log("Contract deployed at:", contractAddress);
          
          // Show success message with contract address
          toast.success(`Contract deployed on ${network.chainName || network.chainId}! Address: ${contractAddress.substring(0, 10)}...`, {
            style: {
              background: theme === "dark" ? "#1e293b" : "#fff",
              color: theme === "dark" ? "#fff" : "#000",
            },
          });
        } catch (error) {
          console.error("Error in handleDeploy:", error);
          toast.error(`Failed to deploy contract: ${error.message}`, {
            style: {
              background: theme === "dark" ? "#1e293b" : "#fff",
              color: theme === "dark" ? "#ef4444" : "#dc2626",
            },
          });
          setLoading(false);
          return;
        }
      } else {
        // Default behavior - just show a success message
        toast.success(`Contract deployment initiated on ${network.chainName || network.chainId}!`, {
          style: {
            background: theme === "dark" ? "#1e293b" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
          },
        });
      }

      // Call the success callback if provided
      if (onDeploySuccess) {
        onDeploySuccess(network);
      }
    } catch (error) {
      console.error("Error deploying contract:", error);
      toast.error("Failed to deploy contract", {
        style: {
          background: theme === "dark" ? "#1e293b" : "#fff",
          color: theme === "dark" ? "#ef4444" : "#dc2626",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(network);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showGMButton && (
        <button
          onClick={handleGMClick}
          disabled={loading || (!canSendGM && isConnected)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            loading
              ? theme === "dark"
                ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              : !canSendGM && isConnected
              ? theme === "dark"
                ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              : !isConnected
              ? theme === "dark"
                ? "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              : theme === "dark"
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-amber-100 text-amber-600 hover:bg-amber-200"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : !canSendGM && isConnected ? (
            <>
              <Clock size={14} />
              <span>
                {String(timer.hours).padStart(2, "0")}:
                {String(timer.minutes).padStart(2, "0")}:
                {String(timer.seconds).padStart(2, "0")}
              </span>
            </>
          ) : !isConnected ? (
            <>
              <Wallet size={14} />
              <span>Connect Wallet</span>
            </>
          ) : (
            <>
              <Send size={14} />
              <span>Send GM</span>
            </>
          )}
        </button>
      )}

      {showDeployButton && isDeployerSupported && (
        <button
          onClick={handleDeployClick}
          disabled={loading}
          className={customDeployButtonClass || `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            loading
              ? theme === "dark"
                ? "bg-gray-800/50 text-gray-400 cursor-not-allowed"
                : "bg-gray-100/50 text-gray-400 cursor-not-allowed"
              : !isConnected
              ? theme === "dark"
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : theme === "dark"
              ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {loading ? "Deploying..." : !isConnected ? "Connect Wallet" : "Deploy Contract"}
        </button>
      )}

      {showShareButton && (
        <button
          onClick={handleShareClick}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === "dark"
              ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Share
        </button>
      )}
    </div>
  );
}