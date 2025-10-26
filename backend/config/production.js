module.exports = {
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    }
  },

  // Redis (optional)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: false
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 120000 // 2 minutes
  },

  // Server
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: '7d',
    bcryptRounds: 12,
    sessionSecret: process.env.SESSION_SECRET
  },

  // File uploads
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    storageType: process.env.STORAGE_TYPE || 'local', // 'local' or 's3'
    localPath: './uploads'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: true,
    console: process.env.NODE_ENV !== 'production'
  },

  // Cache
  cache: {
    timeout: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    cleanupInterval: 60 * 1000 // 1 minute
  },

  // Queue (Bull)
  queue: {
    concurrency: 2, // Process 2 jobs at a time
    maxAttempts: 3,
    backoffDelay: 5000,
    removeOnComplete: 100,
    removeOnFail: 50
  }
};