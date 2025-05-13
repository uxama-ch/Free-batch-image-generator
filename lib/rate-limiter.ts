/**
 * A token bucket rate limiter implementation
 * This helps ensure we don't exceed API rate limits
 */
export class RateLimiter {
  private tokens: number
  private lastRefillTime: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per ms
  private readonly bufferFactor: number // Safety buffer to avoid hitting rate limits
  private readonly modelName: string

  /**
   * Create a new rate limiter
   * @param tokensPerInterval Number of tokens (requests) allowed per interval
   * @param intervalMs The interval in milliseconds
   * @param bufferFactor Safety buffer factor (0.8 means use 80% of the rate limit)
   * @param modelName The name of the model being rate limited
   */
  constructor(tokensPerInterval: number, intervalMs: number, bufferFactor = 0.8, modelName = "") {
    this.maxTokens = tokensPerInterval * bufferFactor
    this.tokens = this.maxTokens
    this.lastRefillTime = Date.now()
    this.refillRate = this.maxTokens / intervalMs
    this.bufferFactor = bufferFactor
    this.modelName = modelName
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const elapsedTime = now - this.lastRefillTime

    // Calculate tokens to add based on elapsed time
    const tokensToAdd = elapsedTime * this.refillRate

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefillTime = now
    }
  }

  /**
   * Wait for a token to become available
   * @returns The time in ms to wait, or 0 if a token is immediately available
   */
  async waitForToken(): Promise<number> {
    this.refill()

    if (this.tokens >= 1) {
      // Token available immediately
      this.tokens -= 1
      return 0
    }

    // Calculate time until next token is available
    // Add a small buffer to ensure we don't hit rate limits
    const waitTime = Math.ceil((1 - this.tokens) / this.refillRate) + 500

    // Return the wait time so the caller can decide how to handle it
    return waitTime
  }

  /**
   * Handle a rate limit error by forcing a longer cooldown period
   * @param seconds Number of seconds to force cooldown
   */
  handleRateLimitError(seconds = 15): void {
    // Set tokens to a negative value that will require waiting
    // This effectively forces a cooldown period
    this.tokens = -seconds * this.refillRate
    this.lastRefillTime = Date.now()
  }

  /**
   * Try to take a token immediately
   * @returns true if a token was available, false otherwise
   */
  tryTake(): boolean {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Get the number of tokens currently available
   */
  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }

  /**
   * Get the model name associated with this rate limiter
   */
  getModelName(): string {
    return this.modelName
  }
}

/**
 * A global rate limiter for model-specific rate limits
 * This ensures we don't exceed the model's rate limit across all API keys
 */
export class ModelRateLimiter {
  private static instance: ModelRateLimiter
  private rateLimiters: Map<string, RateLimiter> = new Map()

  private constructor() {
    // Initialize with known model rate limits
    this.addModel("black-forest-labs/FLUX.1-schnell-Free", 6, 60000, 0.7)
  }

  public static getInstance(): ModelRateLimiter {
    if (!ModelRateLimiter.instance) {
      ModelRateLimiter.instance = new ModelRateLimiter()
    }
    return ModelRateLimiter.instance
  }

  /**
   * Add a model with its rate limit
   * @param modelId The model identifier
   * @param tokensPerInterval Number of tokens (requests) allowed per interval
   * @param intervalMs The interval in milliseconds
   * @param bufferFactor Safety buffer factor
   */
  public addModel(modelId: string, tokensPerInterval: number, intervalMs: number, bufferFactor = 0.8): void {
    if (!this.rateLimiters.has(modelId)) {
      this.rateLimiters.set(modelId, new RateLimiter(tokensPerInterval, intervalMs, bufferFactor, modelId))
    }
  }

  /**
   * Get a rate limiter for a specific model
   * @param modelId The model identifier
   * @returns The rate limiter for the model, or undefined if not found
   */
  public getRateLimiter(modelId: string): RateLimiter | undefined {
    return this.rateLimiters.get(modelId)
  }

  /**
   * Wait for a token to become available for a specific model
   * @param modelId The model identifier
   * @returns The time in ms to wait, or 0 if a token is immediately available
   */
  public async waitForToken(modelId: string): Promise<number> {
    const limiter = this.getRateLimiter(modelId)
    if (!limiter) {
      // If no specific limiter exists, allow the request
      return 0
    }
    return limiter.waitForToken()
  }

  /**
   * Handle a rate limit error for a specific model
   * @param modelId The model identifier
   * @param seconds Number of seconds to force cooldown
   */
  public handleRateLimitError(modelId: string, seconds = 15): void {
    const limiter = this.getRateLimiter(modelId)
    if (limiter) {
      limiter.handleRateLimitError(seconds)
    }
  }
}
