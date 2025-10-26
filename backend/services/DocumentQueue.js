const Queue = require('bull');
const DocumentGeneratorFactory = require('./DocumentGeneratorFactory');
const Document = require('../models/Document');
const User = require('../models/User');

// Create queue for document generation
const documentQueue = new Queue('document-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // Start with 5 second delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50 // Keep last 50 failed jobs
  }
});

// Process document generation jobs
documentQueue.process('generate', async (job) => {
  const { type, requestData, cbcEntry, userId } = job.data;
  
  console.log(`[Queue] Processing job ${job.id} - ${type} for ${requestData.grade} ${requestData.learningArea}`);
  
  try {
    // Update job progress
    await job.progress(10);
    
    // Generate document
    const document = await DocumentGeneratorFactory.generate(type, requestData, cbcEntry);
    
    await job.progress(90);
    
    // Update user statistics
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { documentsCreated: 1 }
      });
    }
    
    await job.progress(100);
    
    console.log(`[Queue] Job ${job.id} completed successfully - Document ${document._id}`);
    
    return {
      success: true,
      documentId: document._id,
      document: {
        _id: document._id,
        type: document.type,
        grade: document.grade,
        subject: document.subject,
        status: document.status
      }
    };
    
  } catch (error) {
    console.error(`[Queue] Job ${job.id} failed:`, error);
    throw error; // Bull will handle retries
  }
});

// Event listeners for monitoring
documentQueue.on('completed', (job, result) => {
  console.log(`[Queue] ✅ Job ${job.id} completed`);
});

documentQueue.on('failed', (job, error) => {
  console.error(`[Queue] ❌ Job ${job.id} failed:`, error.message);
});

documentQueue.on('stalled', (job) => {
  console.warn(`[Queue] ⚠️ Job ${job.id} stalled`);
});

documentQueue.on('progress', (job, progress) => {
  console.log(`[Queue] 📊 Job ${job.id} progress: ${progress}%`);
});

// Health check for queue
documentQueue.on('error', (error) => {
  console.error('[Queue] Queue error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Queue] Shutting down gracefully...');
  await documentQueue.close();
  process.exit(0);
});

// Queue management functions
class DocumentQueueManager {
  /**
   * Add document generation job to queue
   */
  static async addGenerationJob(type, requestData, cbcEntry, userId = null) {
    const job = await documentQueue.add('generate', {
      type,
      requestData,
      cbcEntry,
      userId,
      timestamp: Date.now()
    }, {
      priority: this.getPriority(type),
      timeout: 300000 // 5 minute timeout per job
    });
    
    console.log(`[Queue] Added job ${job.id} - ${type}`);
    
    return {
      jobId: job.id,
      status: 'queued',
      estimatedTime: this.estimateCompletionTime(type)
    };
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId) {
    const job = await documentQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found' };
    }
    
    const state = await job.getState();
    const progress = job.progress();
    
    return {
      jobId: job.id,
      status: state,
      progress,
      data: job.data,
      result: await job.finished().catch(() => null),
      failedReason: job.failedReason,
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    };
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId) {
    const job = await documentQueue.getJob(jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    const state = await job.getState();
    
    if (state === 'completed') {
      return { success: false, error: 'Job already completed' };
    }
    
    await job.remove();
    console.log(`[Queue] Cancelled job ${jobId}`);
    
    return { success: true };
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      documentQueue.getWaitingCount(),
      documentQueue.getActiveCount(),
      documentQueue.getCompletedCount(),
      documentQueue.getFailedCount(),
      documentQueue.getDelayedCount()
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  /**
   * Clean old jobs
   */
  static async cleanOldJobs() {
    await documentQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 24 hours
    await documentQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 7 days
    console.log('[Queue] Cleaned old jobs');
  }

  /**
   * Pause/Resume queue
   */
  static async pauseQueue() {
    await documentQueue.pause();
    console.log('[Queue] Queue paused');
  }

  static async resumeQueue() {
    await documentQueue.resume();
    console.log('[Queue] Queue resumed');
  }

  /**
   * Get priority based on document type
   */
  static getPriority(type) {
    const priorities = {
      'Lesson Plan': 1,        // Highest priority
      'Lesson Notes': 2,
      'Exercises': 3,
      'Schemes of Work': 4,
      'Lesson Concept Breakdown': 5
    };
    return priorities[type] || 5;
  }

  /**
   * Estimate completion time
   */
  static estimateCompletionTime(type) {
    const estimates = {
      'Lesson Plan': '2-3 minutes',
      'Lesson Notes': '3-5 minutes',
      'Exercises': '2-3 minutes',
      'Schemes of Work': '4-6 minutes',
      'Lesson Concept Breakdown': '3-4 minutes'
    };
    return estimates[type] || '3-5 minutes';
  }
}

module.exports = { documentQueue, DocumentQueueManager };