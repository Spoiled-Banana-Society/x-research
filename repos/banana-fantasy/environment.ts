/**
 * @deprecated Use `lib/staging.ts` as the canonical environment/staging source.
 * This module remains only for older callers that have not been migrated yet.
 */
type Environment = "dev" | "prod"
export const env: Environment = process.env.NEXT_PUBLIC_ENVIRONMENT as Environment
