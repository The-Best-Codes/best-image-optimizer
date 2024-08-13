import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, "3 s"), // 1 request per 3 seconds
});

export default rateLimiter;
