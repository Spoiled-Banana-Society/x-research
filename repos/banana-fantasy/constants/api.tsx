import { env } from "@/environment"

// URI for draft server. Toggle between hosted and local draft server
const remote_draft_server_dev:string = "wss://sbs-drafts-server-1026708014901.us-central1.run.app"
const remote_draft_server_prod:string = "wss://sbs-drafts-server-w5wydprnbq-uc.a.run.app"
export const DRAFT_SERVER_API_URL:string = process.env.NEXT_PUBLIC_DRAFT_SERVER_URL || (env === "dev" ? remote_draft_server_dev : remote_draft_server_prod)

const remote_draft_api_dev_http:string = "https://sbs-drafts-api-ajuy5qy3wa-uc.a.run.app"
const remote_draft_api_prod_http:string = "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app"
export const HTTP_DRAFT_API_URL:string = process.env.NEXT_PUBLIC_DRAFTS_API_URL || (env === "dev" ? remote_draft_api_dev_http : remote_draft_api_prod_http)

export const SBS_API = process.env.NEXT_PUBLIC_SBS_API_URL || (env === "dev" ? "https://us-central1-sbs-test-env.cloudfunctions.net/api" : "https://us-central1-sbs-prod-env.cloudfunctions.net/api")
