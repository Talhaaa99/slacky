export type DatabaseType = "postgresql" | "mongodb";

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  encrypted: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
}

export interface CollectionSchema {
  name: string;
  fields: FieldSchema[];
}

export interface FieldSchema {
  name: string;
  type: string;
  required: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  queryData?: {
    query: string;
    results: any[];
    rawResponse: any;
  };
}

export interface TableMapping {
  [key: string]: string; // semantic name -> actual table name
}

export interface DatabaseSchema {
  tables?: TableSchema[];
  collections?: CollectionSchema[];
  mapping: TableMapping;
}
