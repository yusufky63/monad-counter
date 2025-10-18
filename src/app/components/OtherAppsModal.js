import React from "react";
import { FiX, FiExternalLink } from "react-icons/fi";
import appsData from "../../../apps.json";
import Image from "next/image";

const OtherAppsModal = ({ theme, onClose }) => {
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
          className={`absolute inset-0 ${
            theme === "dark" ? "bg-black/50" : "bg-black/20"
          } backdrop-blur-sm`}
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative w-full max-w-md h-auto max-h-[80vh] flex flex-col ${
            theme === "dark"
              ? "bg-black/90 border-white/10"
              : "bg-white border-gray-200"
          } rounded-2xl border shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`p-3 border-b ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-base font-medium tracking-tight ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                <span className="bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                  Other Apps
                </span>
              </h3>
              <button
                onClick={onClose}
                className={`p-1 rounded-full transition-colors ${
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-100"
                }`}
              >
                <FiX className="text-red-500" />
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
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    theme === "dark"
                      ? "bg-gray-900/50 border-white/10 hover:bg-gray-800/70 hover:border-white/20"
                      : "bg-gray-50/80 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
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
                        <h4
                          className={`font-semibold text-sm truncate ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {app.name}
                        </h4>
                        <FiExternalLink
                          className={`w-3 h-3 flex-shrink-0 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-xs mt-1 line-clamp-2 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
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
