#!/usr/bin/env node

const { parseArgs } = require('node:util');
const fs = require('node:fs');
const { watchFile } = require('./src/watcher');
const { processNewLines } = require('./src/parser');
const { convertToMarkdown } = require('./src/markdown');

function showHelp() {
  console.log(`
Usage: claude-sync <command> [options]

Commands:
  watch <file>           Watch a JSONL file and print new messages
  export <input> <output> Export JSONL file to markdown

Options:
  -h, --help     Show this help message

Examples:
  claude-sync watch /path/to/claude-logs.jsonl
  claude-sync export /path/to/input.jsonl /path/to/output.md
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
  } else if (command === 'export') {
    const inputFile = args[1];
    const outputFile = args[2];
    
    if (!inputFile || !outputFile) {
      console.error('Error: Please provide both input and output files');
      console.error('Usage: claude-sync export <input.jsonl> <output.md>');
      process.exit(1);
    }
    
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: File does not exist: ${inputFile}`);
      process.exit(1);
    }
    
    try {
      // Read the entire JSONL file
      const content = fs.readFileSync(inputFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Convert to markdown
      const markdown = convertToMarkdown(lines);
      
      // Write markdown file
      fs.writeFileSync(outputFile, markdown, 'utf8');
      
      console.log(`Successfully exported ${lines.length} lines from ${inputFile} to ${outputFile}`);
    } catch (error) {
      console.error(`Error processing files: ${error.message}`);
      process.exit(1);
    }
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