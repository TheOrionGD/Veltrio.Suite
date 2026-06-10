import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { connectToDatabase, getDb, runInTransaction } from './services/db';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mongoUrl = env.VITE_MONGODB_URL;
  const dbName = env.VITE_MONGODB_DB_NAME || 'VELTRIO';

  // Connect to database on dev server startup
  if (mongoUrl) {
    connectToDatabase(mongoUrl, dbName).catch((err) => {
      console.error('[MongoDB] Failed to connect on startup:', err);
    });
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'mongodb-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              try {
                const db = getDb();
                const url = new URL(req.url, 'http://localhost');
                const pathParts = url.pathname.replace(/^\/api\//, '').split('/');
                const resource = pathParts[0];
                const action = pathParts[1];

                const sendJSON = (status: number, data: any) => {
                  res.writeHead(status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(data));
                };

                const getBody = (): Promise<any> => {
                  return new Promise((resolve) => {
                    let chunk = '';
                    req.on('data', (c) => { chunk += c; });
                    req.on('end', () => {
                      try {
                        resolve(chunk ? JSON.parse(chunk) : {});
                      } catch {
                        resolve({});
                      }
                    });
                  });
                };

                // Authentication Routing
                if (resource === 'auth') {
                  if (action === 'signup' && req.method === 'POST') {
                    const body = await getBody();
                    const { name, email, password } = body;
                    if (!name || !email || !password) {
                      return sendJSON(400, { error: 'Missing name, email, or password credentials.' });
                    }

                    try {
                      // ACID Transaction: Create user profile and their default project workspace folder
                      const result = await runInTransaction(async (session) => {
                        const usersColl = db.collection('users');
                        const projColl = db.collection('projects');

                        const existing = await usersColl.findOne({ email }, { session });
                        if (existing) {
                          throw new Error('User record already exists.');
                        }

                        const userInsert = await usersColl.insertOne({
                          name,
                          email,
                          password,
                          createdAt: Date.now(),
                          preferences: {
                            theme: 'dark',
                            accentColor: 'teal',
                            motionControl: true,
                            notificationsEnabled: true
                          }
                        }, { session });

                        const userId = userInsert.insertedId.toString();

                        // Add default workspace project folder
                        await projColl.insertOne({
                          userId,
                          name: 'Default Workspace',
                          description: 'Standard translation directory folder.',
                          createdAt: Date.now(),
                          sessionsCount: 0,
                          tags: ['General']
                        }, { session });

                        // Seed default files for database-driven file list
                        const filesColl = db.collection('files');
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
                        ], { session });

                        // Seed default notifications for database-driven system
                        const notifColl = db.collection('notifications');
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
                        ], { session });

                        return { id: userId, name, email };
                      });

                      return sendJSON(200, { success: true, user: result });
                    } catch (txErr: any) {
                      return sendJSON(400, { error: txErr.message || 'Signup transaction failed.' });
                    }
                  }

                  if (action === 'login' && req.method === 'POST') {
                    const body = await getBody();
                    const { email, password } = body;
                    const usersColl = db.collection('users');
                    const user = await usersColl.findOne({ email, password });
                    if (!user) {
                      return sendJSON(400, { error: 'Invalid email or password.' });
                    }
                    return sendJSON(200, {
                      success: true,
                      user: {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        preferences: user.preferences
                      }
                    });
                  }
                }

                // Profile Configuration Endpoint
                if (resource === 'profile') {
                  const usersColl = db.collection('users');
                  if (req.method === 'GET') {
                    const userId = url.searchParams.get('userId');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    const { ObjectId } = await import('mongodb');
                    const user = await usersColl.findOne({ _id: new ObjectId(userId) });
                    if (!user) return sendJSON(404, { error: 'User not found.' });
                    return sendJSON(200, {
                      name: user.name,
                      email: user.email,
                      preferences: user.preferences
                    });
                  }

                  if (req.method === 'POST') {
                    const body = await getBody();
                    const { userId, name, email, preferences } = body;
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    const { ObjectId } = await import('mongodb');
                    await usersColl.updateOne(
                      { _id: new ObjectId(userId) },
                      { $set: { name, email, preferences } }
                    );
                    return sendJSON(200, { success: true });
                  }
                }

                // History Logger Endpoint
                if (resource === 'history') {
                  const historyColl = db.collection('history');
                  if (req.method === 'GET') {
                    const userId = url.searchParams.get('userId');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    const logs = await historyColl.find({ userId }).sort({ timestamp: -1 }).toArray();
                    const formatted = logs.map(l => ({
                      id: l._id.toString(),
                      inputText: l.inputText,
                      translatedText: l.translatedText,
                      sentiment: l.sentiment,
                      targetLanguage: l.targetLanguage,
                      targetLanguageName: l.targetLanguageName,
                      timestamp: l.timestamp,
                      qualityScore: l.qualityScore,
                      clarityScore: l.clarityScore,
                      detectedLanguageName: l.detectedLanguageName
                    }));
                    return sendJSON(200, formatted);
                  }

                  if (req.method === 'POST') {
                    const body = await getBody();
                    await historyColl.insertOne({
                      userId: body.userId,
                      inputText: body.inputText,
                      translatedText: body.translatedText,
                      sentiment: body.sentiment,
                      targetLanguage: body.targetLanguage,
                      targetLanguageName: body.targetLanguageName,
                      timestamp: body.timestamp || Date.now(),
                      qualityScore: body.qualityScore,
                      clarityScore: body.clarityScore,
                      detectedLanguageName: body.detectedLanguageName
                    });
                    return sendJSON(200, { success: true });
                  }

                  if (req.method === 'DELETE') {
                    const userId = url.searchParams.get('userId');
                    const id = url.searchParams.get('id');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    if (id) {
                      const { ObjectId } = await import('mongodb');
                      await historyColl.deleteOne({ userId, _id: new ObjectId(id) });
                    } else {
                      await historyColl.deleteMany({ userId });
                    }
                    return sendJSON(200, { success: true });
                  }
                }

                // Projects Workspace Endpoint
                if (resource === 'projects') {
                  const projColl = db.collection('projects');
                  if (req.method === 'GET') {
                    const userId = url.searchParams.get('userId');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    const projects = await projColl.find({ userId }).sort({ createdAt: -1 }).toArray();
                    const formatted = projects.map(p => ({
                      id: p._id.toString(),
                      name: p.name,
                      description: p.description,
                      createdAt: p.createdAt,
                      sessionsCount: p.sessionsCount,
                      tags: p.tags
                    }));
                    return sendJSON(200, formatted);
                  }

                  if (req.method === 'POST') {
                    const body = await getBody();
                    await projColl.insertOne({
                      userId: body.userId,
                      name: body.name,
                      description: body.description,
                      createdAt: Date.now(),
                      sessionsCount: 0,
                      tags: body.tags || []
                    });
                    return sendJSON(200, { success: true });
                  }

                  if (req.method === 'DELETE') {
                    const userId = url.searchParams.get('userId');
                    const id = url.searchParams.get('id');
                    if (!userId || !id) return sendJSON(400, { error: 'Missing parameters.' });
                    const { ObjectId } = await import('mongodb');
                    await projColl.deleteOne({ userId, _id: new ObjectId(id) });
                    return sendJSON(200, { success: true });
                  }
                }

                // Files Endpoint
                if (resource === 'files') {
                  const filesColl = db.collection('files');
                  if (req.method === 'GET') {
                    const userId = url.searchParams.get('userId');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    const list = await filesColl.find({ userId }).sort({ uploadedAt: -1 }).toArray();
                    const formatted = list.map(f => ({
                      id: f._id.toString(),
                      name: f.name,
                      size: f.size,
                      type: f.type,
                      uploadedAt: f.uploadedAt,
                      content: f.content,
                      translatedContent: f.translatedContent,
                      status: f.status
                    }));
                    return sendJSON(200, formatted);
                  }

                  if (req.method === 'POST') {
                    const body = await getBody();
                    const insertResult = await filesColl.insertOne({
                      userId: body.userId,
                      name: body.name,
                      size: body.size,
                      type: body.type,
                      uploadedAt: body.uploadedAt || Date.now(),
                      content: body.content,
                      translatedContent: body.translatedContent || '',
                      status: body.status || 'idle'
                    });
                    return sendJSON(200, { success: true, id: insertResult.insertedId.toString() });
                  }

                  if (req.method === 'PUT') {
                    const userId = url.searchParams.get('userId');
                    const id = url.searchParams.get('id');
                    if (!userId || !id) return sendJSON(400, { error: 'Missing parameters.' });
                    const body = await getBody();
                    const { ObjectId } = await import('mongodb');
                    const updateDoc: any = {};
                    if (body.status !== undefined) updateDoc.status = body.status;
                    if (body.translatedContent !== undefined) updateDoc.translatedContent = body.translatedContent;
                    await filesColl.updateOne(
                      { userId, _id: new ObjectId(id) },
                      { $set: updateDoc }
                    );
                    return sendJSON(200, { success: true });
                  }

                  if (req.method === 'DELETE') {
                    const userId = url.searchParams.get('userId');
                    const id = url.searchParams.get('id');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    if (id) {
                      const { ObjectId } = await import('mongodb');
                      await filesColl.deleteOne({ userId, _id: new ObjectId(id) });
                    } else {
                      await filesColl.deleteMany({ userId });
                    }
                    return sendJSON(200, { success: true });
                  }
                }

                // Notifications Endpoint
                if (resource === 'notifications') {
                  const notifColl = db.collection('notifications');
                  if (req.method === 'GET') {
                    const userId = url.searchParams.get('userId');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    const list = await notifColl.find({ userId }).sort({ timestamp: -1 }).toArray();
                    const formatted = list.map(n => ({
                      id: n._id.toString(),
                      title: n.title,
                      message: n.message,
                      timestamp: n.timestamp,
                      read: n.read,
                      type: n.type
                    }));
                    return sendJSON(200, formatted);
                  }

                  if (req.method === 'POST') {
                    const body = await getBody();
                    await notifColl.insertOne({
                      userId: body.userId,
                      title: body.title,
                      message: body.message,
                      timestamp: body.timestamp || Date.now(),
                      read: body.read || false,
                      type: body.type || 'info'
                    });
                    return sendJSON(200, { success: true });
                  }

                  if (req.method === 'PUT') {
                    const userId = url.searchParams.get('userId');
                    const id = url.searchParams.get('id');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    const body = await getBody();
                    const { ObjectId } = await import('mongodb');
                    const updateQuery: any = { userId };
                    if (id) {
                      updateQuery._id = new ObjectId(id);
                    }
                    await notifColl.updateMany(
                      updateQuery,
                      { $set: { read: body.read !== undefined ? body.read : true } }
                    );
                    return sendJSON(200, { success: true });
                  }

                  if (req.method === 'DELETE') {
                    const userId = url.searchParams.get('userId');
                    const id = url.searchParams.get('id');
                    if (!userId) return sendJSON(400, { error: 'Missing userId parameter.' });
                    if (id) {
                      const { ObjectId } = await import('mongodb');
                      await notifColl.deleteOne({ userId, _id: new ObjectId(id) });
                    } else {
                      await notifColl.deleteMany({ userId });
                    }
                    return sendJSON(200, { success: true });
                  }
                }

                return sendJSON(404, { error: 'REST API route not found.' });
              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message || 'Database connection error occurred.' }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
