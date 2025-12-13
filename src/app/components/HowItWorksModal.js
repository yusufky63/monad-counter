import SupportedChains from "../config/chains";

// Wei formatı için basit yardımcı fonksiyon
function formatFee(wei) {
  if (!wei) return "0.00002";

  // Wei değerini string olarak al
  const weiStr = wei.toString();

  // Yeterince uzunsa, sondan 18 karakter eth birimine çevrilir
  if (weiStr.length <= 18) {
    // Wei değeri 1 ETH'den küçük
    const padded = weiStr.padStart(18, "0");
    const ethValue = "0." + padded;
    return parseFloat(ethValue).toFixed(5);
  } else {
    // Wei değeri 1 ETH'den büyük veya eşit
    const ethPart = weiStr.slice(0, weiStr.length - 18);
    const weiPart = weiStr.slice(weiStr.length - 18);
    const ethValue = ethPart + "." + weiPart;
    return parseFloat(ethValue).toFixed(5);
  }
}

const HowItWorksModal = ({ onClose, fee }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 flex items-center justify-center p-3">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="relative bg-zinc-900 border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-purple-400">
                  How it Works
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full transition-colors hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[70vh] overflow-y-auto bg-zinc-900/50">
            <div className="space-y-3">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-purple-400">
                  📝 How to Play
                </h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      Press the counter to increment the global counter
                    </span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      Each increment costs {formatFee(fee)}{" "}
                      {SupportedChains.monad.nativeCurrency.symbol}
                    </span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      The more you increment, the higher your rank on the
                      leaderboard
                    </span>
                  </li>
                </ul>
              </div>

              {/* Leaderboard System */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-purple-400">
                  🏆 Leaderboard
                </h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>Top players are shown on the leaderboard</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>Your rank is based on total contributions</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      Compete with other Farcaster users for the top position
                    </span>
                  </li>
                </ul>
              </div>

              {/* Farcaster Integration */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-purple-400">
                  🔗 Farcaster Integration
                </h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      This app is optimized for use within Farcaster clients
                    </span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      Your Farcaster account is used for the leaderboard
                    </span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>Uses Farcaster Frame SDK for native integration</span>
                  </li>
                </ul>
              </div>

              {/* Technical Details */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-purple-400">
                  🔒 Technical Details
                </h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      Built on {SupportedChains.monad.chainName} for fast &
                      low-cost transactions
                    </span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>Smart contract is open source and verified</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>Optimized for gas efficiency and minimal UI</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>
                      All transactions are transparent on the blockchain
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
