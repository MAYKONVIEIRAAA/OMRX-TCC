const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
    process.exit(0);
}

fs.writeFileSync(envPath, "");
console.log("[setup-env] Created empty .env file.");
