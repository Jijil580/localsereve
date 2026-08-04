type D1Database = import("@cloudflare/workers-types").D1Database;
type R2Bucket = import("@cloudflare/workers-types").R2Bucket;
type Fetcher = import("@cloudflare/workers-types").Fetcher;

declare module "cloudflare:workers" {
  export const env: { DB: D1Database; MEDIA: R2Bucket };
}
