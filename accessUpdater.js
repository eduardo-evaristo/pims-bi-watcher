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
    
    // Formata valores diretamente na query (mesma abordagem do código de referência)
    const formattedNumeroNota = formatValue(numeroNota);
    const formattedId = formatValue(id);
    
    // Try different SQL syntaxes if one fails
    const sqlVariants = [
      `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ${formattedNumeroNota} WHERE ID = ${formattedId}`,
      `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP]=${formattedNumeroNota} WHERE ID=${formattedId}`,
      `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP]=${formattedNumeroNota} WHERE [ID]=${formattedId}`
    ];
    
    let lastError = null;
    
    for (const sql of sqlVariants) {
      try {
        // Log the exact SQL being executed
        console.log(`Executing SQL: ${sql}`);
        
        // Use query() as it's more reliable for Access via ODBC
        const result = await connection.query(sql);
        
        console.log(`✅ Updated: ID=${id}, NumeroNota=${numeroNota}`);
        return; // Success, exit function
      } catch (sqlError) {
        lastError = sqlError;
        console.log(`SQL variant failed, trying next...`);
        continue;
      }
    }
    
    // If all variants failed, throw the last error
    throw lastError;
    
  } catch (error) {
    // Log full error for debugging
    console.error(`❌ Error details:`, error);
    
    // If connection error, try to reconnect and retry once
    if (error.message.includes('connection') || error.message.includes('Error connecting')) {
      console.log(`Connection issue detected, attempting to reconnect...`);
      try {
        // Force new connection by closing existing one
        await closeConnection();
        
        connection = await getConnection(dbPath);
        const formattedNumeroNota = formatValue(numeroNota);
        const formattedId = formatValue(id);
        const sql = `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ${formattedNumeroNota} WHERE ID = ${formattedId}`;
        
        console.log(`Retrying SQL: ${sql}`);
        await connection.query(sql);
        
        console.log(`✅ Updated (after reconnect): ID=${id}, NumeroNota=${numeroNota}`);
        return;
      } catch (retryError) {
        throw new Error(`Failed to update record ID=${id} after retry: ${retryError.message}`);
      }
    }
    
    throw new Error(`Failed to update record ID=${id}: ${error.message}`);
  }
}

