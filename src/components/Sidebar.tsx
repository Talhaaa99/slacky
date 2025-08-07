"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import {
  Database,
  Plus,
  Trash2,
  X,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
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
    schemas,
  } = useStore();

  const [testingConnection, setTestingConnection] = useState<string | null>(
    null
  );

  const handleAddDatabase = () => {
    // Switch to connections tab and close sidebar on mobile
    setActiveTab("connections");
    setSidebarOpen(false);
  };

  const handleTestConnection = async (connection: any) => {
    setTestingConnection(connection.id);

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connection }),
      });

      const result = await response.json();

      if (result.success && result.schema) {
        // Update the store with the schema
        const { updateSchema } = useStore.getState();
        updateSchema(connection.id, {
          ...result.schema,
          mapping: {},
        });
        console.log("Connection test successful for:", connection.name);
        console.log("Schema stored:", result.schema);
      } else {
        console.error(
          "Connection test failed for:",
          connection.name,
          result.error
        );
      }
    } catch (error) {
      console.error("Error testing connection:", error);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    // Remove the schema for this connection
    const { schemas, updateSchema } = useStore.getState();
    const newSchemas = { ...schemas };
    delete newSchemas[connectionId];

    // Update the store to remove the schema
    useStore.setState({ schemas: newSchemas });
  };

  const getConnectionStatus = (connection: any) => {
    // Check if schema exists for this connection
    const hasSchema = schemas[connection.id];
    const isActive = activeConnection?.id === connection.id;

    if (testingConnection === connection.id) {
      return { status: "testing", icon: Loader2, color: "text-yellow-400" };
    }

    if (hasSchema) {
      return { status: "connected", icon: Wifi, color: "text-green-400" };
    }

    return { status: "disconnected", icon: WifiOff, color: "text-gray-400" };
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
            connections.map((connection, index) => {
              const status = getConnectionStatus(connection);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105 group",
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

                    <div className="flex items-center space-x-2">
                      {/* Status indicator */}
                      <StatusIcon className={cn("w-4 h-4", status.color)} />

                      {/* Connect/Test button */}
                      {status.status === "disconnected" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestConnection(connection);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-green-500 hover:text-white rounded-lg transition-all duration-200"
                          title="Test Connection"
                        >
                          <Wifi className="w-3 h-3" />
                        </button>
                      )}

                      {/* Disconnect button */}
                      {status.status === "connected" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(connection.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-500 hover:text-white rounded-lg transition-all duration-200"
                          title="Disconnect"
                        >
                          <WifiOff className="w-3 h-3" />
                        </button>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeConnection(connection.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200"
                        title="Remove Connection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs opacity-70 font-mono">
                    {connection.host}:{connection.port}
                  </div>

                  {/* Status text */}
                  <div className="mt-2 text-xs opacity-60">
                    Status: {status.status}
                    {status.status === "testing" && (
                      <span className="ml-2 text-yellow-400">
                        Testing connection...
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
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
