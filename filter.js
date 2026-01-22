/**
 * Filters objects that are not OK (status !== 'OK')
 * @param {Array<Object>} objects - Array of objects with id, numeroNota, and status
 * @returns {Array<Object>} Filtered array containing only objects with status !== 'OK'
 */
export function filterNotOk(objects) {
  return objects.filter(obj => obj.status !== 'OK');
}

