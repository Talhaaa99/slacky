"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { ChatMessage } from "@/types";
import { generateId, formatDate } from "@/lib/utils";
import { Send, Bot, User, Database, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Add the generateResultSummary function
function generateResultSummary(
  result: any,
  query: string,
  databaseType: string
): string {
  if (!result || !Array.isArray(result)) {
    return "No results found for your query.";
  }

  const count = result.length;

  if (count === 0) {
    return "Your query returned no results.";
  }

  // Try to determine what the query is about based on keywords
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("count") || lowerQuery.includes("count(")) {
    return `Found ${count} total records matching your criteria.`;
  }

  if (
    lowerQuery.includes("sum") ||
    lowerQuery.includes("total") ||
    lowerQuery.includes("revenue")
  ) {
    if (result[0] && typeof result[0] === "object") {
      const firstResult = result[0];
      const totalKey = Object.keys(firstResult).find(
        (key) =>
          key.toLowerCase().includes("total") ||
          key.toLowerCase().includes("sum") ||
          key.toLowerCase().includes("revenue")
      );
      if (totalKey) {
        return `Total ${totalKey.replace(/_/g, " ")}: ${firstResult[totalKey]}`;
      }
    }
    return `Found ${count} aggregated results.`;
  }

  if (lowerQuery.includes("user") || lowerQuery.includes("customer")) {
    return `Found ${count} user${count !== 1 ? "s" : ""} in the database.`;
  }

  if (lowerQuery.includes("order") || lowerQuery.includes("purchase")) {
    return `Found ${count} order${count !== 1 ? "s" : ""} in the database.`;
  }

  if (lowerQuery.includes("product") || lowerQuery.includes("item")) {
    return `Found ${count} product${count !== 1 ? "s" : ""} in the database.`;
  }

  // Default summary
  return `Found ${count} record${count !== 1 ? "s" : ""} matching your query.`;
}

export function Chat() {
  const {
    messages,
    addMessage,
    activeConnection,
    isLoading,
    setLoading,
    schemas,
  } = useStore();
  const [input, setInput] = useState("");
  const [clarificationContext, setClarificationContext] = useState<{
    originalMessage: string;
    clarificationQuestion: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConnection) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput("");
    setLoading(true);

    try {
      // Get schema and mapping for the active connection
      const schema = schemas[activeConnection.id];
      const mapping = schema?.mapping || {};

      // Debug logging
      console.log("Active connection:", activeConnection);
      console.log("Schema:", schema);
      console.log("Mapping:", mapping);

      if (!schema) {
        throw new Error(
          "No schema available for this database. Please reconnect the database to load the schema."
        );
      }

      // Generate query using AI
      const generateResponse = await fetch("/api/generate-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          schema,
          mapping,
          databaseType: activeConnection.type,
        }),
      });

      const generateResult = await generateResponse.json();

      if (!generateResult.success) {
        throw new Error(generateResult.error || "Failed to generate query");
      }

      // Check if clarification is needed
      if (generateResult.needsClarification) {
        const clarificationMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: generateResult.clarificationQuestion,
          timestamp: new Date(),
          needsClarification: true,
        };
        addMessage(clarificationMessage);
        setClarificationContext({
          originalMessage: input,
          clarificationQuestion: generateResult.clarificationQuestion,
        });
        return;
      }

      // If this is a response to a clarification, use the original message
      const queryMessage = clarificationContext
        ? clarificationContext.originalMessage
        : input;
      setClarificationContext(null); // Clear the context

      const generatedQuery = generateResult.query;

      // Execute the generated query
      const executeResponse = await fetch("/api/execute-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connection: activeConnection,
          query: generatedQuery,
        }),
      });

      const executeResult = await executeResponse.json();

      // Generate summary of results
      let summary = "";
      if (executeResult.success && executeResult.result) {
        summary = generateResultSummary(
          executeResult.result,
          generatedQuery,
          activeConnection.type
        );
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: executeResult.success
          ? `${summary}\n\nHere are the results for your query: "${queryMessage}"`
          : `I couldn't execute the query. ${executeResult.error}`,
        timestamp: new Date(),
        sqlQuery: generatedQuery,
        result: executeResult.success ? executeResult.result : undefined,
        error: executeResult.success ? undefined : executeResult.error,
      };

      addMessage(assistantMessage);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!activeConnection) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex items-center justify-center bg-black"
      >
        <div className="text-center">
          <Database className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-3 text-white">
            No Database Selected
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Please select a database connection to start chatting with your data
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Chat Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 border-b border-gray-800 bg-gray-900"
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-white rounded-lg">
            <Database className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {activeConnection.name}
            </h2>
            <p className="text-sm text-gray-400 capitalize font-mono">
              {activeConnection.type} • {activeConnection.host}:
              {activeConnection.port}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="relative">
                <Bot className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                <Sparkles className="w-8 h-8 text-gray-500 absolute -top-2 -right-2" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">
                Start a conversation
              </h3>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Ask me anything about your database. I'll help you query and
                understand your data.
              </p>
              <div className="space-y-3 text-sm text-gray-500 max-w-md mx-auto">
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="font-mono">
                    "Show me all users from last month"
                  </p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="font-mono">
                    "What's the total revenue by country?"
                  </p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <p className="font-mono">
                    "Get the top 10 customers by order value"
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex space-x-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "max-w-[80%] rounded-2xl p-4 shadow-lg",
                    message.role === "user"
                      ? "bg-white text-black"
                      : "bg-gray-900 border border-gray-800"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === "user" ? (
                      <User className="w-5 h-5 mt-1 flex-shrink-0 text-black" />
                    ) : (
                      <Bot className="w-5 h-5 mt-1 flex-shrink-0 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.sqlQuery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 p-3 bg-black rounded-lg border border-gray-700"
                        >
                          <p className="text-xs font-mono text-gray-300">
                            {message.sqlQuery}
                          </p>
                        </motion.div>
                      )}
                      {message.result && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3"
                        >
                          <p className="text-xs text-gray-400 mb-2">Result:</p>
                          <div className="max-h-60 overflow-auto">
                            <pre className="text-xs bg-black p-3 rounded-lg border border-gray-700 text-gray-300">
                              {JSON.stringify(message.result, null, 2)}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                      {message.error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 flex items-center space-x-2 text-red-400"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">{message.error}</span>
                        </motion.div>
                      )}
                      <p className="text-xs opacity-60 mt-2 font-mono">
                        {formatDate(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 border-t border-gray-800 bg-gray-900"
      >
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              clarificationContext
                ? "Please specify which table/collection you want to query..."
                : "Ask about your database..."
            }
            className="flex-1 p-4 border border-gray-700 rounded-xl bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-4 bg-white text-black rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
