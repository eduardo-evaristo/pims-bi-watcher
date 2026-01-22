import { writeFile } from 'fs/promises';
import { readFileContent } from './fileReader.js';
import { parseFileContent } from './parser.js';

/**
 * Updates the file by adding "; OK" before "." for each processed record
 * Format: "1 2 1 ; 4 1 7 8 2 3 4 ." -> "1 2 1 ; 4 1 7 8 2 3 4 ; OK ."
 * Also handles numbers without spaces: "121;4178234." -> "121;4178234; OK ."
 * @param {string} filePath - Path to the file to update
 * @param {Array<Object>} processedObjects - Array of objects that were successfully processed (with id and numeroNota)
 * @returns {Promise<void>}
 */
export async function updateFileWithOkStatus(filePath, processedObjects = []) {
  try {
    // Retry up to 3 times with 5 second delay for EBUSY errors
    let content = await readFileContent(filePath, 3, 5000);
    const originalContent = content.trim();
    
    // If no processed objects provided, add OK to all records without OK
    if (processedObjects.length === 0) {
      // Parse to find all records without OK
      const allObjects = parseFileContent(content);
      processedObjects = allObjects.filter(obj => obj.status !== 'OK');
    }
    
    if (processedObjects.length === 0) {
      console.log('No records to update');
      return;
    }
    
    // Process each record one by one
    for (const obj of processedObjects) {
      const { id, numeroNota } = obj;
      
      // Create a pattern that matches the record with flexible spacing
      // Match: id (with optional spaces between chars) ; (spaces) numero (with optional spaces between chars) . 
      // But NOT if it already has " ; OK" or ";OK" before the "."
      
      // Escape special regex characters and join with \s* (optional spaces)
      const idPattern = id.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
      const numeroPattern = numeroNota.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
      
      // Pattern: id\s*;\s*numero\s*.
      // We want to match this but NOT if there's OK between numero and .
      const basePattern = `${idPattern}\\s*;\\s*${numeroPattern}`;
      
      console.log(`Looking for pattern: ${basePattern} (ID=${id}, NumeroNota=${numeroNota})`);
      
      // Try to find all occurrences
      const regex = new RegExp(basePattern, 'g');
      let match;
      const replacements = [];
      
      while ((match = regex.exec(content)) !== null) {
        console.log(`Found match: "${match[0]}" at position ${match.index}`);
        const start = match.index;
        const end = start + match[0].length;
        
        // Look ahead to find the next "." after this match
        const afterMatch = content.substring(end);
        const dotIndex = afterMatch.indexOf('.');
        
        if (dotIndex === -1) {
          console.log(`No dot found after record ID=${id}, NumeroNota=${numeroNota}`);
          continue; // No dot found, skip
        }
        
        // Check the text between the match and the dot
        const textBetween = afterMatch.substring(0, dotIndex).trim();
        
        // If it already has OK (case insensitive), skip this occurrence
        if (/OK|ok/i.test(textBetween)) {
          console.log(`Record ID=${id}, NumeroNota=${numeroNota} already has OK, skipping`);
          continue;
        }
        
        // Found a valid record to update
        const dotPosition = end + dotIndex;
        replacements.push({
          position: dotPosition,
          insert: ' ; OK'
        });
        
        console.log(`Will add ; OK before . for record ID=${id}, NumeroNota=${numeroNota} at position ${dotPosition}`);
        
        // Only process the first valid match for this record
        break;
      }
      
      if (replacements.length === 0) {
        console.log(`Warning: Could not find record ID=${id}, NumeroNota=${numeroNota} in file to update`);
      }
      
      // Apply replacements in reverse order to maintain positions
      replacements.reverse().forEach(({ position, insert }) => {
        content = content.substring(0, position) + insert + content.substring(position);
      });
    }
    
    // Remove any trailing newlines but keep the content on one line
    const finalContent = content.trim();
    
    // Only write if content actually changed
    if (finalContent !== originalContent) {
      await writeFile(filePath, finalContent, 'utf-8');
      console.log(`File updated: Added ; OK to ${processedObjects.length} processed record(s)`);
      
      // Small delay to prevent watcher from immediately processing the change
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.log(`File unchanged: No changes made`);
    }
  } catch (error) {
    throw new Error(`Failed to update file ${filePath}: ${error.message}`);
  }
}
