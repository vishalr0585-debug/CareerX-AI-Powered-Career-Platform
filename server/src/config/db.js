const mongoose = require("mongoose");
const dns = require("dns");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const connectDB = async () => {
  // Use Google Public DNS to resolve SRV records (some ISPs block SRV)
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      console.log(`✓ MongoDB connected: ${conn.connection.host}`);
      return; // success — exit function
    } catch (error) {
      console.error(`✗ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        console.log(`  ↻ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error("\n╔══════════════════════════════════════════════════════════════╗");
        console.error("║  MongoDB connection failed after all retries.               ║");
        console.error("║                                                              ║");
        console.error("║  Common causes:                                              ║");
        console.error("║  1) .env file missing or MONGO_URI not set                   ║");
        console.error("║  2) MongoDB Atlas → Network Access → your IP not whitelisted ║");
        console.error("║     → Add 0.0.0.0/0 to allow all IPs (dev only)             ║");
        console.error("║  3) Wrong username/password in MONGO_URI                     ║");
        console.error("║  4) Cluster is paused or deleted in Atlas                    ║");
        console.error("║  5) Firewall/VPN blocking outbound port 27017                ║");
        console.error("╚══════════════════════════════════════════════════════════════╝\n");
        process.exit(1);
      }
    }
  }
};

// Auto-reconnect logging
mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB disconnected. Mongoose will auto-reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("✓ MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("✗ MongoDB runtime error:", err.message);
});

module.exports = connectDB;
