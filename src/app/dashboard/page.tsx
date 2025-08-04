"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chat from "@/components/Chat";
import AdminPanel from "@/components/AdminPanel";
import QueryLog from "@/components/QueryLog";
import {
  Settings,
  Database,
  MessageSquare,
  Home,
  Sparkles,
} from "lucide-react";

type View = "chat" | "admin" | "logs";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const navItemVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.95 },
};

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("chat");

  const navigation = [
    {
      id: "chat",
      name: "Chat Interface",
      icon: MessageSquare,
      color: "from-blue-500 to-purple-600",
    },
    {
      id: "admin",
      name: "Admin Panel",
      icon: Settings,
      color: "from-green-500 to-teal-600",
    },
    {
      id: "logs",
      name: "Query Logs",
      icon: Database,
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Fixed Top Navigation */}
      <motion.nav
        className="bg-black/90 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50 flex-shrink-0"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div className="flex items-center" variants={itemVariants}>
              <div className="relative">
                <Home className="w-8 h-8 text-white mr-3" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Slacky Dashboard
              </h1>
              <Sparkles className="w-5 h-5 ml-2 text-purple-400" />
            </motion.div>

            <motion.div className="flex space-x-2" variants={itemVariants}>
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    variants={navItemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    initial="rest"
                    animate="rest"
                    custom={index}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-lg"
                        layoutId="activeTab"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <motion.main
        className="flex-1 relative min-h-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {currentView === "chat" && <Chat />}
            {currentView === "admin" && <AdminPanel />}
            {currentView === "logs" && <QueryLog />}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
