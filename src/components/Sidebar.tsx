"use client";

import { motion } from "framer-motion";
import { Channel } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Hash, Zap, Users } from "lucide-react";

interface SidebarProps {
  channels: Channel[];
  activeChannel: string;
  onChannelSelect: (channelId: string) => void;
}

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export default function Sidebar({
  channels,
  activeChannel,
  onChannelSelect,
}: SidebarProps) {
  return (
    <motion.div
      className="w-80 bg-black/90 backdrop-blur-xl border-r border-gray-800/50 flex flex-col h-full"
      initial="hidden"
      animate="visible"
      variants={itemVariants}
    >
      {/* Header */}
      <motion.div
        className="p-6 border-b border-gray-800/50"
        variants={itemVariants}
      >
        <motion.div
          className="flex items-center mb-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Slacky
            </h1>
            <p className="text-sm text-gray-400">Postgres Assistant</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <motion.h2
            className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center"
            variants={itemVariants}
          >
            <Hash className="w-3 h-3 mr-2" />
            Channels
          </motion.h2>
          <div className="space-y-2">
            {channels.map((channel, index) => (
              <motion.button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-300 relative overflow-hidden",
                  activeChannel === channel.id
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/30"
                )}
                variants={itemVariants}
                whileHover={{
                  scale: 1.02,
                  x: 5,
                }}
                whileTap={{ scale: 0.98 }}
                custom={index}
              >
                {activeChannel === channel.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10"
                    layoutId="activeChannel"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10 flex items-center w-full">
                  <Hash className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                  {activeChannel === channel.id && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        className="p-6 border-t border-gray-800/50"
        variants={itemVariants}
      >
        <motion.div
          className="flex items-center space-x-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800/50"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Online</p>
            <p className="text-xs text-gray-400">Connected to Slack</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
