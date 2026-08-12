const path = require('path');

const fs = require('fs');

const localConfig = path.join(__dirname, 'config.local.json');
const jsonConfig = path.join(__dirname, 'config.json');

let config;
try {
  if (fs.existsSync(localConfig)) {
    config = require(localConfig);
  } else {
    config = require(jsonConfig);
  }
} catch (err) {
  console.error("❌ config.json not found or is invalid!", err.message);
  process.exit(1);
}

function parseBoolean(value) {
  if (typeof value === "string") {
    value = value.trim().toLowerCase();
  }
  switch (value) {
    case true:
    case "true":
      return true;
    default:
      return false;
  }
}

config.parseBoolean = parseBoolean;

module.exports = config;
