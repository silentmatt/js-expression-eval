# Changelog

## [2.1.4](https://github.com/oat-sa/expr-eval/releases/tag/v2.1.4) - 2023-08-25

- _Fix_ [ADF-1568](https://oat-sa.atlassian.net/browse/ADF-1568) : Vulnerabilities in dependencies [#19](https://github.com/oat-sa/expr-eval/pull/19)

## [2.1.3](https://github.com/oat-sa/expr-eval/releases/tag/v2.1.3) - 2023-04-27

- _Feature_ [ADF-1417](https://oat-sa.atlassian.net/browse/ADF-1417) : Upgrade to Node 18 [#16](https://github.com/oat-sa/expr-eval/pull/16)

## [2.1.2](https://github.com/oat-sa/expr-eval/releases/tag/v2.1.2) - 2023-03-03

- _Fix_ [TR-5072](https://oat-sa.atlassian.net/browse/TR-5072) : Correct the sum commutativity [#14](https://github.com/oat-sa/expr-eval/pull/14)

## [2.1.1](https://github.com/oat-sa/expr-eval/releases/tag/v2.1.1) - 2023-03-01

- _Fix_ [TR-5072](https://oat-sa.atlassian.net/browse/TR-5072) : Correct precedence for compound percentage operator [#12](https://github.com/oat-sa/expr-eval/pull/12)

## [2.1.0](https://github.com/oat-sa/expr-eval/releases/tag/v2.1.0) - 2023-02-27

- _Feature_ [TR-5072](https://oat-sa.atlassian.net/browse/TR-5072) : Add a percentage operator [#10](https://github.com/oat-sa/expr-eval/pull/10)

## [2.0.0](https://github.com/oat-sa/expr-eval/releases/tag/2.0.0) - 2023-02-23

Add changes from version `2.0.2` of the base repository.

Also, fix a security issue by replacing Uglify with Terser

### Added

- Added non-default exports when using the ES module format. This allows `import { Parser } from 'expr-eval'` to work in TypeScript. The default export is still available for backward compatibility.

- Added the `if(condition, trueValue, falseValue)` function back. The ternary operator is still recommended if you need to only evaluate one branch, but we're keep this as an option at least for now.

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

## [1.3.2](https://github.com/oat-sa/expr-eval/releases/tag/1.3.2) - 2023-02-22

Security fix from #6

## [1.3.1](https://github.com/oat-sa/expr-eval/releases/tag/1.3.1) - 2023-02-22

Add changes from version `1.2.3` of the base repository.

Also, update the dependencies: these are only tooling, so they should not harm.

- Silentmatt v1.2.3 [#4](https://github.com/oat-sa/expr-eval/pull/4)

## [1.3.0](https://github.com/oat-sa/expr-eval/releases/tag/1.3.0) - 2019-01-31

[Feature] [TAO-7378](https://oat-sa.atlassian.net/browse/TAO-7378) Allow to use functions as binary operators when they are prefixed with a `@`. #1

Fork from [silentmatt/expr-eval v1.2.2](https://github.com/silentmatt/expr-eval)
