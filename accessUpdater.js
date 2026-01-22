import { getConnection, closeConnection } from './accessConnection.js';

/**
 * Updates a record in the Access database
 * @param {string} dbPath - Path to the Access database
 * @param {string} id - ID of the record to update
 * @param {string} numeroNota - Número da nota no SAP to set
 * @returns {Promise<void>}
 */
/**
 * Escapes a string value for use in SQL query
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  // Replace single quotes with two single quotes (SQL escape)
  return `'${String(value).replace(/'/g, "''")}'`;
}

export async function updateNotaSap(dbPath, id, numeroNota) {
  let connection = null;
  
  try {
    connection = await getConnection(dbPath);
    
    // Try parameterized query first (preferred method)
    const sql = `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ? WHERE ID = ?`;
    
    // Execute the update
    const result = await connection.query(sql, [numeroNota, id]);
    
    // Check if any rows were affected
    if (result.count !== undefined && result.count === 0) {
      console.warn(`Warning: No rows updated for ID=${id}. Record may not exist.`);
    }
    
    console.log(`Updated: ID=${id}, NumeroNota=${numeroNota}`);
  } catch (error) {
    // If parameterized query fails, try with escaped values
    if (error.message.includes('parameter') || error.message.includes('Error getting information')) {
      console.log(`Parameterized query failed, trying with escaped values...`);
      try {
        // Use escaped values instead of parameters
        const escapedNumeroNota = escapeSqlValue(numeroNota);
        const escapedId = escapeSqlValue(id);
        const sql = `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ${escapedNumeroNota} WHERE ID = ${escapedId}`;
        
        const result = await connection.query(sql);
        
        if (result.count !== undefined && result.count === 0) {
          console.warn(`Warning: No rows updated for ID=${id}. Record may not exist.`);
        }
        
        console.log(`Updated (with escaped values): ID=${id}, NumeroNota=${numeroNota}`);
        return;
      } catch (escapeError) {
        throw new Error(`Failed to update record ID=${id} with escaped values: ${escapeError.message}`);
      }
    }
    
    // If connection error, try to reconnect and retry once
    if (error.message.includes('connection') || error.message.includes('Error connecting')) {
      console.log(`Connection issue detected, attempting to reconnect...`);
      try {
        // Force new connection by closing existing one
        await closeConnection();
        
        connection = await getConnection(dbPath);
        const sql = `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ? WHERE ID = ?`;
        await connection.query(sql, [numeroNota, id]);
        console.log(`Updated (after reconnect): ID=${id}, NumeroNota=${numeroNota}`);
        return;
      } catch (retryError) {
        throw new Error(`Failed to update record ID=${id} after retry: ${retryError.message}`);
      }
    }
    
    throw new Error(`Failed to update record ID=${id}: ${error.message}`);
  }
}

