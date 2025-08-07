"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { DatabaseConnection, DatabaseType } from "@/types";
import { generateId } from "@/lib/utils";
import {
  testConnection,
  getPostgresSchema,
  getMongoSchema,
} from "@/lib/database";
import { Database, Plus, Edit, Trash2, TestTube, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function DatabaseConnections() {
  const {
    connections,
    addConnection,
    updateConnection,
    removeConnection,
    updateSchema,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<DatabaseConnection | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "postgresql" as DatabaseType,
    host: "localhost",
    port: 5432,
    database: "",
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const connection: DatabaseConnection = {
      id: editingConnection?.id || generateId(),
      ...formData,
      encrypted: false, // We'll implement encryption later
    };

    if (editingConnection) {
      // Update existing connection
      updateConnection(editingConnection.id, connection);
    } else {
      // Add new connection
      addConnection(connection);
    }

    // Test connection and get schema via API
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connection }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the schema with the required mapping property
        updateSchema(connection.id, {
          ...result.schema,
          mapping: {},
        });

        setTestResult({
          success: true,
          message: "Connection successful! Schema loaded.",
        });
      } else {
        setTestResult({
          success: false,
          message:
            result.error || "Connection failed. Please check your credentials.",
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: `Error: ${error}` });
    } finally {
      setIsTesting(false);
    }

    setShowForm(false);
    setEditingConnection(null);
    setFormData({
      name: "",
      type: "postgresql",
      host: "localhost",
      port: 5432,
      database: "",
      username: "",
      password: "",
    });
  };

  const handleEdit = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.password,
    });
    setShowForm(true);
  };

  return (
    <div className="h-full bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white text-shadow-lg">
            Database Connections
          </h1>
          <p className="text-gray-300 text-shadow-sm">
            Manage your database connections and view schemas
          </p>
        </div>

        {/* Add Connection Button */}
        <div className="mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-200 component-shadow font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Database Connection</span>
          </motion.button>
        </div>

        {/* Connection Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-black border border-white/20 rounded-2xl p-6 w-full max-w-md component-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white text-shadow">
                  {editingConnection ? "Edit Connection" : "Add Connection"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingConnection(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white text-shadow-sm">
                    Connection Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-3 border border-white/20 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 component-shadow"
                    placeholder="My Database"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-white text-shadow-sm">
                    Database Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as DatabaseType,
                      })
                    }
                    className="w-full p-3 border border-white/20 rounded-xl bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 component-shadow"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white text-shadow-sm">
                      Host
                    </label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) =>
                        setFormData({ ...formData, host: e.target.value })
                      }
                      className="w-full p-3 border border-white/20 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 component-shadow"
                      placeholder="localhost"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white text-shadow-sm">
                      Port
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          port: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-3 border border-white/20 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 component-shadow"
                      placeholder="5432"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-white text-shadow-sm">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) =>
                      setFormData({ ...formData, database: e.target.value })
                    }
                    className="w-full p-3 border border-white/20 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 component-shadow"
                    placeholder="myapp"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-white text-shadow-sm">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full p-3 border border-white/20 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 component-shadow"
                    placeholder="postgres"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-white text-shadow-sm">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full p-3 border border-white/20 rounded-xl bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 component-shadow"
                    placeholder="•••••••• (optional)"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isTesting}
                    className="flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-100 disabled:opacity-50 font-medium transition-all duration-200 component-shadow"
                  >
                    {isTesting ? "Testing..." : "Save Connection"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingConnection(null);
                    }}
                    className="px-4 py-3 border border-white/20 rounded-xl hover:bg-white/10 text-white font-medium transition-all duration-200 component-shadow"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl ${
                    testResult.success
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  } component-shadow`}
                >
                  {testResult.message}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Connections List */}
        <div className="grid gap-4">
          {connections.map((connection) => (
            <motion.div
              key={connection.id}
              whileHover={{ scale: 1.01 }}
              className="p-4 border border-white/20 rounded-xl hover:bg-white/5 transition-all duration-200 component-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="font-medium text-white text-shadow-sm">
                      {connection.name}
                    </h3>
                    <p className="text-sm text-gray-300 text-shadow-sm capitalize">
                      {connection.type} • {connection.host}:{connection.port}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(connection)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeConnection(connection.id)}
                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {connections.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-white text-shadow">
              No connections yet
            </h3>
            <p className="text-gray-400 mb-4 text-shadow-sm">
              Add your first database connection to get started
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-200 component-shadow mx-auto font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Connection</span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
