"use client";

import { useState, useEffect } from "react";
import { AdminConfig, SlackBotStatus } from "@/types/slack";
import { cn } from "@/lib/utils";
import {
  Settings,
  Database,
  Bot,
  Activity,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from "lucide-react";

interface AdminPanelProps {
  onConfigUpdate?: (config: AdminConfig) => void;
}

export default function AdminPanel({ onConfigUpdate }: AdminPanelProps) {
  const [config, setConfig] = useState<AdminConfig>({
    slackBotToken: "",
    slackSigningSecret: "",
    databaseUrl: "",
    huggingfaceApiKey: "",
  });

  const [status, setStatus] = useState<SlackBotStatus>({
    isConnected: false,
    channels: [],
    lastActivity: new Date(),
    totalQueries: 0,
    errorRate: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    // Load config from environment variables (client-side only for display)
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/admin/config");
        if (response.ok) {
          const envConfig = await response.json();
          setConfig(envConfig);
        }
      } catch (error) {
        console.log("Using local config fallback");
        // Fallback to localStorage for development
        const savedConfig = localStorage.getItem("slacky-admin-config");
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        }
      }
    };

    loadConfig();
  }, []);

  const handleConfigChange = (key: keyof AdminConfig, value: string) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);

    // Store in localStorage for development only
    if (process.env.NODE_ENV === "development") {
      localStorage.setItem("slacky-admin-config", JSON.stringify(newConfig));
    }

    onConfigUpdate?.(newConfig);
  };

  const saveConfig = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setMessage("✅ Configuration saved successfully!");
      } else {
        throw new Error("Failed to save configuration");
      }
    } catch (error) {
      setMessage(
        `❌ Failed to save: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      // Test database connection
      const dbResponse = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "How many users are in the database?",
          userId: "admin-test",
          channel: "admin",
        }),
      });

      if (!dbResponse.ok) {
        throw new Error("Database connection failed");
      }

      // Test Hugging Face API
      const hfResponse = await fetch("/api/generate-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "test query" }),
      });

      if (!hfResponse.ok) {
        throw new Error("Hugging Face API connection failed");
      }

      setMessage("✅ All connections successful!");
      setStatus((prev) => ({ ...prev, isConnected: true }));
    } catch (error) {
      setMessage(
        `❌ Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setStatus((prev) => ({ ...prev, isConnected: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const maskSecret = (secret: string) => {
    if (!secret) return "";
    if (showSecrets) return secret;
    return "*".repeat(Math.min(secret.length, 20));
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-black text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Slacky Admin Panel
          </h1>
          <p className="text-gray-400">
            Configure your Slack bot and database connections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Section */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Database URL
                  </label>
                  <input
                    type="text"
                    value={config.databaseUrl}
                    onChange={(e) =>
                      handleConfigChange("databaseUrl", e.target.value)
                    }
                    placeholder="postgresql://user:pass@localhost:5432/db"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hugging Face API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={maskSecret(config.huggingfaceApiKey)}
                      onChange={(e) =>
                        handleConfigChange("huggingfaceApiKey", e.target.value)
                      }
                      placeholder="hf_..."
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                    />
                    <button
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showSecrets ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slack Bot Token
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={maskSecret(config.slackBotToken)}
                      onChange={(e) =>
                        handleConfigChange("slackBotToken", e.target.value)
                      }
                      placeholder="xoxb-..."
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                    />
                    <button
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showSecrets ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slack Signing Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={maskSecret(config.slackSigningSecret)}
                      onChange={(e) =>
                        handleConfigChange("slackSigningSecret", e.target.value)
                      }
                      placeholder="..."
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                    />
                    <button
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showSecrets ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={saveConfig}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Config
                  </button>
                  <button
                    onClick={testConnection}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Connection
                  </button>
                </div>

                {message && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      message.includes("✅")
                        ? "bg-green-900/50 text-green-300"
                        : "bg-red-900/50 text-red-300"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Bot Status
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Connection Status</span>
                  <div className="flex items-center">
                    {status.isConnected ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mr-2" />
                    )}
                    <span
                      className={
                        status.isConnected ? "text-green-400" : "text-red-400"
                      }
                    >
                      {status.isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Queries</span>
                  <span className="text-white font-semibold">
                    {status.totalQueries}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Error Rate</span>
                  <span
                    className={`font-semibold ${
                      status.errorRate > 10 ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {status.errorRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Last Activity</span>
                  <span className="text-white text-sm">
                    {status.lastActivity.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Quick Actions
              </h2>

              <div className="space-y-3">
                <button className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white px-4 py-3 rounded-lg transition-colors duration-200 text-left">
                  View Query Logs
                </button>
                <button className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white px-4 py-3 rounded-lg transition-colors duration-200 text-left">
                  Test Slack Integration
                </button>
                <button className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white px-4 py-3 rounded-lg transition-colors duration-200 text-left">
                  Export Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
