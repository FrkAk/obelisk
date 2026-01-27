# Obelisk - Claude Memory

## Code Standards

### Documentation Style

Use **Google-style docstrings** for all functions, classes, and modules:

```typescript
/**
 * Brief description of what the function does.
 *
 * Args:
 *     paramName: Description of the parameter.
 *     anotherParam: Description of another parameter.
 *
 * Returns:
 *     Description of the return value.
 *
 * Raises:
 *     ErrorType: When this error occurs.
 *
 * Example:
 *     const result = myFunction(arg1, arg2);
 */
```

### Comments Policy

- **NO inline comments** unless explaining a genuinely complex algorithm
- Code must be self-documenting through clear naming
- If you need a comment to explain what code does, refactor the code instead

### Design Principles

- **SOLID** - Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY** - Don't Repeat Yourself
- **KISS** - Keep It Simple, Stupid
- **Composition over Inheritance**
- **Dependency Injection** where it improves testability
- **Early Returns** to reduce nesting

### Clean Code Rules

- Meaningful, descriptive names for variables, functions, and files
- Small, focused functions (prefer < 20 lines)
- Strict TypeScript - no `any` types
- Strict Python - no `any` and strictly type datatypes
- Custom error types for error handling
- Consistent naming: kebab-case for files/folders, PascalCase for components/types, camelCase for functions/variables


## Do NOT Create

- README.md or other documentation files (keep repo clean)
- Unnecessary configuration files
- Test files for trivial code
- NOT EXPOSE PROJECT TO INTERNET

## Plan Maintenance

- Keep `Plan.md` updated as implementation progresses
- Mark completed tasks with [x] instead of [ ]
- Update status and add notes for blockers
- Reference Plan.md for current implementation status

## References

- Plan: `Plan.md` in repo root
- Detailed project documentation: `Obelisk.md`, always refer to this document for feature and design
