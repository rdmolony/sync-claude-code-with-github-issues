const fs = require('node:fs');

function watchFile(filePath, onNewLines) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  // Read initial file content to track existing lines
  let lastLineCount = 0;
  try {
    const initialContent = fs.readFileSync(filePath, 'utf8');
    const initialLines = initialContent.split('\n').filter(line => line.trim());
    lastLineCount = initialLines.length;
  } catch (error) {
    // If we can't read the file initially, start from 0
    lastLineCount = 0;
  }

  // Watch for file changes
  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      try {
        // Read current file content
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        // Check if we have new lines
        if (lines.length > lastLineCount) {
          // Get only new lines
          const newLines = lines.slice(lastLineCount);
          
          // Trigger callback with new lines
          if (onNewLines) {
            onNewLines(newLines);
          }
          
          // Update line count
          lastLineCount = lines.length;
        }
      } catch (error) {
        if (onNewLines) {
          onNewLines(null, error);
        }
      }
    }
  });

  return {
    watcher,
    initialLineCount: lastLineCount,
    close: () => watcher.close()
  };
}

module.exports = {
  watchFile
};