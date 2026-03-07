// utils/rateLimiter.js

// In-memory store (simple & fast)
// Later you can move this to Redis if needed
const rateLimitStore = new Map();

// Config
const MAX_MESSAGES = 10;
const WINDOW_TIME = 5 * 60 * 1000; // 5 minutes in ms

/**
 * Check if phone number is allowed to send message
 * @param {string} phone
 * @returns {boolean} true = allowed, false = rate limited
 */
function isAllowed(phone) {
  const now = Date.now();

  if (!rateLimitStore.has(phone)) {
    rateLimitStore.set(phone, {
      count: 1,
      firstRequestTime: now,
    });
    return true;
  }

  const data = rateLimitStore.get(phone);

  // Reset window if time passed
  if (now - data.firstRequestTime > WINDOW_TIME) {
    rateLimitStore.set(phone, {
      count: 1,
      firstRequestTime: now,
    });
    return true;
  }

  // Within window
  if (data.count >= MAX_MESSAGES) {
    return false;
  }

  data.count += 1;
  rateLimitStore.set(phone, data);
  return true;
}

export default {
  isAllowed,
};
