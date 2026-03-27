import { env } from "@/environment"

// URI for draft server. Toggle between hosted and local draft server
const local_draft_server_dev:string = "ws://localhost:8000"
const remote_draft_server_dev:string = "wss://sbs-drafts-server-1026708014901.us-central1.run.app"
const remote_draft_server_prod:string = "wss://sbs-drafts-server-w5wydprnbq-uc.a.run.app"
export const DRAFT_SERVER_API_URL:string = env === "dev" ? remote_draft_server_dev : remote_draft_server_prod

const local_draft_api_dev_http:string = "http://localhost:7070"
const remote_draft_api_dev_http:string = "https://sbs-drafts-api-ajuy5qy3wa-uc.a.run.app"
const remote_draft_api_prod_http:string = "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app"
export const HTTP_DRAFT_API_URL:string = env === "dev" ? remote_draft_api_dev_http : remote_draft_api_prod_http

export const SBS_API = env === "dev" ? "https://us-central1-sbs-test-env.cloudfunctions.net/api" : "https://us-central1-sbs-prod-env.cloudfunctions.net/api"