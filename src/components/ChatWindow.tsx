"use client";

import { useEffect, useRef } from "react";
import { Message as MessageType } from "@/types/chat";
import Message from "./Message";

interface ChatWindowProps {
  messages: MessageType[];
  channelName: string;
}

export default function ChatWindow({ messages, channelName }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className=" px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">#</span>
          <h2 className="text-lg font-semibold">{channelName}</h2>
        </div>
        <p className="text-sm mt-1">
          Ask questions about your Postgres database in natural language
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium mb-2">
                Welcome to {channelName}
              </h3>
              <p className="text-sm">
                Start by asking a question about your database, like:
              </p>
              <div className="mt-3 space-y-1 text-xs">
                <p>• &ldquo;How many users signed up last week?&rdquo;</p>
                <p>
                  • &ldquo;List the top 5 paying users from the last 30
                  days&rdquo;
                </p>
                <p>
                  • &ldquo;What&apos;s the average session time for users who
                  signed up via referral?&rdquo;
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
