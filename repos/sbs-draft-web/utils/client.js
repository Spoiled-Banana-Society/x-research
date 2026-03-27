// src/client.ts
import { createThirdwebClient } from "thirdweb";
 
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error(
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set. Please add it to your .env.local file."
  );
}

export const client = createThirdwebClient({
  clientId,
});