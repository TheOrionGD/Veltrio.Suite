import { MongoClient, Db, ClientSession } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function seedDefaultData(database: Db) {
  try {
    const usersColl = database.collection('users');
    const defaultEmail = 'veltrio@gmail.com';
    const existingUser = await usersColl.findOne({ email: defaultEmail });

    if (!existingUser) {
      console.log(`[MongoDB] Seeding default operator user: ${defaultEmail}`);
      
      const userInsert = await usersColl.insertOne({
        name: 'Veltrio Operator',
        email: defaultEmail,
        password: 'veltrio.in',
        createdAt: Date.now(),
        preferences: {
          theme: 'dark',
          accentColor: 'teal',
          motionControl: true,
          notificationsEnabled: true
        }
      });
      const userId = userInsert.insertedId.toString();

      // Seed default workspace project folder
      const projColl = database.collection('projects');
      await projColl.insertOne({
        userId,
        name: 'Default Workspace',
        description: 'Standard translation directory folder.',
        createdAt: Date.now(),
        sessionsCount: 0,
        tags: ['General']
      });

      // Seed default files
      const filesColl = database.collection('files');
      await filesColl.insertMany([
        {
          userId,
          name: 'annual_report_draft.txt',
          size: 4096,
          type: 'text/plain',
          uploadedAt: Date.now() - 3600000 * 2,
          content: 'Veltrio Enterprise Suite is set to capture multilingual audio in Q3. This will enhance real-time global alignment.',
          translatedContent: 'Veltrio Enterprise Suite está preparado para capturar audio multilingüe en el tercer trimestre. Esto mejorará la alineación global en tiempo real.',
          status: 'completed',
        },
        {
          userId,
          name: 'product_specs.txt',
          size: 1024,
          type: 'text/plain',
          uploadedAt: Date.now() - 3600000 * 18,
          content: 'Whisper-v3 runs locally and via APIs at 16khz audio sampling rates. Latency bounds are strictly under 140ms.',
          status: 'idle',
        }
      ]);

      // Seed default notifications
      const notifColl = database.collection('notifications');
      await notifColl.insertMany([
        {
          userId,
          title: 'Welcome to Veltrio Upgrade',
          message: 'Explore the new Workspace Center dashboard, file managers, local settings, and analytical statistics!',
          timestamp: Date.now(),
          read: false,
          type: 'info',
        },
        {
          userId,
          title: 'Groq API Active',
          message: 'Whisper-v3 acoustic capture and neural styles pipeline is ready.',
          timestamp: Date.now() - 60000,
          read: true,
          type: 'success',
        }
      ]);

      console.log('[MongoDB] Seeding default operator database entries completed successfully.');
    } else {
      console.log(`[MongoDB] Default operator ${defaultEmail} already exists. Skipping seeding.`);
    }
  } catch (err) {
    console.error('[MongoDB] Failed to seed default database values on startup:', err);
  }
}

export async function connectToDatabase(url: string, dbName: string) {
  if (client) return { client, db: db! };

  client = new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  console.log(`[MongoDB] Connected to database: ${dbName}`);
  await seedDefaultData(db);
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
