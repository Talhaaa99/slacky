"use client";

import { useState, useEffect } from "react";
import { QueryLog } from "@/types/slack";
import { cn } from "@/lib/utils";
import {
  Clock,
  User,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function QueryLog() {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "error">("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "success") return !log.error;
    if (filter === "error") return !!log.error;
    return true;
  });

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-black text-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Database className="w-8 h-8 mr-3" />
            Query Logs
          </h1>
          <p className="text-gray-400">
            Monitor all database queries and their results
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilter("success")}
            className={cn(
              "px-4 py-2 rounded-md transition-colors flex items-center",
              filter === "success"
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Success ({logs.filter((l) => !l.error).length})
          </button>
          <button
            onClick={() => setFilter("error")}
            className={cn(
              "px-4 py-2 rounded-md transition-colors flex items-center",
              filter === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Errors ({logs.filter((l) => !!l.error).length})
          </button>
        </div>

        {/* Logs */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-gray-400">Loading logs...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No logs found</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "bg-gray-900 rounded-lg p-6 border transition-all hover:border-gray-700",
                    log.error ? "border-red-800" : "border-gray-800"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-400">
                        <User className="w-4 h-4 mr-1" />
                        {log.user}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Database className="w-4 h-4 mr-1" />
                        {log.channel}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          "flex items-center text-sm",
                          log.error ? "text-red-400" : "text-green-400"
                        )}
                      >
                        {log.error ? (
                          <AlertCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        {log.error ? "Error" : "Success"}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Zap className="w-4 h-4 mr-1" />
                        {formatExecutionTime(log.executionTime)}
                      </div>
                    </div>
                  </div>

                  {/* Original Query */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Original Query
                    </h4>
                    <p className="text-white bg-gray-800 p-3 rounded-md">
                      {log.originalQuery}
                    </p>
                  </div>

                  {/* Generated SQL */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Generated SQL
                    </h4>
                    <pre className="text-green-400 bg-gray-800 p-3 rounded-md overflow-x-auto text-sm">
                      {log.generatedSQL || "No SQL generated"}
                    </pre>
                  </div>

                  {/* Result or Error */}
                  {log.error ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">
                        Error
                      </h4>
                      <p className="text-red-400 bg-gray-800 p-3 rounded-md">
                        {log.error}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">
                        Result
                      </h4>
                      <pre className="text-blue-400 bg-gray-800 p-3 rounded-md overflow-x-auto text-sm">
                        {JSON.stringify(log.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
