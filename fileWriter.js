import { writeFile } from 'fs/promises';
import { readFileContent } from './fileReader.js';

/**
 * Updates the file by adding ";OK" to lines that don't have status OK
 * @param {string} filePath - Path to the file to update
 * @returns {Promise<void>}
 */
export async function updateFileWithOkStatus(filePath) {
  try {
    // Retry up to 3 times with 5 second delay for EBUSY errors
    const content = await readFileContent(filePath, 3, 5000);
    const lines = content.split(/\r?\n/);
    const updatedLines = lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        return line;
      }
      
      // Check if line already ends with ;OK
      if (trimmedLine.endsWith(';OK')) {
        return line;
      }
      
      // Add ;OK to lines that don't have it
      return line + ';OK';
    });
    
    // Join lines back with newline, preserving the original format
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    const updatedContent = updatedLines.join(lineEnding);
    await writeFile(filePath, updatedContent, 'utf-8');
    console.log('File updated: Added ;OK to lines without status');
  } catch (error) {
    throw new Error(`Failed to update file ${filePath}: ${error.message}`);
  }
}

