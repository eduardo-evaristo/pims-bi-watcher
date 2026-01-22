import odbc from 'odbc';

let connection = null;
let dbPath = null;

/**
 * Creates a connection string for Access database
 * @param {string} path - Path to the Access database file
 * @returns {string} Connection string
 */
function buildConnectionString(path) {
  // Normalize path separators for Windows
  const normalizedPath = path.replace(/\//g, '\\');
  
  // Try ACE driver first (supports both .mdb and .accdb)
  return `Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=${normalizedPath};`;
}

/**
 * Creates and returns a connection to the Access database
 * @param {string} path - Path to the Access database file (.mdb or .accdb)
 * @returns {Promise<odbc.Connection>} Database connection
 */
export async function getConnection(path) {
  // If path changed or connection doesn't exist, create new connection
  if (!connection || dbPath !== path) {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        // Ignore errors when closing old connection
      }
    }
    
    dbPath = path;
    const connectionString = buildConnectionString(path);
    
    try {
      console.log(`Connecting to database: ${path}`);
      connection = await odbc.connect(connectionString);
      console.log('Database connection established');
    } catch (error) {
      console.error(`Connection error: ${error.message}`);
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }
  
  return connection;
}

/**
 * Closes the database connection
 */
export async function closeConnection() {
  if (connection) {
    try {
      await connection.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error(`Error closing connection: ${error.message}`);
    }
    connection = null;
    dbPath = null;
  }
}

