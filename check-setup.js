/**
 * CareerX — Pre-flight setup checker
 *
 * Run:  node check-setup.js
 * Validates that the environment is correctly configured before starting.
 */

const fs = require("fs");
const path = require("path");
const dns = require("dns");
const { execSync } = require("child_process");

const ROOT = __dirname;
const SERVER = path.join(ROOT, "server");
const CLIENT = path.join(ROOT, "client");

let passed = 0;
let warned = 0;
let failed = 0;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
  passed++;
}
function warn(msg) {
  console.log(`  ⚠ ${msg}`);
  warned++;
}
function fail(msg) {
  console.log(`  ✗ ${msg}`);
  failed++;
}

console.log("\n╔══════════════════════════════════════╗");
console.log("║   CareerX Setup Checker              ║");
console.log("╚══════════════════════════════════════╝\n");

// ── 1. Node.js version ──
console.log("1. Node.js");
const nodeVer = process.version;
const major = parseInt(nodeVer.slice(1));
if (major >= 18) ok(`Node.js ${nodeVer}`);
else fail(`Node.js ${nodeVer} — v18+ required`);

// ── 2. Dependencies ──
console.log("\n2. Dependencies");
if (fs.existsSync(path.join(ROOT, "node_modules")))
  ok("Root node_modules installed");
else fail("Root node_modules missing — run: npm run install:all");

if (fs.existsSync(path.join(SERVER, "node_modules")))
  ok("Server node_modules installed");
else fail("Server node_modules missing — run: cd server && npm install");

if (fs.existsSync(path.join(CLIENT, "node_modules")))
  ok("Client node_modules installed");
else fail("Client node_modules missing — run: cd client && npm install");

// ── 3. Environment files ──
console.log("\n3. Environment Files");
const serverEnv = path.join(SERVER, ".env");
const clientEnvLocal = path.join(CLIENT, ".env.local");

if (fs.existsSync(serverEnv)) {
  ok("server/.env exists");

  // Parse and check required keys
  const envContent = fs.readFileSync(serverEnv, "utf8").replace(/\r/g, "");
  const envVars = {};
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const required = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
  required.forEach((key) => {
    if (envVars[key] && !envVars[key].includes("<") && !envVars[key].includes("your_"))
      ok(`  ${key} is set`);
    else fail(`  ${key} is missing or still has placeholder value`);
  });

  if (envVars.GEMINI_API_KEY || envVars.GROQ_API_KEY) ok("  AI key configured");
  else warn("  No AI key set — AI features will be disabled");

  if (envVars.JDOODLE_CLIENT_ID && envVars.JDOODLE_CLIENT_SECRET)
    ok("  JDoodle compiler keys set");
  else warn("  JDoodle keys missing — cloud compiler won't work");
} else {
  fail("server/.env is MISSING — this is the #1 cause of crashes");
  console.log("       → Copy server/.env.example to server/.env and fill values");
}

if (fs.existsSync(clientEnvLocal)) {
  ok("client/.env.local exists");
} else {
  warn("client/.env.local missing — will default to http://localhost:5000/api");
  console.log("       → Copy client/.env.example to client/.env.local");
}

// ── 4. Port availability ──
console.log("\n4. Ports");
try {
  const net = require("net");

  function checkPort(port) {
    return new Promise((resolve) => {
      const s = net.createServer();
      s.once("error", () => resolve(false));
      s.once("listening", () => {
        s.close();
        resolve(true);
      });
      s.listen(port);
    });
  }

  Promise.all([checkPort(5000), checkPort(3000)]).then(([p5000, p3000]) => {
    if (p5000) ok("Port 5000 is available (server)");
    else warn("Port 5000 is in use — server may fail to start");

    if (p3000) ok("Port 3000 is available (client)");
    else warn("Port 3000 is in use — client may fail to start");

    // ── 5. MongoDB connectivity ──
    console.log("\n5. MongoDB DNS");
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
    dns.resolveSrv("_mongodb._tcp.cluster0.gwmnsjq.mongodb.net", (err, records) => {
      if (!err && records?.length > 0) {
        ok("MongoDB Atlas DNS resolves correctly");
      } else {
        warn("Cannot resolve MongoDB Atlas SRV — possible DNS/firewall issue");
        console.log("       → Try connecting to a different network or use a VPN");
      }

      // ── Summary ──
      console.log("\n──────────────────────────────────────");
      console.log(`Results: ${passed} passed, ${warned} warnings, ${failed} failed`);

      if (failed > 0) {
        console.log("\n⛔ Fix the failures above before running the project.");
        console.log("   Most common fix: copy .env.example → .env and fill in values.\n");
        process.exit(1);
      } else if (warned > 0) {
        console.log("\n⚠ Project should start, but some features may not work.\n");
      } else {
        console.log("\n✅ Everything looks good! Run: npm run dev\n");
      }
    });
  });
} catch (e) {
  warn("Could not check ports: " + e.message);
}
