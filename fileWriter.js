import { writeFile } from 'fs/promises';
import { readFileContent } from './fileReader.js';
import { parseFileContent } from './parser.js';

/**
 * Updates the file by adding "; OK" before "." for each processed record
 * Format: "1 2 1 ; 4 1 7 8 2 3 4 ." -> "1 2 1 ; 4 1 7 8 2 3 4 ; OK ."
 * @param {string} filePath - Path to the file to update
 * @param {Array<Object>} processedObjects - Array of objects that were successfully processed (with id and numeroNota)
 * @returns {Promise<void>}
 */
export async function updateFileWithOkStatus(filePath, processedObjects = []) {
  try {
    // Retry up to 3 times with 5 second delay for EBUSY errors
    const originalContent = await readFileContent(filePath, 3, 5000);
    
    // If no processed objects provided, add OK to all records without OK
    if (processedObjects.length === 0) {
      // Parse to find all records without OK
      const allObjects = parseFileContent(originalContent);
      processedObjects = allObjects.filter(obj => obj.status !== 'OK');
    }
    
    // Create a Set for quick lookup of processed records (id;numeroNota)
    const processedSet = new Set(
      processedObjects.map(obj => `${obj.id};${obj.numeroNota}`)
    );
    
    // Remove all spaces to match records
    const contentWithoutSpaces = originalContent.replace(/\s+/g, '');
    
    // Remove trailing OK if present
    let contentToProcess = contentWithoutSpaces;
    if (contentToProcess.endsWith('OK')) {
      contentToProcess = contentToProcess.slice(0, -2);
    }
    
    // Split by . to get individual records
    const records = contentToProcess.split('.').filter(record => record.trim());
    
    // Process each record and add OK if it was processed
    let updatedContent = originalContent;
    
    for (const record of records) {
      const parts = record.split(';');
      const id = (parts[0] || '').trim();
      const numeroNota = (parts[1] || '').trim();
      const status = (parts[2] || '').trim().toUpperCase();
      
      if (id && numeroNota) {
        const recordKey = `${id};${numeroNota}`;
        
        // Check if this record was processed and doesn't already have OK
        if (processedSet.has(recordKey) && status !== 'OK') {
          // Find the record in the original content and add " ; OK" before the "."
          // Create pattern: match id with spaces, then ; with spaces, then numero with spaces, then .
          const idPattern = id.split('').map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
          const numeroPattern = numeroNota.split('').map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
          
          // Pattern to match: "id spaces ; spaces numero spaces ."
          const pattern = new RegExp(
            `(${idPattern}\\s*;\\s*${numeroPattern})(\\s*\\.)`,
            'g'
          );
          
          // Replace: add " ; OK" before the "." only if it doesn't already have OK
          updatedContent = updatedContent.replace(
            pattern,
            (match, recordPart, dotPart) => {
              // Check if this specific match already has OK before the dot
              // Look for the record part followed by optional spaces, then check for OK
              const matchIndex = updatedContent.indexOf(match);
              if (matchIndex !== -1) {
                const beforeMatch = updatedContent.substring(Math.max(0, matchIndex - 10), matchIndex);
                const afterRecordPart = match.substring(recordPart.length);
                // If we see " ; OK" before the dot, don't add it again
                if (afterRecordPart.includes('OK') || beforeMatch.includes('OK')) {
                  return match;
                }
              }
              return `${recordPart} ; OK${dotPart}`;
            }
          );
        }
      }
    }
    
    // Remove any trailing newlines but keep the content on one line
    const finalContent = updatedContent.trim();
    
    await writeFile(filePath, finalContent, 'utf-8');
    console.log(`File updated: Added ; OK to ${processedObjects.length} processed record(s)`);
  } catch (error) {
    throw new Error(`Failed to update file ${filePath}: ${error.message}`);
  }
}
