"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Database, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const {
    connections,
    activeConnection,
    setActiveConnection,
    removeConnection,
    setSidebarOpen,
    setActiveTab,
  } = useStore();

  const handleAddDatabase = () => {
    // Switch to connections tab and close sidebar on mobile
    setActiveTab("connections");
    setSidebarOpen(false);
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="h-full flex flex-col bg-gray-900 border-r border-gray-800"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Databases</h2>
            <p className="text-sm text-gray-400">Connected databases</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {connections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-400 mb-2">
                No databases connected
              </p>
              <p className="text-xs text-gray-500">
                Add a database to get started
              </p>
            </motion.div>
          ) : (
            connections.map((connection, index) => (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105",
                  activeConnection?.id === connection.id
                    ? "bg-white text-black border-white glow"
                    : "bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-700"
                )}
                onClick={() => setActiveConnection(connection)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database
                      className={cn(
                        "w-5 h-5",
                        activeConnection?.id === connection.id
                          ? "text-black"
                          : "text-gray-400"
                      )}
                    />
                    <div>
                      <p className="font-medium text-sm">{connection.name}</p>
                      <p className="text-xs opacity-70 capitalize">
                        {connection.type}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(connection.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 text-xs opacity-70 font-mono">
                  {connection.host}:{connection.port}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddDatabase}
          className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl border border-dashed border-gray-600 hover:border-gray-500 hover:bg-gray-800 transition-all duration-200"
        >
          <Plus className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Add Database</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
