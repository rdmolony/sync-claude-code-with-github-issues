#!/usr/bin/env node

const { parseArgs } = require('node:util');
const fs = require('node:fs');
const { watchFile } = require('./src/watcher');
const { processNewLines } = require('./src/parser');
const { convertToMarkdown, segmentConversation, generateSegmentFilenames } = require('./src/markdown');
const { inferClaudeJsonlPath } = require('./src/path-inference');

function showHelp() {
  console.log(`
Usage: claude-sync <command> [options]

Commands:
  watch <file>           Watch a JSONL file and print new messages
  export <output>        Export current conversation to markdown (auto-infers input)
  export <input> <output> Export JSONL file to markdown (explicit input)

Options:
  -h, --help     Show this help message

Examples:
  claude-sync watch /path/to/claude-logs.jsonl
  claude-sync export conversation.md              # Auto-infer current conversation
  claude-sync export /path/to/input.jsonl /path/to/output.md  # Explicit input/output
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
    let inputFile, outputFile;
    
    // Determine if we're using auto-inference (1 arg) or explicit mode (2 args)
    if (args.length === 2) {
      // Single argument: auto-infer input file, use argument as output
      outputFile = args[1];
      inputFile = inferClaudeJsonlPath();
      
      if (!inputFile) {
        console.error('Error: Could not infer JSONL file path from current directory');
        console.error('Make sure you are in a directory that corresponds to a Claude project,');
        console.error('or use explicit input/output files:');
        console.error('Usage: claude-sync export <input.jsonl> <output.md>');
        process.exit(1);
      }
      
      console.log(`Auto-inferred input file: ${inputFile}`);
    } else if (args.length === 3) {
      // Two arguments: explicit input and output files
      inputFile = args[1];
      outputFile = args[2];
    } else {
      console.error('Error: Please provide output file or both input and output files');
      console.error('Usage: claude-sync export <output.md>  # Auto-infer input');
      console.error('   or: claude-sync export <input.jsonl> <output.md>  # Explicit');
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
      
      // Segment the conversation by GOAL: messages
      const segments = segmentConversation(lines);
      
      if (segments.length > 1) {
        // Multiple segments found - create multiple files
        const filenames = generateSegmentFilenames(outputFile, segments.length);
        
        for (let i = 0; i < segments.length; i++) {
          const markdown = convertToMarkdown(segments[i]);
          fs.writeFileSync(filenames[i], markdown, 'utf8');
        }
        
        console.log(`Successfully exported ${lines.length} lines from ${inputFile} to ${segments.length} files: ${filenames.join(', ')}`);
      } else {
        // Single segment or no segments - create single file
        const markdown = convertToMarkdown(lines);
        fs.writeFileSync(outputFile, markdown, 'utf8');
        
        console.log(`Successfully exported ${lines.length} lines from ${inputFile} to ${outputFile}`);
      }
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