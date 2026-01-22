import * as odbc from 'odbc';

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
  
  // Try ACE driver with extended options for better compatibility
  // ExtendedAnsiSQL=1 enables ANSI SQL-92 features
  return `Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=${normalizedPath};ExtendedAnsiSQL=1;`;
}

/**
 * Creates and returns a connection to the Access database
 * @param {string} path - Path to the Access database file (.mdb or .accdb)
 * @param {number} maxRetries - Maximum number of connection retry attempts (default: 3)
 * @param {number} retryDelayMs - Delay between retries in milliseconds (default: 1000)
 * @returns {Promise<odbc.Connection>} Database connection
 */
export async function getConnection(path, maxRetries = 3, retryDelayMs = 1000) {
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
    
    let lastError = null;
    
    // Retry connection with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Connecting to database (attempt ${attempt}/${maxRetries}): ${path}`);
        connection = await odbc.connect(connectionString);
        console.log('Database connection established');
        return connection;
      } catch (error) {
        lastError = error;
        console.error(`Connection attempt ${attempt} failed: ${error.message}`);
        
        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = retryDelayMs * attempt; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    console.error(`Failed to connect after ${maxRetries} attempts`);
    throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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

