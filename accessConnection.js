import odbc from 'odbc';

let connection = null;

/**
 * Creates and returns a connection to the Access database
 * @param {string} dbPath - Path to the Access database file (.mdb or .accdb)
 * @returns {Promise<odbc.Connection>} Database connection
 */
export async function getConnection(dbPath) {
  if (!connection) {
    // Try ACE driver first (for .accdb files), fallback to Jet (for .mdb files)
    const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=${dbPath};`;
    
    try {
      connection = await odbc.connect(connectionString);
    } catch (error) {
      // If ACE driver fails, try Jet driver for older .mdb files
      if (dbPath.toLowerCase().endsWith('.mdb')) {
        const jetConnectionString = `Driver={Microsoft Access Driver (*.mdb)};Dbq=${dbPath};`;
        connection = await odbc.connect(jetConnectionString);
      } else {
        throw error;
      }
    }
  }
  return connection;
}

/**
 * Closes the database connection
 */
export async function closeConnection() {
  if (connection) {
    await connection.close();
    connection = null;
  }
}

