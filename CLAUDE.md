# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

This repository uses Nix flakes for development environment management with direnv integration. The development environment is automatically activated via direnv.

### Available Tools
- `gh` - GitHub CLI for repository operations
- `git` - Version control operations

## Conversation Tracking Workflow

### Session Initialization
1. At the start of each new session, ask the user if they wish to log this session to GitHub. Also, infer a GitHub issue title from the user's initial prompt and confirm the GitHub issue title with them. 
2. Create a GitHub issue using `gh issue create --title "<user's goal>" --body ""`
3. Note the issue number for reference throughout the session

### New Goal Detection
When a user prompt represents a new goal (distinct from the current tracked issue):
1. Recognize the new goal and infer an appropriate GitHub issue title
2. Ask the user if they want to create a new issue for this goal
3. If yes, create a new GitHub issue and switch tracking to the new issue number
4. Examples of new goals: "let's prove that...", "now implement...", "create a new feature for...", "fix the bug in..."

### Conversation Logging
1. Before answering any user prompt, first save the previous prompt and your responses to a markdown file in folder `logs` named with the current timestamp (format: `YYYY-MM-DD-HHMMSS.md`)
2. Log the conversation in this format (detect actual GitHub username using `gh api user --jq .login`):
   ```markdown
   (@username) User's prompt/question
   
   (claude) Your complete response including tool usage and output
   ```
3. Create a GitHub issue comment from the log file using `gh issue comment <issue-number> --body-file <timestamp-file.md>`
4. Then proceed to answer the current user prompt

### Goal Completion Workflow
When a goal has been completed:
1. Suggest a commit title and message to the user
2. Include a line in the commit message to link to the relevant issue: "Closes #<issue-number>"
3. If the user accepts the proposed commit:
   - Stage files with `git add`
   - Commit with the approved message
   - Push to GitHub using `git push origin "$(git branch --show-current)"`

### Commands
- `gh issue create --title "Goal Title" --body ""` - Create tracking issue
- `date +"%Y-%m-%d-%H%M%S"` - Generate timestamp for log files
- `gh api user --jq .login` - Get current GitHub username
- `gh issue comment <issue-number> --body-file <timestamp-file.md>` - Add conversation log as issue comment
- `git add` - Stage files for commit
- `git commit -m "message"` - Commit with message
- `git push origin "$(git branch --show-current)"` - Push to current branch

## Development Methodology

This project follows Test-Driven Development (TDD) principles for all feature development and bug fixes.

### TDD Workflow

1. **Write Failing Tests First**
   - Create test cases that define the expected behavior
   - Run tests to confirm they fail (red phase)
   - Tests should be specific and focused on one piece of functionality

2. **Implement Minimal Code**
   - Write the simplest code that makes the tests pass (green phase)
   - Focus on functionality, not optimization at this stage
   - Ensure all tests pass before proceeding

3. **Refactor and Improve**
   - Clean up code while keeping tests green
   - Improve structure, performance, and readability
   - Run tests frequently during refactoring

4. **Continuous Testing**
   - Always run tests before making changes to understand current state
   - Run tests after each change to catch regressions immediately
   - All tests must pass before committing code

### Testing Commands

- `npm test` - Run all test suites
- Test files follow pattern: `test/*.test.js`
- Each module should have corresponding tests (e.g., `src/parser.js` → `test/parser.test.js`)

### Testing Guidelines

- **Comprehensive Coverage**: Every module and function should have tests
- **Clear Test Names**: Test descriptions should clearly state what is being tested
- **Focused Tests**: Each test should verify one specific behavior
- **Edge Cases**: Include tests for error conditions and edge cases
- **Mock External Dependencies**: Use mocks for file system, network calls, etc.

This TDD approach ensures code reliability, makes refactoring safe, and provides living documentation of expected behavior.