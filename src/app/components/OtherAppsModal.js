import React from "react";
import { FiX, FiExternalLink } from "react-icons/fi";
import appsData from "../../../apps.json";
import Image from "next/image";

const OtherAppsModal = ({ onClose }) => {
  const handleAppClick = async (app) => {
    try {
      // Haptic feedback if available
      if (window.parent !== window) {
        // We're in a frame, try to communicate with parent
        window.parent.postMessage(
          {
            type: "OPEN_EXTERNAL_LINK",
            url: app.url,
          },
          "*"
        );
      } else {
        // Direct navigation
        window.open(app.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to open app:", error);
      // Fallback
      window.open(app.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="relative w-full max-w-md h-auto max-h-[80vh] flex flex-col bg-zinc-900 border-zinc-800 rounded-2xl border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-purple-400">
                Other Apps
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full transition-colors hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid gap-3">
              {appsData.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className="p-4 rounded-xl border cursor-pointer transition-all duration-200 active:scale-[0.98] bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    {/* App Icon */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                      <Image
                        src={app.icon}
                        width={48}
                        height={48}
                        alt={`${app.name} icon`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to a gradient if image fails
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      {/* Fallback gradient */}
                      <div
                        className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg"
                        style={{ display: "none" }}
                      >
                        {app.name.charAt(0)}
                      </div>
                    </div>

                    {/* App Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate text-zinc-100">
                          {app.name}
                        </h4>
                        <FiExternalLink className="w-3 h-3 flex-shrink-0 text-zinc-500" />
                      </div>
                      <p className="text-xs mt-1 line-clamp-2 text-zinc-400">
                        {app.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherAppsModal;
