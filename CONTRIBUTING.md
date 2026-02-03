# Contributing to COWC

Thank you for your interest in contributing to Cashku Open Wealth Connect (COWC)!

## Ways to Contribute

### 1. Report Issues

Found a bug or have a suggestion? [Open an issue](../../issues/new) with:
- Clear description of the problem or suggestion
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment (if relevant)

### 2. Improve Documentation

- Fix typos or unclear explanations
- Add examples
- Improve sample code comments
- Translate documentation

### 3. Add Sample Code

We welcome sample code in additional languages. Please follow the existing structure:

```
samples/{language}/
├── README.md           # Setup and usage instructions
├── package.json        # Or equivalent for your language
└── src/
    ├── auth.{ext}      # OAuth token flow
    ├── funds.{ext}     # Fund discovery
    ├── portfolio.{ext} # Portfolio API
    ├── orders.{ext}    # Order placement
    └── webhooks.{ext}  # Webhook verification
```

### 4. Become a COWC Provider

If you're a wealth platform interested in implementing COWC:
1. Open an issue to discuss
2. Implement the specification
3. Submit a PR to add your provider to the list

## Contribution Process

### For Documentation and Samples

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test your changes
5. Commit: `git commit -m "Add: description of change"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

### For Specification Changes

Specification changes require more discussion:

1. Open an issue describing the proposed change
2. Discuss with maintainers and community
3. If approved, submit a PR with:
   - Spec changes
   - Updated sample code (if applicable)
   - Changelog entry

## Code Style

### JavaScript/Node.js
- Use ES modules
- Use async/await
- Include JSDoc comments

### Python
- Follow PEP 8
- Use type hints
- Include docstrings

### Dart/Flutter
- Follow Effective Dart
- Use null safety

### Swift
- Follow Swift API Design Guidelines

### Kotlin
- Follow Kotlin coding conventions

## Commit Messages

Use clear, descriptive commit messages:

```
Add: Node.js webhook verification example
Fix: Typo in authentication section
Update: Python sample to use latest SDK
Docs: Clarify scope requirements
```

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn

## Questions?

- Open an issue for general questions
- Contact tech@cashku.my for partnership inquiries

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
