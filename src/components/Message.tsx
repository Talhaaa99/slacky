"use client";

import { Message as MessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, User, Loader2 } from "lucide-react";

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.sender === "user";
  const isBot = message.sender === "bot";

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-4 hover:bg-gray-900/30 transition-colors rounded-xl",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {isBot && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex-1 max-w-3xl",
          isUser ? "order-first" : "order-last"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]",
            isUser
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              : "bg-gray-900/80 text-gray-100 border border-gray-800/50"
          )}
        >
          {message.isLoading ? (
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm">Processing your query...</span>
            </div>
          ) : message.error ? (
            <div className="text-red-400">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{message.error}</p>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          )}
        </div>

        <div
          className={cn(
            "text-xs text-gray-500 mt-2",
            isUser ? "text-right" : "text-left"
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
