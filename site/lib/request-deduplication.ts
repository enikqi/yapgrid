/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API requests by caching in-flight requests.
 * Multiple calls to the same endpoint will share the same promise.
 */

type PendingRequest = {
  promise: Promise<any>
  timestamp: number
}

// Cache of in-flight requests
const pendingRequests = new Map<string, PendingRequest>()

// Cache timeout - clear after 30 seconds
const CACHE_TIMEOUT = 30000

// Clean up old requests periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of pendingRequests.entries()) {
    if (now - value.timestamp > CACHE_TIMEOUT) {
      pendingRequests.delete(key)
    }
  }
}, CACHE_TIMEOUT)

/**
 * Deduplicated API call with JSON parsing
 * This is the main function to use - it handles both fetch and JSON parsing
 */
export async function deduplicatedApi<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // Create a unique key for this request
  const cacheKey = `${url}:${JSON.stringify(options || {})}`

  // Check if there's already a pending request for this
  const pending = pendingRequests.get(cacheKey)
  if (pending) {
    console.log(`[Dedup] Using cached request for ${url}`)
    return pending.promise
  }

  // Create new request with JSON parsing
  const promise = fetch(url, options)
    .then(response => response.json())
    .finally(() => {
      // Remove from pending after completion
      setTimeout(() => {
        pendingRequests.delete(cacheKey)
      }, 100)
    })

  // Store in pending requests
  pendingRequests.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  })

  return promise
}

/**
 * Deduplicated fetch - for when you need the raw Response object
 */
export async function deduplicatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // For Response objects, we can't share them (body can only be read once)
  // So we just do a regular fetch
  return fetch(url, options)
}

/**
 * Clear all pending requests (useful for testing or forced refresh)
 */
export function clearPendingRequests() {
  pendingRequests.clear()
}

/**
 * Get count of pending requests (for debugging)
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size
}

