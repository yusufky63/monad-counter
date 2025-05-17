/**
 * SupportedChains.js - Supported blockchain networks configuration
 * This file contains the configuration for the Monad Testnet chain.
 */

const SupportedChains = {
  monad: {
    links: {
      website: "https://monad.xyz/",
      faucet: [
        "https://faucet.monad.xyz/",
        "https://zkcodex.com/onchain/faucet",
        "https://www.gas.zip/faucet/monad",
        "https://thirdweb.com/monad-testnet",
        "https://www.fau.gg/faucet",
        "https://faucet.quicknode.com/monad/testnet",
        "https://faucet.trade/monad-testnet-mon-faucet",
      ],
    },
    isFeeValue: 0.01,
    isRequireFees: true,
    isPopular: true,
    isSuperchain: false,
    isMainnet: false,
    enabled: true,
    features: {
      Deployer: true,
      Counter: true,
    },
    chainId: 10143,
    chainName: "Monad Testnet",
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: [
      "https://testnet-rpc.monad.xyz",
      "https://10143.rpc.thirdweb.com",
      "https://monad-testnet.g.alchemy.com/v2/6hAsuhqJZ4ecT3Ld2GAy8W0RUeFPFmyl",
      "https://monad-testnet.drpc.org",
    ],
    blockExplorerUrls: ["https://testnet.monadexplorer.com"],
    imageUrl:
      "https://raw.githubusercontent.com/zkcodex/zkCodex-Assets/refs/heads/main/Icons/monad.png",
    contracts: {
      Counter: "0xe205547f16E04cd4BC5928F0509aBECBB9f05D1a",
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