"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Send, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ChatMessage } from "@/types";
import ResultsTable from "@/components/ResultsTable";

interface ClarificationContext {
  originalMessage: string;
  question: string;
  options?: string[];
}

export default function Chat() {
  const { activeConnection, schemas, addMessage } = useStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clarificationContext, setClarificationContext] =
    useState<ClarificationContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [useStore.getState().messages]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const generateAISummary = async (
    query: string,
    results: any,
    userQuestion: string
  ): Promise<string> => {
    try {
      const summaryResponse = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          results,
          userQuestion,
        }),
      });

      if (summaryResponse.ok) {
        const summaryResult = await summaryResponse.json();
        if (summaryResult.success && summaryResult.summary) {
          return summaryResult.summary;
        }
      }

      // Fallback to simple summary
      const count = Array.isArray(results.result) ? results.result.length : 0;
      return `Found ${count} results for your query.`;
    } catch (error) {
      console.error("Error generating AI summary:", error);
      const count = Array.isArray(results.result) ? results.result.length : 0;
      return `Found ${count} results for your query.`;
    }
  };

  const handleClarificationSelect = async (selectedTable: string) => {
    if (!clarificationContext) return;

    // Add user's selection as a message
    const selectionMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: `I want to use the "${selectedTable}" table.`,
      timestamp: new Date(),
    };
    addMessage(selectionMessage);

    setIsLoading(true);
    setClarificationContext(null);

    try {
      const schema = schemas[activeConnection!.id];

      // Generate query with clarification
      const generateResponse = await fetch("/api/generate-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clarificationContext.originalMessage,
          schema,
          mapping: schema.mapping || {},
          databaseType: activeConnection!.type,
          clarificationResponse: { selectedTable },
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate query");
      }

      const generateResult = await generateResponse.json();

      // Check for further clarification needs
      if (generateResult.needsClarification) {
        const clarificationMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: generateResult.question,
          timestamp: new Date(),
        };
        addMessage(clarificationMessage);

        setClarificationContext({
          originalMessage: clarificationContext.originalMessage,
          question: generateResult.question,
          options: generateResult.options,
        });
        return;
      }

      // Execute the query
      const executeResponse = await fetch("/api/execute-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: generateResult.query,
          connection: activeConnection,
        }),
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();

        // Handle specific database errors intelligently
        if (errorData.errorType === "INCOMPLETE_QUERY") {
          const retryMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `${errorData.error}\n\nLet me try to generate a complete query for you. Please ask your question again and I'll make sure to provide a full SQL statement.`,
            timestamp: new Date(),
          };
          addMessage(retryMessage);
          setIsLoading(false);
          return;
        }

        if (
          errorData.errorType === "TABLE_NOT_FOUND" ||
          errorData.errorType === "COLUMN_NOT_FOUND"
        ) {
          const clarificationMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `${errorData.error}\n\nWould you like me to:\n1. Show you the available tables/columns in the Schema tab\n2. Try a different approach to your question\n3. Help you rephrase your query\n\nPlease let me know how you'd like to proceed.`,
            timestamp: new Date(),
          };
          addMessage(clarificationMessage);
          setIsLoading(false);
          return;
        }

        throw new Error(errorData.error || "Failed to execute query");
      }

      const result = await executeResponse.json();

      // Generate AI summary
      const aiSummary = await generateAISummary(
        generateResult.query,
        result,
        clarificationContext.originalMessage
      );

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: aiSummary,
        timestamp: new Date(),
        queryData: {
          query: generateResult.query,
          results: result.result || [],
          rawResponse: result,
        },
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `Sorry, I encountered an error processing your request. ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
    const originalInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const schema = schemas[activeConnection.id];
      if (!schema) {
        throw new Error(
          "No schema available for this database. Please reconnect the database to load the schema."
        );
      }

      // Generate query using AI
      const generateResponse = await fetch("/api/generate-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: originalInput,
          schema,
          mapping: schema.mapping || {},
          databaseType: activeConnection.type,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate query");
      }

      const generateResult = await generateResponse.json();

      // Check if clarification is needed
      if (generateResult.needsClarification) {
        const clarificationMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: generateResult.question,
          timestamp: new Date(),
        };
        addMessage(clarificationMessage);

        setClarificationContext({
          originalMessage: originalInput,
          question: generateResult.question,
          options: generateResult.options,
        });
        setIsLoading(false);
        return;
      }

      // Execute the query
      const executeResponse = await fetch("/api/execute-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: generateResult.query,
          connection: activeConnection,
        }),
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json();

        // Handle specific database errors intelligently
        if (errorData.errorType === "INCOMPLETE_QUERY") {
          const retryMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `${errorData.error}\n\nLet me try to generate a complete query for you. Please ask your question again and I'll make sure to provide a full SQL statement.`,
            timestamp: new Date(),
          };
          addMessage(retryMessage);
          setIsLoading(false);
          return;
        }

        if (
          errorData.errorType === "TABLE_NOT_FOUND" ||
          errorData.errorType === "COLUMN_NOT_FOUND"
        ) {
          const clarificationMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `${errorData.error}\n\nWould you like me to:\n1. Show you the available tables/columns in the Schema tab\n2. Try a different approach to your question\n3. Help you rephrase your query\n\nPlease let me know how you'd like to proceed.`,
            timestamp: new Date(),
          };
          addMessage(clarificationMessage);
          setIsLoading(false);
          return;
        }

        throw new Error(errorData.error || "Failed to execute query");
      }

      const result = await executeResponse.json();

      // Generate AI summary
      const aiSummary = await generateAISummary(
        generateResult.query,
        result,
        originalInput
      );

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: aiSummary,
        timestamp: new Date(),
        queryData: {
          query: generateResult.query,
          results: result.result || [],
          rawResponse: result,
        },
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `Sorry, I encountered an error processing your request. ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const messages = useStore((state) => state.messages);

  if (!activeConnection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
          </div>
          <h3 className="text-lg font-semibold text-white text-shadow mb-2">
            No Database Connected
          </h3>
          <p className="text-gray-400 text-shadow-sm">
            Connect to a database to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
            </div>
            <h3 className="text-lg font-semibold text-white text-shadow mb-2">
              Start a Conversation
            </h3>
            <p className="text-gray-400 text-shadow-sm">
              Ask questions about your database in natural language
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] space-y-3 ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === "assistant" && (
                      <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                  </div>
                </div>

                {/* Results Table */}
                {message.role === "assistant" && message.queryData && (
                  <div className="w-full">
                    <ResultsTable
                      data={message.queryData.results}
                      query={message.queryData.query}
                      isExpanded={false}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}

        {/* Clarification Options */}
        {clarificationContext && clarificationContext.options && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 text-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
              <p className="text-sm mb-3">Select a table:</p>
              <div className="flex flex-wrap gap-2">
                {clarificationContext.options.map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClarificationSelect(option)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    disabled={isLoading}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 text-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {clarificationContext
                    ? "Processing your selection..."
                    : "Analyzing your query..."}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/20">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your database..."
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={isLoading || !!clarificationContext}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !input.trim() || !!clarificationContext}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl px-4 py-3 transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
