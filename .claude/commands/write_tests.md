# Write unit tests for: $ARGUMENTS

Testing conventions:

* Use Vitest with React Testing Library
* Place test files in a `__tests__` directory in the same folder as the source file
* Name test files as `[filename].test.ts` or `[filename].test.tsx`
* Use `@/` prefix for imports

Coverage:

* Test happy paths
* Test edge cases
* Test error states
* Focus on testing behaviors and public APIs rather than implementation details

After writing the tests, run them with:

```bash
npm run test -- <path-to-test-file>
```

Fix any failures before finishing.
