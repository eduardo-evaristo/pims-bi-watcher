import chokidar from 'chokidar';
import { processFile } from './processor.js';
import { updateFileWithOkStatus } from './fileWriter.js';
import { updateNotaSap } from './accessUpdater.js';
import { closeConnection } from './accessConnection.js';

// Get the file path from environment variable
const filePath = process.env.WATCH_FILE;
const dbPath = process.env.ACCESS_DB_PATH;

if (!filePath) {
  console.error('Error: WATCH_FILE environment variable is not set');
  console.error('Please set WATCH_FILE in your .env file');
  process.exit(1);
}

if (!dbPath) {
  console.error('Error: ACCESS_DB_PATH environment variable is not set');
  console.error('Please set ACCESS_DB_PATH in your .env file');
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
        try {
          await updateNotaSap("C:\\Users\\gmenegue\\Documents\\Database.accdb", item.id, item.numeroNota);
        } catch (error) {
          // Log error but continue processing other items
          console.error(`Error updating item ID=${item.id}: ${error.message}`);
          // Don't rethrow - continue with next item
        }
      }
      
      // Update file: add ;OK to lines that don't have it
      // Wrap in try-catch to prevent process exit if file update fails
      try {
        await updateFileWithOkStatus(filePath);
      } catch (error) {
        console.error(`Error updating file status: ${error.message}`);
        // Don't rethrow - continue watching
      }
    }
  } catch (error) {
    // Log error but don't exit - keep the watcher running
    console.error(`Error in flow execution: ${error.message}`);
    console.error('Continuing to watch for file changes...');
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
    try {
      await executeFlow();
    } catch (error) {
      console.error(`Error handling file add event: ${error.message}`);
      // Don't exit - keep watching
    }
  })
  .on('change', async (path) => {
    console.log(`File changed: ${path}`);
    try {
      await executeFlow();
    } catch (error) {
      console.error(`Error handling file change event: ${error.message}`);
      // Don't exit - keep watching
    }
  })
  .on('unlink', path => console.log(`File removed: ${path}`))
  .on('error', error => {
    console.error(`Watcher error: ${error.message}`);
    // Don't exit on watcher errors - try to continue
  })
  .on('ready', () => console.log('Watcher is ready'));

// Handle unhandled promise rejections to prevent process exit
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Continuing to run - process will not exit');
  // Don't exit - just log the error
});

// Handle uncaught exceptions (but still log them)
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Continuing to run - process will not exit');
  // Don't exit - just log the error
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down watcher...');
  watcher.close();
  await closeConnection();
  process.exit(0);
});

