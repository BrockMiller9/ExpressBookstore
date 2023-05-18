/** Database config for database. */

const { Client } = require("pg");
const { DB_URI } = require("./config");

process.env.PGPASSWORD = process.env.DB_PASSWORD;

let db = new Client({
  connectionString: DB_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

db.connect();

module.exports = db;
