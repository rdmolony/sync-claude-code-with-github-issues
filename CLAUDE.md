# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

This repository uses Nix flakes for development environment management with direnv integration. The development environment is automatically activated via direnv, if you can't find a dependency try `direnv reload` first to refresh a change to `flake.nix`.

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

## Nix Flake Validation

This project includes Nix flake apps for validating the package build and flake structure:

### Flake Testing Commands

- `nix run .#check` - Run basic flake check to validate outputs and ensure they can be built
- `nix run .#check-all` - Run flake check for all supported systems (comprehensive validation)
- `nix run .#build-test` - Test package builds and functionality (builds both outputs and tests CLI)

### Manual Flake Commands

- `nix flake check` - Official Nix command to validate flake structure
- `nix build .#default` - Build the default package
- `nix build .#claude-sync` - Build the named package
- `nix run .#claude-sync -- --help` - Run the package directly to test functionality
- `nix flake show` - Display all flake outputs (packages, apps, devShells)

### Testing Guidelines

- **Comprehensive Coverage**: Every module and function should have tests
- **Clear Test Names**: Test descriptions should clearly state what is being tested
- **Focused Tests**: Each test should verify one specific behavior
- **Edge Cases**: Include tests for error conditions and edge cases
- **Mock External Dependencies**: Use mocks for file system, network calls, etc.

This TDD approach ensures code reliability, makes refactoring safe, and provides living documentation of expected behavior.