/**
 * Parses file content into an array of objects
 * New format: "1 2 1 ; 4 1 7 8 2 3 4 . 1 2 1 ; 4 1 7 8 2 3 5 ."
 * Each record: ID;NUMERO;STATUS. (STATUS is optional, can be OK)
 * @param {string} content - File content as string
 * @returns {Array<Object>} Array of parsed objects with id, numeroNota, status, and originalText
 */
export function parseFileContent(content) {
  const objects = [];
  
  // Remove all spaces to process
  const contentWithoutSpaces = content.replace(/\s+/g, '');
  
  // Split by . to get individual records
  const records = contentWithoutSpaces.split('.').filter(record => record.trim());
  
  for (const record of records) {
    // Split by ; to get id, numeroNota, and status
    const parts = record.split(';');
    const id = (parts[0] || '').trim();
    const numeroNota = (parts[1] || '').trim();
    const status = (parts[2] || '').trim().toUpperCase();
    
    if (id && numeroNota) {
      objects.push({
        id,
        numeroNota,
        status: status === 'OK' ? 'OK' : 'NOK'
      });
    }
  }
  
  return objects;
}

