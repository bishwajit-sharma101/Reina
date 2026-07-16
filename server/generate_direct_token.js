const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load env from root as the server does
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const secret = (process.env.JWT_SECRET || "").trim();
console.log("Using Secret:", secret);

if (!secret) {
  console.log("ERROR: No JWT_SECRET found in env");
  process.exit(1);
}

// Dummy User ID (from seeding script or mock)
const userId = "660000000000000000000001"; // Generic fake ID for testing

const token = jwt.sign({ id: userId }, secret, {
    expiresIn: '7d', 
});

console.log("--- TEST TOKEN START ---");
console.log(token);
console.log("--- TEST TOKEN END ---");
process.exit(0);
