"use client";

import { useStore } from "@/store/useStore";
import { Sidebar } from "@/components/Sidebar";
import { Chat } from "@/components/Chat";
import { DatabaseConnections } from "@/components/DatabaseConnections";
import { SchemaVisualizer } from "@/components/SchemaVisualizer";
import { Dock } from "@/components/Dock";
import { Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { activeTab, sidebarOpen, setSidebarOpen } = useStore();

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
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Top Navigation - Simplified */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="h-16 bg-black/50 backdrop-blur-xl border-b border-white/20 flex items-center px-6 z-30 relative component-shadow"
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-xl mr-4 transition-colors"
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
      </motion.nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed md:relative inset-y-0 left-0 z-50 md:z-auto"
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Dock Navigation */}
      <Dock />
    </div>
  );
}
