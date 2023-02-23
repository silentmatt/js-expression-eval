# Changelog

## [2.0.2] - 2019-09-28

### Added

- Added non-default exports when using the ES module format. This allows `import { Parser } from 'expr-eval'` to work in TypeScript. The default export is still available for backward compatibility.


## [2.0.1] - 2019-09-10

### Added

- Added the `if(condition, trueValue, falseValue)` function back. The ternary operator is still recommended if you need to only evaluate one branch, but we're keep this as an option at least for now.


## [2.0.0] - 2019-09-07

### Added

- Better support for arrays, including literals: `[ 1, 2, 3 ]` and indexing: `array[0]`
- New functions for arrays: `join`, `indexOf`, `map`, `filter`, and `fold`
- Variable assignment: `x = 4`
- Custom function definitions: `myfunction(x, y) = x * y`
- Evaluate multiple expressions by separating them with `;`
- New operators: `log2` (base-2 logarithm), `cbrt` (cube root), `expm1` (`e^x - 1`), `log1p` (`log(1 + x)`), `sign` (essentially `x == 0 ? 0 : x / abs x`)

### Changed

- `min` and `max` functions accept either a parameter list or a single array argument
- `in` operator is enabled by default. It can be disabled by passing { operators: `{ 'in': false } }` to the `Parser` constructor.
- `||` (concatenation operator) now supports strings and arrays

### Removed

- Removed the `if(condition, trueValue, falseValue)` function. Use the ternary conditional operator instead: `condition ? trueValue : falseValue`, or you can add it back easily with a custom function.
