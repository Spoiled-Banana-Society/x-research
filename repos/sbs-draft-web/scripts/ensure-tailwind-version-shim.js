/**
 * flowbite-react requires tailwindcss/version.js; Tailwind v3 npm package does not ship it.
 * Run after install (yarn/npm) so `yarn dev` / next.config can load the Flowbite plugin.
 */
const fs = require("fs");
const path = require("path");

const tailwindRoot = path.join(__dirname, "..", "node_modules", "tailwindcss");
const pkgPath = path.join(tailwindRoot, "package.json");
const versionPath = path.join(tailwindRoot, "version.js");

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

fs.writeFileSync(
  versionPath,
  "module.exports = require('./package.json').version;\n",
  "utf8"
);
