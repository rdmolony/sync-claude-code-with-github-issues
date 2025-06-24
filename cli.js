#!/usr/bin/env node

const { parseArgs } = require('node:util');
const { watchFile } = require('./src/watcher');
const { processNewLines } = require('./src/parser');

function showHelp() {
  console.log(`
Usage: claude-sync <command> [options]

Commands:
  watch <file>    Watch a JSONL file and print new messages

Options:
  -h, --help     Show this help message

Examples:
  claude-sync watch /path/to/claude-logs.jsonl
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }

  const command = args[0];
  
  if (command === 'watch') {
    const file = args[1];
    if (!file) {
      console.error('Error: Please provide a file to watch');
      console.error('Usage: claude-sync watch <file>');
      process.exit(1);
    }
    
    console.log(`Watching ${file} for new messages...`);
    
    const fileWatcher = watchFile(file, (newLines, error) => {
      if (error) {
        console.error(`Error reading file: ${error.message}`);
      } else {
        processNewLines(newLines);
      }
    });
    
    console.log(`Starting to watch ${file} (skipping existing ${fileWatcher.initialLineCount} lines)`);
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\nStopping file watcher...');
      fileWatcher.close();
      process.exit(0);
    });
  } else {
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };