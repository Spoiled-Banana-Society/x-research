type Environment = "dev" | "prod"
export const env: Environment = process.env.NEXT_PUBLIC_ENVIRONMENT as Environment
