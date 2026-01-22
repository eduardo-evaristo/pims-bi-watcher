import { getConnection } from './accessConnection.js';

/**
 * Updates a record in the Access database
 * @param {string} dbPath - Path to the Access database
 * @param {string} id - ID of the record to update
 * @param {string} numeroNota - Número da nota no SAP to set
 * @returns {Promise<void>}
 */
export async function updateNotaSap(dbPath, id, numeroNota) {
  try {
    const connection = await getConnection(dbPath);
    
    const sql = `UPDATE [Notas de Manutenção] SET [Nº da nota no SAP] = ? WHERE ID = ?`;
    
    await connection.query(sql, [numeroNota, id]);
    console.log(`Updated: ID=${id}, NumeroNota=${numeroNota}`);
  } catch (error) {
    throw new Error(`Failed to update record ID=${id}: ${error.message}`);
  }
}

