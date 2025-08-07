import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DatabaseConnection, ChatMessage, DatabaseSchema } from "@/types";

interface AppState {
  // Database connections
  connections: DatabaseConnection[];
  activeConnection: DatabaseConnection | null;
  schemas: Record<string, DatabaseSchema>;

  // Chat state
  messages: ChatMessage[];
  isLoading: boolean;

  // UI state
  sidebarOpen: boolean;
  onboardingStep: number;
  activeTab: "chat" | "connections" | "schema" | "settings";

  // Actions
  addConnection: (connection: DatabaseConnection) => void;
  updateConnection: (id: string, connection: DatabaseConnection) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (connection: DatabaseConnection | null) => void;
  updateSchema: (connectionId: string, schema: DatabaseSchema) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setOnboardingStep: (step: number) => void;
  setActiveTab: (tab: "chat" | "connections" | "schema" | "settings") => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      connections: [],
      activeConnection: null,
      schemas: {},
      messages: [],
      isLoading: false,
      sidebarOpen: true,
      onboardingStep: 0,
      activeTab: "chat",

      // Actions
      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      updateConnection: (id, connection) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? connection : c
          ),
          activeConnection:
            state.activeConnection?.id === id
              ? connection
              : state.activeConnection,
        })),

      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          activeConnection:
            state.activeConnection?.id === id ? null : state.activeConnection,
        })),

      setActiveConnection: (connection) =>
        set({ activeConnection: connection }),

      updateSchema: (connectionId, schema) =>
        set((state) => ({
          schemas: { ...state.schemas, [connectionId]: schema },
        })),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      clearMessages: () => set({ messages: [] }),

      setLoading: (loading) => set({ isLoading: loading }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "database-assistant-storage",
      partialize: (state) => ({
        connections: state.connections,
        activeConnection: state.activeConnection,
        schemas: state.schemas,
        onboardingStep: state.onboardingStep,
        activeTab: state.activeTab,
      }),
    }
  )
);
