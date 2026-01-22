import { getConnection, closeConnection } from './accessConnection.js';

/**
 * Formata valores para SQL (baseado no código de referência que funciona)
 * @param {unknown} value - Valor a ser formatado
 * @returns {string|number} Valor formatado para SQL
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Se for numérico, retorna sem aspas
    if (/^[-+]?\d+(\.\d+)?$/.test(trimmed)) {
      return trimmed;
    }
    
    // Escapa aspas simples para SQL
    return `'${trimmed.replace(/'/g, "''")}'`;
  }
  
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Updates a record in the Access database
 * @param {string} dbPath - Path to the Access database
 * @param {string} id - ID of the record to update
 * @param {string} numeroNota - Número da nota no SAP to set
 * @returns {Promise<void>}
 */
export async function updateNotaSap(dbPath, id, numeroNota) {
  let connection = null;
  
  try {
    connection = await getConnection(dbPath);
    
    // Format numeroNota for double-quoted Access SQL (escape double quotes)
    const escapedNumeroNota = String(numeroNota || '').trim().replace(/"/g, '""');
    const formattedNumeroNota = `"${escapedNumeroNota}"`;
    const formattedId = formatValue(id);
    
    // Single SQL statement
    const sql = `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ${formattedNumeroNota} WHERE ID = ${formattedId}`;
    
    // Log the exact SQL being executed
    console.log(`Executing SQL: ${sql}`);
    
    // Use query() as it's more reliable for Access via ODBC
    await connection.query(sql);
    
    console.log(`✅ Updated: ID=${id}, NumeroNota=${numeroNota}`);
    
  } catch (error) {
    // Log full error for debugging
    console.error(`❌ Error details:`, error);
    
    // If connection error, try to reconnect and retry once
    // getConnection() now has its own retry logic, but we'll still try one more time here
    if (error.message.includes('connection') || error.message.includes('Error connecting') || error.message.includes('Failed to connect')) {
      console.log(`Connection issue detected, attempting to reconnect...`);
      try {
        // Force new connection by closing existing one
        await closeConnection();
        
        // getConnection() will retry internally (3 attempts by default)
        connection = await getConnection(dbPath);
        const escapedNumeroNota = String(numeroNota || '').trim().replace(/"/g, '""');
        const formattedNumeroNota = `"${escapedNumeroNota}"`;
        const formattedId = formatValue(id);
        const sql = `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ${formattedNumeroNota} WHERE ID = ${formattedId}`;
        
        console.log(`Retrying SQL: ${sql}`);
        await connection.query(sql);
        
        console.log(`✅ Updated (after reconnect): ID=${id}, NumeroNota=${numeroNota}`);
        return;
      } catch (retryError) {
        // Don't throw - just log the error so the process continues
        console.error(`❌ Failed to update record ID=${id} after reconnect retry: ${retryError.message}`);
        // Return instead of throwing to prevent process exit
        return;
      }
    }
    
    // For other errors, log but don't throw to prevent process exit
    console.error(`❌ Failed to update record ID=${id}: ${error.message}`);
    // Return instead of throwing to prevent process exit
    return;
  }
}

