export interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

export interface Channel {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ChatState {
  channels: Channel[];
  messages: Record<string, Message[]>;
  activeChannel: string;
}

export interface SQLQueryResponse {
  query: string;
  result: unknown;
  error?: string;
}

export interface HuggingFaceResponse {
  generated_text: string;
}
