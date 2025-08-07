"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Database,
  BarChart3,
  Settings,
  Bot,
} from "lucide-react";
import { useStore } from "@/store/useStore";

const dockItems = [
  {
    id: "chat",
    label: "Chat",
    icon: Bot,
    description: "AI Database Assistant",
  },
  {
    id: "connections",
    label: "Databases",
    icon: Database,
    description: "Manage Connections",
  },
  {
    id: "schema",
    label: "Schema",
    icon: BarChart3,
    description: "Visualize Structure",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Configuration",
  },
];

export function Dock() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="flex items-center space-x-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 component-shadow"
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(item.id as any)}
              className={`relative group p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-white text-black"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-6 h-6" />

              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap component-shadow"
              >
                <div className="text-center">
                  <div className="font-semibold text-shadow-sm">
                    {item.label}
                  </div>
                  <div className="text-gray-300 text-shadow-sm">
                    {item.description}
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
