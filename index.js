import chokidar from 'chokidar';
import { processFile } from './processor.js';
import { updateFileWithOkStatus } from './fileWriter.js';

// Get the file path from environment variable
const filePath = process.env.WATCH_FILE;

if (!filePath) {
  console.error('Error: WATCH_FILE environment variable is not set');
  console.error('Please set WATCH_FILE in your .env file');
  process.exit(1);
}

console.log(`Watching file: ${filePath}`);

/**
 * Main flow executed when file changes are detected
 */
async function executeFlow() {
  try {
    console.log('Processing file...');
    const notOkObjects = await processFile(filePath);
    
    console.log(`Found ${notOkObjects.length} items that are not OK`);
    
    if (notOkObjects.length > 0) {
      for (const item of notOkObjects) {
        // TODO: Process each item here
        console.log(`Processing: ID=${item.id}, NumeroNota=${item.numeroNota}, Status=${item.status}`);
      }
      
      // Update file: add ;OK to lines that don't have it
      await updateFileWithOkStatus(filePath);
    }
  } catch (error) {
    console.error(`Error in flow execution: ${error.message}`);
  }
}

// Watch the specific file
const watcher = chokidar.watch(filePath, {
  persistent: true,
  ignoreInitial: false
});

watcher
  .on('add', async (path) => {
    console.log(`File added: ${path}`);
    await executeFlow();
  })
  .on('change', async (path) => {
    console.log(`File changed: ${path}`);
    await executeFlow();
  })
  .on('unlink', path => console.log(`File removed: ${path}`))
  .on('error', error => console.error(`Watcher error: ${error}`))
  .on('ready', () => console.log('Watcher is ready'));

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down watcher...');
  watcher.close();
  process.exit(0);
});

