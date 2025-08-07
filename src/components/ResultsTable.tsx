"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Table,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

interface ResultsTableProps {
  data: any[];
  query: string;
  isExpanded?: boolean;
}

export default function ResultsTable({
  data,
  query,
  isExpanded = false,
}: ResultsTableProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [copiedQuery, setCopiedQuery] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/10 component-shadow p-4">
        <div className="text-center text-gray-400">
          <Table className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No data to display</p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0]);
  const rowCount = data.length;

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    } catch (err) {
      console.error("Failed to copy query:", err);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "object") return JSON.stringify(value);
    return value.toString();
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/10 component-shadow">
      {/* Header */}
      <motion.div
        className="p-4 border-b border-white/10 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
              <Table className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Query Results
              </h3>
              <p className="text-xs text-gray-400">
                {rowCount} {rowCount === 1 ? "row" : "rows"} • {columns.length}{" "}
                {columns.length === 1 ? "column" : "columns"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Copy Query Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                copyQuery();
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Copy SQL Query"
            >
              {copiedQuery ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-300" />
              )}
            </motion.button>

            {/* Expand/Collapse Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <AnimatePresence mode="wait">
                {expanded ? (
                  <motion.div
                    key="expanded"
                    initial={{ rotate: -90 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EyeOff className="w-4 h-4 text-gray-300" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="collapsed"
                    initial={{ rotate: 90 }}
                    animate={{ rotate: 0 }}
                    exit={{ rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Eye className="w-4 h-4 text-gray-300" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {/* SQL Query Display */}
              <div className="mb-4 bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-300">
                    SQL Query
                  </span>
                  {copiedQuery && (
                    <motion.span
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-green-400"
                    >
                      Copied!
                    </motion.span>
                  )}
                </div>
                <code className="text-xs text-gray-200 font-mono whitespace-pre-wrap">
                  {query}
                </code>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {columns.map((column, index) => (
                        <th
                          key={index}
                          className="text-left py-3 px-4 font-medium text-gray-300 bg-gray-800 first:rounded-l-lg last:rounded-r-lg"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 100).map((row, rowIndex) => (
                      <motion.tr
                        key={rowIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: rowIndex * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        {columns.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className="py-3 px-4 text-gray-200"
                          >
                            <div
                              className="max-w-xs truncate"
                              title={formatValue(row[column])}
                            >
                              {formatValue(row[column])}
                            </div>
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {/* Show truncation message if data is large */}
                {data.length > 100 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4 text-gray-400"
                  >
                    <p className="text-sm">
                      Showing first 100 rows of {data.length} total results
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
