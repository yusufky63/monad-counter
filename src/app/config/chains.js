/**
 * SupportedChains.js - Supported blockchain networks configuration
 * This file contains the configuration for the Monad chain.
 */

const SupportedChains = {
  monad: {
    links: {
      website: "https://monad.xyz/",
    },
    isFeeValue: 5,
    isRequireFees: true,
    isPopular: true,
    isSuperchain: false,
    isMainnet: true,
    enabled: true,
    features: {
      Counter: true,
    },
    chainId: 143,
    chainName: "Monad Mainnet",
    nativeCurrency: {
      name: "MON",
      symbol: "MON",
      decimals: 18,
      coingeckoId: "monad",
    },
    rpcUrls: ["https://rpc.monad.xyz"],
    blockExplorerUrls: ["https://monadvision.com"],
    imageUrl:
      "https://raw.githubusercontent.com/zkcodex/zkCodex-Assets/refs/heads/main/Icons/monad.png",
    contracts: {
      Counter: "0xe72463F43F8530746f49537092724FA6e23DeEbB",
    },
  },
};

export default SupportedChains;

/**
 * Get chains that support a specific feature
 * @param {string} feature - Feature name to check for
 * @returns {string[]} Array of chain keys supporting the feature
 */
export const getSupportedChainsForFeature = (feature) => {
  return Object.entries(SupportedChains)
    .filter(([, chain]) => chain.enabled && chain.features[feature])
    .map(([key]) => key);
};

/**
 * Check if a feature is supported on a specific chain
 * @param {number} chainId - Chain ID to check
 * @param {string} feature - Feature name to check for
 * @returns {boolean} True if feature is supported
 */
export const isFeatureSupported = (chainId, feature) => {
  const chain = Object.values(SupportedChains).find(
    (chain) => chain.chainId === chainId
  );
  return (chain?.enabled && chain?.features[feature]) || false;
};

/**
 * Get the default chain
 * @returns {Object} Default chain configuration
 */
export const getDefaultChain = () => {
  return SupportedChains.monad;
};

/**
 * Check if a chain is enabled
 * @param {number} chainId - Chain ID to check
 * @returns {boolean} True if chain is enabled
 */
export const isSupportedChain = (chainId) => {
  const chain = Object.values(SupportedChains).find(
    (chain) => chain.chainId === chainId
  );
  return chain?.enabled || false;
};
