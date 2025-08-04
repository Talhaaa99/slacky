"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Message, Channel } from "@/types/chat";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";
import { Menu, X } from "lucide-react";

const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "postgres-assistant",
    name: "postgres-assistant",
    isActive: true,
  },
];

export default function Chat() {
  const [channels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState("postgres-assistant");
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "postgres-assistant": [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleChannelSelect = useCallback((channelId: string) => {
    setActiveChannel(channelId);
    setIsMobileMenuOpen(false);
  }, []);

  const addMessage = useCallback((channelId: string, message: Message) => {
    setMessages((prev) => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), message],
    }));
  }, []);

  const updateMessage = useCallback(
    (channelId: string, messageId: string, updates: Partial<Message>) => {
      setMessages((prev) => ({
        ...prev,
        [channelId]:
          prev[channelId]?.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ) || [],
      }));
    },
    []
  );

  const processUserMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: "user",
        timestamp: new Date(),
      };

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        sender: "bot",
        timestamp: new Date(),
        isLoading: true,
      };

      addMessage(activeChannel, userMessage);
      addMessage(activeChannel, botMessage);
      setIsProcessing(true);

      try {
        const sqlResponse = await fetch("/api/generate-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        });

        if (!sqlResponse.ok) {
          throw new Error("Failed to generate SQL query");
        }

        const { query: sqlQuery, error: sqlError } = await sqlResponse.json();

        if (sqlError) {
          updateMessage(activeChannel, botMessage.id, {
            content: `Error generating SQL: ${sqlError}`,
            isLoading: false,
            error: sqlError,
          });
          return;
        }

        const executeResponse = await fetch("/api/execute-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: sqlQuery }),
        });

        if (!executeResponse.ok) {
          throw new Error("Failed to execute SQL query");
        }

        const { result, error: executeError } = await executeResponse.json();

        if (executeError) {
          updateMessage(activeChannel, botMessage.id, {
            content: `Error executing query: ${executeError}`,
            isLoading: false,
            error: executeError,
          });
          return;
        }

        let formattedResponse = "";

        if (Array.isArray(result)) {
          if (result.length === 0) {
            formattedResponse = "No results found for your query.";
          } else if (result.length === 1 && typeof result[0] === "object") {
            const row = result[0];
            const keys = Object.keys(row);
            if (keys.length === 1) {
              const value = row[keys[0]];
              const keyName = keys[0]
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              formattedResponse = `${keyName}: ${value}`;
            } else {
              formattedResponse = `Found ${result.length} result(s):\n\n${result
                .map((item, index) => {
                  const details = Object.entries(item)
                    .map(([key, value]) => {
                      const keyName = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase());
                      return `• ${keyName}: ${value}`;
                    })
                    .join("\n");
                  return `**Result ${index + 1}:**\n${details}`;
                })
                .join("\n\n")}`;
            }
          } else {
            formattedResponse = `Found ${result.length} results:\n\n${result
              .map((item, index) => {
                const details = Object.entries(item)
                  .map(([key, value]) => {
                    const keyName = key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase());
                    return `• ${keyName}: ${value}`;
                  })
                  .join("\n");
                return `**Result ${index + 1}:**\n${details}`;
              })
              .join("\n\n")}`;
          }
        } else {
          formattedResponse = `Result: ${JSON.stringify(result)}`;
        }

        updateMessage(activeChannel, botMessage.id, {
          content: formattedResponse,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error processing message:", error);
        updateMessage(activeChannel, botMessage.id, {
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [activeChannel, addMessage, updateMessage]
  );

  const currentMessages = messages[activeChannel] || [];
  const currentChannel = channels.find((c) => c.id === activeChannel);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-black">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-20 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-black/80 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl transition-all duration-200 hover:scale-105"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar
          channels={channels}
          activeChannel={activeChannel}
          onChannelSelect={handleChannelSelect}
        />
      </div>

      {/* Sidebar - Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-gray-800/50">
            <Sidebar
              channels={channels}
              activeChannel={activeChannel}
              onChannelSelect={handleChannelSelect}
            />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col md:ml-0">
        <ChatWindow
          messages={currentMessages}
          channelName={currentChannel?.name || ""}
        />
        <MessageInput
          onSendMessage={processUserMessage}
          disabled={isProcessing}
        />
      </div>
    </div>
  );
}
