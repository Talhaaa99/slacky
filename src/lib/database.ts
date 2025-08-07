import { Client } from "pg";
import { MongoClient } from "mongodb";
import { DatabaseConnection, DatabaseType } from "@/types";

// Only import MongoDB on server side
let MongoClientClass: any = null;
if (typeof window === "undefined") {
  // Server-side only
  const { MongoClient: MC } = require("mongodb");
  MongoClientClass = MC;
}

export async function testConnection(
  connection: DatabaseConnection
): Promise<boolean> {
  try {
    if (connection.type === "postgresql") {
      const client = new Client({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
      });
      await client.connect();
      await client.end();
      return true;
    } else if (connection.type === "mongodb" && MongoClientClass) {
      const uri = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
      const client = new MongoClientClass(uri);
      await client.connect();
      await client.close();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
}

export async function getPostgresSchema(connection: DatabaseConnection) {
  const client = new Client({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
  });

  try {
    await client.connect();

    // Get all tables
    const tablesQuery = `
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position
    `;

    const result = await client.query(tablesQuery);

    const tables: Record<string, any[]> = {};
    result.rows.forEach((row) => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        isPrimary: row.is_primary,
      });
    });

    // Return the correct schema structure
    return {
      tables: Object.entries(tables).map(([name, columns]) => ({
        name,
        columns,
      })),
    };
  } finally {
    await client.end();
  }
}

export async function getMongoSchema(connection: DatabaseConnection) {
  if (!MongoClientClass) {
    throw new Error("MongoDB not available on client side");
  }

  const uri = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  const client = new MongoClientClass(uri);

  try {
    await client.connect();
    const db = client.db(connection.database);
    const collections = await db.listCollections().toArray();

    const schemas = [];
    for (const collection of collections) {
      const sampleDoc = await db.collection(collection.name).findOne();
      const fields = sampleDoc
        ? Object.entries(sampleDoc).map(([key, value]) => ({
            name: key,
            type: typeof value,
            required: true, // We'll assume required for now
          }))
        : [];

      schemas.push({
        name: collection.name,
        fields,
      });
    }

    // Return the correct schema structure
    return {
      collections: schemas,
    };
  } finally {
    await client.close();
  }
}

export async function executeQuery(
  connection: DatabaseConnection,
  query: string
) {
  if (connection.type === "postgresql") {
    const client = new Client({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
    });

    try {
      await client.connect();
      const result = await client.query(query);
      return result.rows;
    } finally {
      await client.end();
    }
  } else if (connection.type === "mongodb" && MongoClientClass) {
    // For MongoDB, we'll need to parse the query differently
    // This is a simplified version - in practice you'd want a proper MongoDB query parser
    const client = new MongoClientClass(
      `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`
    );

    try {
      await client.connect();
      const db = client.db(connection.database);

      // This is a very basic implementation - you'd want proper MongoDB query parsing
      if (query.toLowerCase().includes("find")) {
        const collectionName = query.match(/db\.(\w+)\.find/)?.[1];
        if (collectionName) {
          const collection = db.collection(collectionName);
          return await collection.find({}).limit(100).toArray();
        }
      }

      return [];
    } finally {
      await client.close();
    }
  }

  return [];
}
