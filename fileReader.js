import { readFile } from 'fs/promises';

/**
 * Reads the content of a file with retry logic for EBUSY errors
 * @param {string} filePath - Path to the file to read
 * @param {number} maxRetries - Maximum number of retry attempts for EBUSY errors (default: 0)
 * @param {number} retryDelayMs - Delay between retries in milliseconds (default: 5000)
 * @returns {Promise<string>} File content as string
 */
export async function readFileContent(filePath, maxRetries = 0, retryDelayMs = 5000) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const content = await readFile(filePath, 'utf-8');
      if (attempt > 0) {
        console.log(`✅ Successfully read file after ${attempt} retry(ies)`);
      }
      return content;
    } catch (error) {
      lastError = error;
      
      // Check if it's an EBUSY error and we have retries left
      const isEBUSY = error.code === 'EBUSY' || error.message.includes('EBUSY') || error.message.includes('resource busy or locked');
      
      if (isEBUSY && attempt < maxRetries) {
        console.log(`File is busy/locked (EBUSY), retrying in ${retryDelayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }
      
      // If not EBUSY or no retries left, throw the error
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }
  
  // This should never be reached, but just in case
  throw new Error(`Failed to read file ${filePath} after ${maxRetries} retries: ${lastError?.message || 'Unknown error'}`);
}

