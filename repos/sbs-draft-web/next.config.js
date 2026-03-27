const path = require("path");
const withFlowbiteReact = require("flowbite-react/plugin/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        domains: ["picsum.photos"],
    },
    /** One @noble/hashes (1.8+) so @noble/curves can re-export `abytes` from utils; older nested copies break the bundle. */
    webpack: (config) => {
        const nobleHashes = path.resolve(__dirname, "node_modules/@noble/hashes");
        config.resolve.alias = {
            ...config.resolve.alias,
            "@noble/hashes": nobleHashes,
        };
        return config;
    },
    env: {
        NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
        NEXT_PUBLIC_WEB3AUTH_CLIENT_ID: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
        NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_AUTH_DOMAIN: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
        NEXT_PUBLIC_DATABASE_URL: process.env.NEXT_PUBLIC_DATABASE_URL,
        NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
        NEXT_PUBLIC_STORAGE_BUCKET: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
        NEXT_PUBLIC_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
        NEXT_PUBLIC_MEASUREMENT_ID: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
        NEXT_PUBLIC_INFURA_KEY: process.env.NEXT_PUBLIC_INFURA_KEY,
    },
}

module.exports = withFlowbiteReact(nextConfig)