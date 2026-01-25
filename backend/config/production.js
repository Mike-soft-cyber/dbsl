module.exports = {
  
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

  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: false
  },

  
  rateLimit: {
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 120000 
  },

  
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

  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: '7d',
    bcryptRounds: 12,
    sessionSecret: process.env.SESSION_SECRET
  },

  
  uploads: {
    maxFileSize: 10 * 1024 * 1024, 
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    storageType: process.env.STORAGE_TYPE || 'local', 
    localPath: './uploads'
  },

  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: true,
    console: process.env.NODE_ENV !== 'production'
  },

  
  cache: {
    timeout: 5 * 60 * 1000, 
    maxSize: 1000,
    cleanupInterval: 60 * 1000 
  },

  
  queue: {
    concurrency: 2, 
    maxAttempts: 3,
    backoffDelay: 5000,
    removeOnComplete: 100,
    removeOnFail: 50
  }
};