JavaScript Expression Evaluator
===============================

[![npm](https://img.shields.io/npm/v/expr-eval.svg?maxAge=3600)](https://www.npmjs.com/package/expr-eval)
[![CDNJS version](https://img.shields.io/cdnjs/v/expr-eval.svg?maxAge=3600)](https://cdnjs.com/libraries/expr-eval)
[![Build Status](https://travis-ci.org/silentmatt/expr-eval.svg?branch=master)](https://travis-ci.org/silentmatt/expr-eval)

Description
-------------------------------------

Parses and evaluates mathematical expressions. It's a safer and more
math-oriented alternative to using JavaScript’s `eval` function for mathematical
expressions.

It has built-in support for common math operators and functions. Additionally,
you can add your own JavaScript functions. Expressions can be evaluated
directly, or compiled into native JavaScript functions.

Installation
-------------------------------------

    npm install expr-eval

Basic Usage
-------------------------------------
```js
    const Parser = require('expr-eval').Parser;

    const parser = new Parser();
    let expr = parser.parse('2 * x + 1');
    console.log(expr.evaluate({ x: 3 })); // 7

    // or
    Parser.evaluate('6 * x', { x: 7 }) // 42
```
Documentation
-------------------------------------

* [Parser](#parser)
    - [Parser()](#parser-1)
    - [parse(expression: string)](#parseexpression-string)
    - [Parser.parse(expression: string)](#parserparseexpression-string)
    - [Parser.evaluate(expression: string, variables?: object)](#parserevaluateexpression-string-variables-object)
* [Expression](#expression)
    - [evaluate(variables?: object)](#evaluatevariables-object)
    - [substitute(variable: string, expression: Expression | string | number)](#substitutevariable-string-expression-expression--string--number)
    - [simplify(variables: object)](#simplifyvariables-object)
    - [variables(options?: object)](#variablesoptions-object)
    - [symbols(options?: object)](#symbolsoptions-object)
    - [toString()](#tostring)
    - [toJSFunction(parameters: array | string, variables?: object)](#tojsfunctionparameters-array--string-variables-object)
* [Expression Syntax](#expression-syntax)
    - [Operator Precedence](#operator-precedence)
    - [Unary operators](#unary-operators)
    - [Array literals](#array-literals)
    - [Pre-defined functions](#pre-defined-functions)
    - [Custom JavaScript functions](#custom-javascript-functions)
    - [Constants](#constants)

### Parser ###

Parser is the main class in the library. It has as single `parse` method, and
"static" methods for parsing and evaluating expressions.

#### Parser()

Constructs a new `Parser` instance.

The constructor takes an optional `options` parameter that allows you to enable or disable operators.

For example, the following will create a `Parser` that does not allow comparison or logical operators, but does allow `in`:
```js
    const parser = new Parser({
      operators: {
        // These default to true, but are included to be explicit
        add: true,
        concatenate: true,
        conditional: true,
        divide: true,
        factorial: true,
        multiply: true,
        power: true,
        remainder: true,
        subtract: true,

        // Disable and, or, not, <, ==, !=, etc.
        logical: false,
        comparison: false,

        // Disable 'in' and = operators
        'in': false,
        assignment: false
      }
    });
```
#### parse(expression: string)

Convert a mathematical expression into an `Expression` object.

#### Parser.parse(expression: string)

Static equivalent of `new Parser().parse(expression)`.

#### Parser.evaluate(expression: string, variables?: object)

Parse and immediately evaluate an expression using the values and functions from
the `variables` object.

Parser.evaluate(expr, vars) is equivalent to calling
Parser.parse(expr).evaluate(vars).

### Expression ###

`Parser.parse(str)` returns an `Expression` object. `Expression`s are similar to
JavaScript functions, i.e. they can be "called" with variables bound to
passed-in values. In fact, they can even be converted into JavaScript
functions.

#### evaluate(variables?: object)

Evaluate the expression, with variables bound to the values in {variables}. Each
variable in the expression is bound to the corresponding member of the
`variables` object. If there are unbound variables, `evaluate` will throw an
exception.
```js
    js> expr = Parser.parse("2 ^ x");
    (2^x)
    js> expr.evaluate({ x: 3 });
    8
```
#### substitute(variable: string, expression: Expression | string | number)

Create a new `Expression` with the specified variable replaced with another
expression. This is similar to function composition. If `expression` is a string
or number, it will be parsed into an `Expression`.
```js
    js> expr = Parser.parse("2 * x + 1");
    ((2*x)+1)
    js> expr.substitute("x", "4 * x");
    ((2*(4*x))+1)
    js> expr2.evaluate({ x: 3 });
    25
```
#### simplify(variables: object)

Simplify constant sub-expressions and replace variable references with literal
values. This is basically a partial evaluation, that does as much of the
calculation as it can with the provided variables. Function calls are not
evaluated (except the built-in operator functions), since they may not be
deterministic.

Simplify is pretty simple. For example, it doesn’t know that addition and
multiplication are associative, so `((2*(4*x))+1)` from the previous example
cannot be simplified unless you provide a value for x. `2*4*x+1` can however,
because it’s parsed as `(((2*4)*x)+1)`, so the `(2*4)` sub-expression will be
replaced with "8", resulting in `((8*x)+1)`.
```js
    js> expr = Parser.parse("x * (y * atan(1))").simplify({ y: 4 });
    (x*3.141592653589793)
    js> expr.evaluate({ x: 2 });
    6.283185307179586
```
#### variables(options?: object)

Get an array of the unbound variables in the expression.
```js
    js> expr = Parser.parse("x * (y * atan(1))");
    (x*(y*atan(1)))
    js> expr.variables();
    x,y
    js> expr.simplify({ y: 4 }).variables();
    x
```
By default, `variables` will return "top-level" objects, so for example, `Parser.parse(x.y.z).variables()` returns `['x']`. If you want to get the whole chain of object members, you can call it with `{ withMembers: true }`. So `Parser.parse(x.y.z).variables({ withMembers: true })` would return `['x.y.z']`.

#### symbols(options?: object)

Get an array of variables, including any built-in functions used in the
expression.
```js
    js> expr = Parser.parse("min(x, y, z)");
    (min(x, y, z))
    js> expr.symbols();
    min,x,y,z
    js> expr.simplify({ y: 4, z: 5 }).symbols();
    min,x
```
Like `variables`, `symbols` accepts an option argument `{ withMembers: true }` to include object members.

#### toString()

Convert the expression to a string. `toString()` surrounds every sub-expression
with parentheses (except literal values, variables, and function calls), so
it’s useful for debugging precedence errors.

#### toJSFunction(parameters: array | string, variables?: object)

Convert an `Expression` object into a callable JavaScript function. `parameters`
is an array of parameter names, or a string, with the names separated by commas.

If the optional `variables` argument is provided, the expression will be
simplified with variables bound to the supplied values.
```js
    js> expr = Parser.parse("x + y + z");
    ((x + y) + z)
    js> f = expr.toJSFunction("x,y,z");
    [Function] // function (x, y, z) { return x + y + z; };
    js> f(1, 2, 3)
    6
    js> f = expr.toJSFunction("y,z", { x: 100 });
    [Function] // function (y, z) { return 100 + y + z; };
    js> f(2, 3)
    105
```
### Expression Syntax ###

The parser accepts a pretty basic grammar. It's similar to normal JavaScript
expressions, but is more math-oriented. For example, the `^` operator is
exponentiation, not xor.

#### Operator Precedence

Operator                 | Associativity | Description
:----------------------- | :------------ | :----------
(...)                    | None          | Grouping
f(), x.y, a[i]           | Left          | Function call, property access, array indexing
!                        | Left          | Factorial
^                        | Right         | Exponentiation
+, -, not, sqrt, etc.    | Right         | Unary prefix operators (see below for the full list)
\*, /, %                 | Left          | Multiplication, division, remainder
+, -, \|\|               | Left          | Addition, subtraction, array/list concatenation
==, !=, >=, <=, >, <, in | Left          | Equals, not equals, etc. "in" means "is the left operand included in the right array operand?"
and                      | Left          | Logical AND
or                       | Left          | Logical OR
x ? y : z                | Right         | Ternary conditional (if x then y else z)
=                        | Right         | Variable assignment
;                        | Left          | Expression separator
```js
    const parser = new Parser({
      operators: {
        'in': true,
        'assignment': true
      }
    });
    // Now parser supports 'x in array' and 'y = 2*x' expressions
```
#### Unary operators

The parser has several built-in "functions" that are actually unary operators.
The primary difference between these and functions are that they can only accept
exactly one argument, and parentheses are optional. With parentheses, they have
the same precedence as function calls, but without parentheses, they keep their
normal precedence (just below `^`). For example, `sin(x)^2` is equivalent to
`(sin x)^2`, and `sin x^2` is equivalent to `sin(x^2)`.

The unary `+` and `-` operators are an exception, and always have their normal
precedence.

Operator | Description
:------- | :----------
-x       | Negation
+x       | Unary plus. This converts it's operand to a number, but has no other effect.
x!       | Factorial (x * (x-1) * (x-2) * … * 2 * 1). gamma(x + 1) for non-integers.
abs x    | Absolute value (magnitude) of x
acos x   | Arc cosine of x (in radians)
acosh x  | Hyperbolic arc cosine of x (in radians)
asin x   | Arc sine of x (in radians)
asinh x  | Hyperbolic arc sine of x (in radians)
atan x   | Arc tangent of x (in radians)
atanh x  | Hyperbolic arc tangent of x (in radians)
cbrt x   | Cube root of x
ceil x   | Ceiling of x — the smallest integer that’s >= x
cos x    | Cosine of x (x is in radians)
cosh x   | Hyperbolic cosine of x (x is in radians)
exp x    | e^x (exponential/antilogarithm function with base e)
expm1 x  | e^x - 1
floor x  | Floor of x — the largest integer that’s <= x
length x | String or array length of x
ln x     | Natural logarithm of x
log x    | Natural logarithm of x (synonym for ln, not base-10)
log10 x  | Base-10 logarithm of x
log2 x   | Base-2 logarithm of x
log1p x  | Natural logarithm of (1 + x)
not x    | Logical NOT operator
round x  | X, rounded to the nearest integer, using "grade-school rounding"
sign x   | Sign of x (-1, 0, or 1 for negative, zero, or positive respectively)
sin x    | Sine of x (x is in radians)
sinh x   | Hyperbolic sine of x (x is in radians)
sqrt x   | Square root of x. Result is NaN (Not a Number) if x is negative.
tan x    | Tangent of x (x is in radians)
tanh x   | Hyperbolic tangent of x (x is in radians)
trunc x  | Integral part of a X, looks like floor(x) unless for negative number

#### Pre-defined functions

Besides the "operator" functions, there are several pre-defined functions. You
can provide your own, by binding variables to normal JavaScript functions.
These are not evaluated by simplify.

Function      | Description
:------------ | :----------
random(n)     | Get a random number in the range [0, n). If n is zero, or not provided, it defaults to 1.
fac(n)        | n! (factorial of n: "n * (n-1) * (n-2) * … * 2 * 1") Deprecated. Use the ! operator instead.
min(a,b,…)    | Get the smallest (minimum) number in the list.
max(a,b,…)    | Get the largest (maximum) number in the list.
hypot(a,b)    | Hypotenuse, i.e. the square root of the sum of squares of its arguments.
pyt(a, b)     | Alias for hypot.
pow(x, y)     | Equivalent to x^y. For consistency with JavaScript's Math object.
atan2(y, x)   | Arc tangent of x/y. i.e. the angle between (0, 0) and (x, y) in radians.
roundTo(x, n) | Rounds x to n places after the decimal point.
map(f, a)     | Array map: Pass each element of `a` the function `f`, and return an array of the results.
fold(f, y, a) | Array fold: Fold/reduce array `a` into a single value, `y` by setting `y = f(y, x, index)` for each element `x` of the array.
filter(f, a)  | Array filter: Return an array containing only the values from `a` where `f(x, index)` is `true`.
indexOf(x, a) | Return the first index of string or array `a` matching the value `x`, or `-1` if not found.
join(sep, a)  | Concatenate the elements of `a`, separated by `sep`.
if(c, a, b)   | Function form of c ? a : b. Note: This always evaluates both `a` and `b`, regardless of whether `c` is `true` or not. Use `c ? a : b` instead if there are side effects, or if evaluating the branches could be expensive.

#### Array literals

Arrays can be created by including the elements inside square `[]` brackets, separated by commas. For example:

    [ 1, 2, 3, 2+2, 10/2, 3! ]

#### Function definitions

You can define functions using the syntax `name(params) = expression`. When it's evaluated, the name will be added to the passed in scope as a function. You can call it later in the expression, or make it available to other expressions by re-using the same scope object. Functions can support multiple parameters, separated by commas.

Examples:
```js
    square(x) = x*x
    add(a, b) = a + b
    factorial(x) = x < 2 ? 1 : x * factorial(x - 1)
```
#### Custom JavaScript functions

If you need additional functions that aren't supported out of the box, you can easily add them in your own code. Instances of the `Parser` class have a property called `functions` that's simply an object with all the functions that are in scope. You can add, replace, or delete any of the properties to customize what's available in the expressions. For example:
```js
    const parser = new Parser();

    // Add a new function
    parser.functions.customAddFunction = function (arg1, arg2) {
      return arg1 + arg2;
    };

    // Remove the factorial function
    delete parser.functions.fac;

    parser.evaluate('customAddFunction(2, 4) == 6'); // true
    //parser.evaluate('fac(3)'); // This will fail
```
#### Constants

The parser also includes a number of pre-defined constants that can be used in expressions. These are shown
in the table below:

Constant     | Description
:----------- | :----------
E            | The value of `Math.E` from your JavaScript runtime
PI           | The value of `Math.PI` from your JavaScript runtime
true         | Logical `true` value
false        | Logical `false` value

Pre-defined constants are stored in `parser.consts`. You can make changes to this property to customise the
constants available to your expressions. For example:
```js
    const parser = new Parser();
    parser.consts.R = 1.234;

    console.log(parser.parse('A+B/R').toString());  // ((A + B) / 1.234)
```
To disable the pre-defined constants, you can replace or delete `parser.consts`:
```js
    const parser = new Parser();
    parser.consts = {};
```

### Tests ###

1. `cd` to the project directory
2. Install development dependencies: `npm install`
3. Run the tests: `npm test`
