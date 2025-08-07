"use client";

import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import Chat from "@/components/Chat";
import { DatabaseConnections } from "@/components/DatabaseConnections";
import SchemaVisualizer from "@/components/SchemaVisualizer";
import { Sidebar } from "@/components/Sidebar";
import {
  Settings,
  MessageSquare,
  Database,
  Eye,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { activeTab, sidebarOpen, setSidebarOpen, setActiveTab } = useStore();

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "connections", label: "Databases", icon: Database },
    { id: "schema", label: "Schema", icon: Eye },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return <Chat />;
      case "connections":
        return <DatabaseConnections />;
      case "schema":
        return <SchemaVisualizer />;
      case "settings":
        return (
          <div className="p-6 text-center">
            <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-shadow">Settings</h2>
            <p className="text-gray-400 text-shadow-sm">
              Settings panel coming soon...
            </p>
          </div>
        );
      default:
        return <Chat />;
    }
  };

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      {/* Mobile Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Top Navigation with Tab Selector */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="h-20 bg-black/50 backdrop-blur-xl border-b border-white/20 flex items-center px-6 z-30 relative component-shadow"
      >
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-white rounded"></div>
              <div className="w-full h-0.5 bg-white rounded"></div>
              <div className="w-full h-0.5 bg-white rounded"></div>
            </div>
          </button>

          <h1 className="text-xl font-semibold text-white text-shadow">
            Database Assistant
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex-1 flex justify-center">
          <div className="flex space-x-1 bg-gray-900 bg-opacity-50 rounded-xl p-1 backdrop-blur-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-white text-black shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed md:relative inset-y-0 left-0 z-50 md:z-auto"
        >
          <Sidebar />
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-hidden"
        >
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
