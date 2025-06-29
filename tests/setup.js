import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Setup in-memory MongoDB for tests
beforeAll(async () => {
  console.log('Starting MongoDB Memory Server...');
  
  // Create MongoDB memory server with timeout
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'test',
    },
  });
  
  const mongoUri = mongoServer.getUri();
  console.log('MongoDB Memory Server started:', mongoUri);
  
  // Disconnect if already connected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect with proper options
  await mongoose.connect(mongoUri, {
    bufferCommands: false,
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  
  console.log('Connected to MongoDB Memory Server');
}, 30000); // 30 second timeout

// Clean up after tests
afterAll(async () => {
  console.log('Cleaning up test database...');
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('Test cleanup complete');
}, 10000);

// Clear database between tests
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});