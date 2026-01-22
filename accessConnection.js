import ADODB from 'node-adodb';

let connection = null;

/**
 * Creates and returns a connection to the Access database
 * @param {string} dbPath - Path to the Access database file (.mdb or .accdb)
 * @returns {ADODB.Connection} Database connection
 */
export function getConnection(dbPath) {
  if (!connection) {
    const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};`;
    connection = ADODB.open(connectionString);
  }
  return connection;
}

/**
 * Closes the database connection
 */
export function closeConnection() {
  if (connection) {
    connection = null;
  }
}

