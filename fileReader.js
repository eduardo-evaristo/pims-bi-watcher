import { readFile } from 'fs/promises';

/**
 * Reads the content of a file
 * @param {string} filePath - Path to the file to read
 * @returns {Promise<string>} File content as string
 */
export async function readFileContent(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

