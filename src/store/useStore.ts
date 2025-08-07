import { create } from "zustand";
import { ChatMessage, DatabaseConnection, DatabaseSchema } from "@/types";

interface Store {
  // Messages
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // Database Connections
  connections: DatabaseConnection[];
  addConnection: (connection: DatabaseConnection) => void;
  updateConnection: (connection: DatabaseConnection) => void;
  removeConnection: (connectionId: string) => void;
  activeConnection: DatabaseConnection | null;
  setActiveConnection: (connection: DatabaseConnection | null) => void;

  // Schemas
  schemas: { [connectionId: string]: DatabaseSchema };
  updateSchema: (connectionId: string, schema: DatabaseSchema) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: "chat" | "connections" | "schema" | "settings";
  setActiveTab: (tab: "chat" | "connections" | "schema" | "settings") => void;
}

export const useStore = create<Store>((set, get) => ({
  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),

  // Database Connections
  connections: [],
  addConnection: (connection) =>
    set((state) => ({
      connections: [...state.connections, connection],
    })),
  updateConnection: (connection) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === connection.id ? connection : c
      ),
    })),
  removeConnection: (connectionId) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connectionId),
      schemas: Object.fromEntries(
        Object.entries(state.schemas).filter(([id]) => id !== connectionId)
      ),
    })),
  activeConnection: null,
  setActiveConnection: (connection) => set({ activeConnection: connection }),

  // Schemas
  schemas: {},
  updateSchema: (connectionId, schema) => {
    console.log("=== STORE DEBUG ===");
    console.log("Updating schema for connection:", connectionId);
    console.log("Schema being stored:", schema);
    console.log("Schema type:", typeof schema);
    console.log("Schema keys:", Object.keys(schema || {}));
    console.log("=== END STORE DEBUG ===");
    set((state) => ({
      schemas: { ...state.schemas, [connectionId]: schema },
    }));
  },

  // UI State
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeTab: "chat",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
