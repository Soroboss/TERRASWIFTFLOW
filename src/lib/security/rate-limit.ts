import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSec?: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __tsfRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getMemoryStore(): Map<string, RateLimitEntry> {
  if (!globalThis.__tsfRateLimitStore) {
    globalThis.__tsfRateLimitStore = new Map();
  }
  return globalThis.__tsfRateLimitStore;
}

function checkRateLimitMemory(
  bucket: string,
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = `${bucket}:${identifier}`;
  const store = getMemoryStore();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (entry.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true };
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(options: RateLimitOptions): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.floor(options.windowMs / 1000));
  const cacheKey = `${options.limit}:${windowSec}`;

  if (!upstashLimiters.has(cacheKey)) {
    const redis = new Redis({ url, token });
    upstashLimiters.set(
      cacheKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${windowSec} s`),
        prefix: "tsf",
      })
    );
  }

  return upstashLimiters.get(cacheKey) ?? null;
}

export async function checkRateLimit(
  bucket: string,
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(options);

  if (limiter) {
    const { success, reset } = await limiter.limit(`${bucket}:${identifier}`);
    if (!success) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      };
    }
    return { allowed: true };
  }

  return checkRateLimitMemory(bucket, identifier, options);
}

export const AUTH_RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
} as const;

export const AUTH_RESEND_RATE_LIMIT = {
  limit: 3,
  windowMs: 60 * 60 * 1000,
} as const;
