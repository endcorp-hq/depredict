# Contributing to Depredict

Thank you for your interest in contributing to Depredict! This document provides guidelines and information for contributors to our decentralized prediction market protocol.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Repository Structure](#repository-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Questions and Support](#questions-and-support)


## Project Overview

Depredict is a decentralized prediction market protocol on Solana consisting of three main components:

- **On-chain Program** (`programs/depredict/`): Solana smart contracts written in Rust using Anchor framework
- **TypeScript SDK** (`sdk/`): Client library for interacting with the protocol
- **Documentation** (`depredict-docs/`): Comprehensive guides and API reference

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Yarn** package manager
- **Rust** (latest stable)
- **Solana CLI** (v2.2.20 or compatible)
- **Anchor CLI** (v0.31.1 or compatible)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/endcorp-hq/depredict.git
   cd depredict
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Build the program:**
   ```bash
   anchor build
   ```

## Development Setup

### On-chain Program Development

The main program is located in `programs/depredict/`:

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to localnet
anchor deploy

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### SDK Development

The TypeScript SDK is in the `sdk/` directory:

```bash
cd sdk

# Install dependencies
yarn install

# Build the SDK
yarn build

# Clean build artifacts
yarn clean
```

### Documentation Development

The documentation site is in `depredict-docs/`:

```bash
cd depredict-docs

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Repository Structure

```
depredict/
├── programs/depredict/         # Solana smart contracts (Rust/Anchor)
│   ├── src/
│   │   ├── instructions/       # Program instructions
│   │   ├── state/              # Account state structures
│   │   ├── events.rs           # Event definitions
│   │   ├── errors.rs           # Custom error types
│   │   └── lib.rs              # Program entry point
│   └── Cargo.toml
├── sdk/                        # TypeScript SDK
│   ├── src/
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── index.ts            # Main SDK entry point
│   └── package.json
├── depredict-docs/             # Documentation site
│   ├── docs/
│   │   └── pages/              # Documentation pages
│   └── package.json
├── tests/                      # Integration tests
│   ├── market/                 # Market-related tests
│   ├── trade/                  # Trading tests
│   └── helpers.ts              # Test utilities
├── deploy/                     # Deployment scripts
├── migrations/                 # Database migrations
└── Anchor.toml                 # Anchor configuration
```

## Contributing Guidelines

### General Guidelines

1. **Fork the repository** and create a feature branch
2. **Follow the existing code style** and patterns
3. **Write tests** for new functionality
4. **Update documentation** when adding new features
5. **Ensure all tests pass** before submitting a PR

### Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(sdk): add new market creation method`
- `fix(program): resolve integer overflow in trade calculation`
- `docs: update getting started guide`

### Branch Naming

Use descriptive branch names:
- `feature/market-resolution`
- `fix/sdk-connection-issue`
- `docs/api-reference-update`

## Testing

### Running Tests

Tests should be run individually using the anchor.toml scripts:

```bash
# Run all tests
anchor run test-runner

# Run tests with continue on failure
anchor run test-runner-continue

# Run specific test
anchor run test-create-market
anchor run test-create-order
anchor run test-resolve-market
```

### Test Structure

- **Integration Tests** (`tests/`): End-to-end tests for the protocol
- **Unit Tests**: Embedded in the Rust program files
- **SDK Tests**: Manual testing through examples

### Test Guidelines

1. **Test all edge cases** and error conditions
2. **Use descriptive test names** that explain what is being tested
3. **Clean up test state** after each test
4. **Mock external dependencies** when appropriate

## Code Style

### Rust (On-chain Program)

- Follow [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/style/naming/README.html)
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Document public functions with doc comments

### TypeScript (SDK)

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Document public APIs with JSDoc comments

### Documentation

- Use clear, concise language
- Include code examples
- Keep documentation up-to-date with code changes
- Use consistent formatting and structure

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines above
3. **Write or update tests** as needed
4. **Update documentation** if required
5. **Run all tests** to ensure everything works
6. **Submit a pull request** with a clear description

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass
- [ ] Manual testing completed
- [ ] Documentation updated

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
```

## Reporting Bugs

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details** (OS, Node.js version, etc.)
5. **Error messages** and stack traces
6. **Minimal reproduction case** if possible

## Feature Requests

For feature requests:

1. **Check existing issues** to avoid duplicates
2. **Provide clear use case** and motivation
3. **Describe expected behavior** in detail
4. **Consider implementation complexity** and impact

## Questions and Support

- **GitHub Issues**: For bugs and feature requests
- **Documentation**: Check the [docs](./depredict-docs) first
- **END Corp.**: Project lead and support

## License

By contributing to Depredict, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Depredict! 🚀 