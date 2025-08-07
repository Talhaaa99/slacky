"use client";

import { useState, useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import {
  Database,
  Eye,
  ChevronDown,
  ChevronRight,
  Layers,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function SchemaVisualizer() {
  const { schemas, activeConnection } = useStore();
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTableExpansion = useCallback((tableName: string) => {
    setExpandedTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  }, []);

  if (!activeConnection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-white text-shadow mb-2">
            No Database Selected
          </h3>
          <p className="text-gray-400 text-shadow-sm">
            Select a database connection to view its schema
          </p>
        </div>
      </motion.div>
    );
  }

  const schema = schemas[activeConnection.id];
  if (!schema) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center">
          <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-white text-shadow mb-2">
            No Schema Available
          </h3>
          <p className="text-gray-400 text-shadow-sm">
            Connect to the database to load the schema
          </p>
        </div>
      </motion.div>
    );
  }

  const items = schema.tables || schema.collections || [];
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-full"
      >
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-white text-shadow mb-2">
            No Schema Data
          </h3>
          <p className="text-gray-400 text-shadow-sm">
            No tables or collections found in the database schema
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 border-b border-white/20 component-shadow"
      >
        <h2 className="text-lg font-semibold text-white text-shadow">
          Database Schema
        </h2>
        <p className="text-gray-400 text-shadow-sm mt-1 text-sm">
          {activeConnection.name} - {items.length}{" "}
          {schema.tables ? "tables" : "collections"}
        </p>
      </motion.div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3 space-y-2">
          {items.map((item: any, index: number) => {
            const isTable = !!schema.tables;
            const isExpanded = expandedTables.has(item.name);
            const columns = item.columns || item.fields || [];

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/10 component-shadow"
              >
                {/* Table Header */}
                <motion.div
                  whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  className="p-3 cursor-pointer"
                  onClick={() => toggleTableExpansion(item.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                        <Database className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {columns.length} columns •{" "}
                          {isTable ? "Table" : "Collection"}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200"
                    >
                      <AnimatePresence mode="wait">
                        {isExpanded ? (
                          <motion.div
                            key="down"
                            initial={{ rotate: -90 }}
                            animate={{ rotate: 0 }}
                            exit={{ rotate: 90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-300" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="right"
                            initial={{ rotate: 90 }}
                            animate={{ rotate: 0 }}
                            exit={{ rotate: -90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Layers className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-300">
                            Columns
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                          {columns.map((column: any, colIndex: number) => (
                            <motion.div
                              key={colIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: colIndex * 0.03 }}
                              className="flex items-center justify-between p-2 bg-gray-800 bg-opacity-50 rounded border border-gray-700"
                            >
                              <div className="flex items-center space-x-2">
                                <Code className="w-3 h-3 text-blue-400" />
                                <span className="font-mono text-xs text-gray-200">
                                  {column.name}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 font-medium px-1 py-0.5 bg-gray-700 rounded">
                                {column.type}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {columns.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-2"
                          >
                            <span className="text-xs text-gray-500">
                              No columns available
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
