import { MongoClient, Db, ClientSession } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(url: string, dbName: string) {
  if (client) return { client, db: db! };

  client = new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  console.log(`[MongoDB] Connected to database: ${dbName}`);
  return { client, db };
}

export function getDb() {
  if (!db) throw new Error("Database not connected. Call connectToDatabase first.");
  return db;
}

export function getClient() {
  if (!client) throw new Error("Database client not connected. Call connectToDatabase first.");
  return client;
}

// Wrap database operations in an ACID transaction
export async function runInTransaction<T>(
  operations: (session: ClientSession) => Promise<T>
): Promise<T> {
  const localClient = getClient();
  const session = localClient.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await operations(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
