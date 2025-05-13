/**
 * Key Manager for handling multiple Together AI API keys
 * This class manages a pool of API keys, tracks their usage,
 * and provides strategies for key selection and rotation.
 */

export interface ApiKeyStats {
  key: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rateLimitHits: number
  lastUsed: number
  isRateLimited: boolean
  cooldownUntil: number
  inUse: boolean // Track if key is currently being used
}

export class KeyManager {
  private keys: ApiKeyStats[] = []
  private currentKeyIndex = 0

  constructor(initialKeys: string[] = []) {
    // Initialize with the environment variable key
    const envKey = process.env.TOGETHER_AI_API_KEY
    if (envKey) {
      this.addKey(envKey)
    }

    // Add any additional keys provided
    initialKeys.forEach((key) => {
      if (key && key !== envKey) {
        this.addKey(key)
      }
    })
  }

  /**
   * Add a new API key to the pool
   */
  public addKey(key: string): void {
    // Check if key already exists
    if (this.keys.some((k) => k.key === key)) {
      return
    }

    this.keys.push({
      key,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      lastUsed: 0,
      isRateLimited: false,
      cooldownUntil: 0,
      inUse: false,
    })
  }

  /**
   * Remove an API key from the pool
   */
  public removeKey(key: string): void {
    this.keys = this.keys.filter((k) => k.key !== key)
    // Reset current index if needed
    if (this.currentKeyIndex >= this.keys.length && this.keys.length > 0) {
      this.currentKeyIndex = 0
    }
  }

  /**
   * Get all available API keys for concurrent processing
   * Returns an array of keys that are not rate limited
   */
  public getAllAvailableKeys(): string[] {
    const now = Date.now()
    return this.keys
      .filter((keyStats) => {
        // Skip keys that are in cooldown or already in use
        if ((keyStats.isRateLimited && keyStats.cooldownUntil > now) || keyStats.inUse) {
          return false
        }

        // If the key was rate limited but cooldown has expired, reset its status
        if (keyStats.isRateLimited && keyStats.cooldownUntil <= now) {
          keyStats.isRateLimited = false
        }

        return true
      })
      .map((keyStats) => keyStats.key)
  }

  /**
   * Reserve a specific key for use
   * Returns true if the key was successfully reserved, false otherwise
   */
  public reserveKey(key: string): boolean {
    const keyStats = this.keys.find((k) => k.key === key)
    if (!keyStats || keyStats.inUse || (keyStats.isRateLimited && keyStats.cooldownUntil > Date.now())) {
      return false
    }

    keyStats.inUse = true
    keyStats.lastUsed = Date.now()
    keyStats.totalRequests++
    return true
  }

  /**
   * Release a key after use
   */
  public releaseKey(key: string): void {
    const keyStats = this.keys.find((k) => k.key === key)
    if (keyStats) {
      keyStats.inUse = false
    }
  }

  /**
   * Get the next available API key using a round-robin strategy
   * with consideration for rate limits and cooldowns
   */
  public getNextKey(): string | null {
    if (this.keys.length === 0) {
      return null
    }

    const now = Date.now()

    // Try to find a key that's not rate limited and not in use
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentKeyIndex + i) % this.keys.length
      const keyStats = this.keys[index]

      // Skip keys that are in cooldown or in use
      if ((keyStats.isRateLimited && keyStats.cooldownUntil > now) || keyStats.inUse) {
        continue
      }

      // If the key was rate limited but cooldown has expired, reset its status
      if (keyStats.isRateLimited && keyStats.cooldownUntil <= now) {
        keyStats.isRateLimited = false
      }

      // Update the current index for next time
      this.currentKeyIndex = (index + 1) % this.keys.length

      // Update last used time and mark as in use
      keyStats.lastUsed = now
      keyStats.totalRequests++
      keyStats.inUse = true

      return keyStats.key
    }

    // If all keys are rate limited or in use, return the one with the earliest cooldown expiration
    // that is not in use
    const availableKeys = this.keys.filter((key) => !key.inUse)
    if (availableKeys.length === 0) {
      return null // All keys are in use
    }

    const earliestKey = availableKeys.reduce((earliest, current) => {
      return current.cooldownUntil < earliest.cooldownUntil ? current : earliest
    }, availableKeys[0])

    // If the earliest cooldown is in the future, return null to indicate waiting is needed
    if (earliestKey.cooldownUntil > now) {
      return null
    }

    // Reset rate limit status and use this key
    earliestKey.isRateLimited = false
    earliestKey.lastUsed = now
    earliestKey.totalRequests++
    earliestKey.inUse = true

    return earliestKey.key
  }

  /**
   * Mark a key as successful and release it
   */
  public markSuccess(key: string): void {
    const keyStats = this.keys.find((k) => k.key === key)
    if (keyStats) {
      keyStats.successfulRequests++
      keyStats.inUse = false
    }
  }

  /**
   * Mark a key as failed and release it
   */
  public markFailed(key: string, isRateLimit = false): void {
    const keyStats = this.keys.find((k) => k.key === key)
    if (keyStats) {
      keyStats.failedRequests++
      keyStats.inUse = false

      if (isRateLimit) {
        keyStats.rateLimitHits++
        keyStats.isRateLimited = true
        // Set a cooldown period of 60 seconds for rate limited keys
        keyStats.cooldownUntil = Date.now() + 60000
      }
    }
  }

  /**
   * Get statistics for all keys
   */
  public getStats(): ApiKeyStats[] {
    return [...this.keys]
  }

  /**
   * Get the number of available (not rate-limited and not in use) keys
   */
  public getAvailableKeyCount(): number {
    const now = Date.now()
    return this.keys.filter((k) => (!k.isRateLimited || k.cooldownUntil <= now) && !k.inUse).length
  }

  /**
   * Get the total number of keys
   */
  public getTotalKeyCount(): number {
    return this.keys.length
  }

  /**
   * Check if a specific key is available (not rate-limited and not in use)
   */
  public isKeyAvailable(key: string): boolean {
    const keyStats = this.keys.find((k) => k.key === key)
    if (!keyStats) return false

    const now = Date.now()
    return (!keyStats.isRateLimited || keyStats.cooldownUntil <= now) && !keyStats.inUse
  }

  /**
   * Get the time until the next key becomes available (in milliseconds)
   * Returns 0 if a key is already available
   */
  public getTimeUntilNextKeyAvailable(): number {
    if (this.getAvailableKeyCount() > 0) return 0

    const now = Date.now()
    // Find the earliest time when a key will be available (either from cooldown or in-use)
    const earliestCooldown = Math.min(...this.keys.map((k) => k.cooldownUntil))
    return Math.max(0, earliestCooldown - now)
  }
}

// Create a singleton instance
let keyManagerInstance: KeyManager | null = null

export function getKeyManager(): KeyManager {
  // In server environment, always create a new instance
  // to avoid sharing state between requests
  if (typeof window === "undefined") {
    return new KeyManager()
  }

  // In browser, use singleton pattern
  if (!keyManagerInstance) {
    keyManagerInstance = new KeyManager()
  }
  return keyManagerInstance
}

// Mask API key for privacy in logs
export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return "***"
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
}
