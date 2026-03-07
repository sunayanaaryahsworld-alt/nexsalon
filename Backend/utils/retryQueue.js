// utils/retryQueue.js

const retryQueue = [];
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 30 * 1000; // 30 seconds

/**
 * Add failed task to retry queue
 * @param {Function} task - async function to retry
 * @param {number} retryCount
 */
function addToRetry(task, retryCount = 0) {
  if (retryCount >= MAX_RETRIES) {
    console.error("❌ Max retries reached, discarding task");
    return;
  }

  retryQueue.push({
    task,
    retryCount,
    lastTriedAt: Date.now(),
  });

  console.log("🔁 Task added to retry queue");
}

/**
 * Process retry queue
 */
async function processRetryQueue() {
  if (retryQueue.length === 0) return;

  for (let i = 0; i < retryQueue.length; i++) {
    const item = retryQueue[i];

    // Wait interval before retry
    if (Date.now() - item.lastTriedAt < RETRY_INTERVAL) continue;

    try {
      await item.task();
      console.log("✅ Retry successful");
      retryQueue.splice(i, 1);
      i--;
    } catch (err) {
      item.retryCount += 1;
      item.lastTriedAt = Date.now();
      console.error("🔁 Retry failed, will retry again");
    }
  }
}

// Auto-process retry queue every 15 seconds
setInterval(processRetryQueue, 15 * 1000);

export default {
  addToRetry,
};
