/**
 * Parses a line from the file into an object
 * @param {string} line - Line to parse (format: id;numeroNota;status)
 * @returns {Object} Parsed object with id, numeroNota, and status
 */
export function parseLine(line) {
  const trimmedLine = line.trim();
  
  if (!trimmedLine) {
    return null;
  }

  const parts = trimmedLine.split(';');
  const id = parts[0] || '';
  const numeroNota = parts[1] || '';
  const status = parts[2] || 'NOK';

  return {
    id,
    numeroNota,
    status
  };
}

/**
 * Parses file content into an array of objects
 * @param {string} content - File content as string
 * @returns {Array<Object>} Array of parsed objects
 */
export function parseFileContent(content) {
  const lines = content.split('\n');
  const objects = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      objects.push(parsed);
    }
  }

  return objects;
}

