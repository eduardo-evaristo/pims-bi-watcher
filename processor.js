import { readFileContent } from './fileReader.js';
import { parseFileContent } from './parser.js';
import { filterNotOk } from './filter.js';

/**
 * Processes the file: reads, parses, and filters objects that are not OK
 * @param {string} filePath - Path to the file to process
 * @returns {Promise<Array<Object>>} Array of objects that are not OK
 */
export async function processFile(filePath) {
  // Retry up to 3 times with 5 second delay for EBUSY errors
  const content = await readFileContent(filePath, 3, 5000);
  const objects = parseFileContent(content);
  const notOkObjects = filterNotOk(objects);
  
  return notOkObjects;
}

