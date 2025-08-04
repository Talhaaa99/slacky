export interface SlackEvent {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
}

export interface SlackMessage {
  channel: string;
  thread_ts?: string;
  text: string;
}

export interface QueryLog {
  id: string;
  timestamp: Date;
  user: string;
  channel: string;
  originalQuery: string;
  generatedSQL: string;
  result: unknown;
  error?: string;
  executionTime: number;
}

export interface AdminConfig {
  slackBotToken: string;
  slackSigningSecret: string;
  databaseUrl: string;
  huggingfaceApiKey: string;
}

export interface SlackBotStatus {
  isConnected: boolean;
  channels: string[];
  lastActivity: Date;
  totalQueries: number;
  errorRate: number;
}
