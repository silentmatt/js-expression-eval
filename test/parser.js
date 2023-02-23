/* global describe, it */

'use strict';

var assert = require('assert');
var Parser = require('../dist/bundle').Parser;

describe('Parser', function () {
  [
    { name: 'normal parse()', parser: new Parser() },
    { name: 'disallowing member access', parser: new Parser({ allowMemberAccess: false }) }
  ].forEach(function (tcase) {
    var parser = tcase.parser;
    describe(tcase.name, function () {
      it('should skip comments', function () {
        assert.strictEqual(parser.evaluate('2/* comment */+/* another comment */3'), 5);
        assert.strictEqual(parser.evaluate('2/* comment *///* another comment */3'), 2 / 3);
        assert.strictEqual(parser.evaluate('/* comment at the beginning */2 + 3/* unterminated comment'), 5);
        assert.strictEqual(parser.evaluate('2 +/* comment\n with\n multiple\n lines */3'), 5);
      });

      it('should ignore whitespace', function () {
        assert.strictEqual(parser.evaluate(' 3\r + \n \t 4 '), 7);
      });

      it('should accept variables starting with E', function () {
        assert.strictEqual(parser.parse('2 * ERGONOMIC').evaluate({ ERGONOMIC: 1000 }), 2000);
      });

      it('should accept variables starting with PI', function () {
        assert.strictEqual(parser.parse('1 / PITTSBURGH').evaluate({ PITTSBURGH: 2 }), 0.5);
      });

      it('should fail on empty parentheses', function () {
        assert.throws(function () { parser.parse('5/()'); }, Error);
      });

      it('should fail on 5/', function () {
        assert.throws(function () { parser.parse('5/'); }, Error);
      });

      it('should parse numbers', function () {
        assert.strictEqual(parser.evaluate('123'), 123);
        assert.strictEqual(parser.evaluate('123.'), 123);
        assert.strictEqual(parser.evaluate('123.456'), 123.456);
        assert.strictEqual(parser.evaluate('.456'), 0.456);
        assert.strictEqual(parser.evaluate('0.456'), 0.456);
        assert.strictEqual(parser.evaluate('0.'), 0);
        assert.strictEqual(parser.evaluate('.0'), 0);
        assert.strictEqual(parser.evaluate('123.+3'), 126);
        assert.strictEqual(parser.evaluate('2/123'), 2 / 123);
      });

      it('should parse numbers using scientific notation', function () {
        assert.strictEqual(parser.evaluate('123e2'), 12300);
        assert.strictEqual(parser.evaluate('123E2'), 12300);
        assert.strictEqual(parser.evaluate('123e12'), 123000000000000);
        assert.strictEqual(parser.evaluate('123e+12'), 123000000000000);
        assert.strictEqual(parser.evaluate('123E+12'), 123000000000000);
        assert.strictEqual(parser.evaluate('123e-12'), 0.000000000123);
        assert.strictEqual(parser.evaluate('123E-12'), 0.000000000123);
        assert.strictEqual(parser.evaluate('1.7e308'), 1.7e308);
        assert.strictEqual(parser.evaluate('1.7e-308'), 1.7e-308);
        assert.strictEqual(parser.evaluate('123.e3'), 123000);
        assert.strictEqual(parser.evaluate('123.456e+1'), 1234.56);
        assert.strictEqual(parser.evaluate('.456e-3'), 0.000456);
        assert.strictEqual(parser.evaluate('0.456'), 0.456);
        assert.strictEqual(parser.evaluate('0e3'), 0);
        assert.strictEqual(parser.evaluate('0e-3'), 0);
        assert.strictEqual(parser.evaluate('0e+3'), 0);
        assert.strictEqual(parser.evaluate('.0e+3'), 0);
        assert.strictEqual(parser.evaluate('.0e-3'), 0);
        assert.strictEqual(parser.evaluate('123e5+4'), 12300004);
        assert.strictEqual(parser.evaluate('123e+5+4'), 12300004);
        assert.strictEqual(parser.evaluate('123e-5+4'), 4.00123);
        assert.strictEqual(parser.evaluate('123e0'), 123);
        assert.strictEqual(parser.evaluate('123e01'), 1230);
        assert.strictEqual(parser.evaluate('123e+00000000002'), 12300);
        assert.strictEqual(parser.evaluate('123e-00000000002'), 1.23);
        assert.strictEqual(parser.evaluate('e1', { e1: 42 }), 42);
        assert.strictEqual(parser.evaluate('e+1', { e: 12 }), 13);
      });

      it('should fail on invalid numbers', function () {
        assert.throws(function () { parser.parse('123..'); }, Error);
        assert.throws(function () { parser.parse('0..123'); }, Error);
        assert.throws(function () { parser.parse('0..'); }, Error);
        assert.throws(function () { parser.parse('.0.'); }, Error);
        assert.throws(function () { parser.parse('.'); }, Error);
        assert.throws(function () { parser.parse('1.23e'); }, Error);
        assert.throws(function () { parser.parse('1.23e+'); }, Error);
        assert.throws(function () { parser.parse('1.23e-'); }, Error);
        assert.throws(function () { parser.parse('1.23e++4'); }, Error);
        assert.throws(function () { parser.parse('1.23e--4'); }, Error);
        assert.throws(function () { parser.parse('1.23e+-4'); }, Error);
        assert.throws(function () { parser.parse('1.23e4-'); }, Error);
        assert.throws(function () { parser.parse('1.23ee4'); }, Error);
        assert.throws(function () { parser.parse('1.23ee.4'); }, Error);
        assert.throws(function () { parser.parse('1.23e4.0'); }, Error);
        assert.throws(function () { parser.parse('123e.4'); }, Error);
      });

      it('should parse hexadecimal integers correctly', function () {
        assert.strictEqual(parser.evaluate('0x0'), 0x0);
        assert.strictEqual(parser.evaluate('0x1'), 0x1);
        assert.strictEqual(parser.evaluate('0xA'), 0xA);
        assert.strictEqual(parser.evaluate('0xF'), 0xF);
        assert.strictEqual(parser.evaluate('0x123'), 0x123);
        assert.strictEqual(parser.evaluate('0x123ABCD'), 0x123ABCD);
        assert.strictEqual(parser.evaluate('0xDEADBEEF'), 0xDEADBEEF);
        assert.strictEqual(parser.evaluate('0xdeadbeef'), 0xdeadbeef);
        assert.strictEqual(parser.evaluate('0xABCDEF'), 0xABCDEF);
        assert.strictEqual(parser.evaluate('0xabcdef'), 0xABCDEF);
        assert.strictEqual(parser.evaluate('0x1e+4'), 0x1e + 4);
        assert.strictEqual(parser.evaluate('0x1E+4'), 0x1e + 4);
        assert.strictEqual(parser.evaluate('0x1e-4'), 0x1e - 4);
        assert.strictEqual(parser.evaluate('0x1E-4'), 0x1e - 4);
        assert.strictEqual(parser.evaluate('0xFFFFFFFF'), Math.pow(2, 32) - 1);
        assert.strictEqual(parser.evaluate('0x100000000'), Math.pow(2, 32));
        assert.strictEqual(parser.evaluate('0x1FFFFFFFFFFFFF'), Math.pow(2, 53) - 1);
        assert.strictEqual(parser.evaluate('0x20000000000000'), Math.pow(2, 53));
      });

      it('should parse binary integers correctly', function () {
        assert.strictEqual(parser.evaluate('0b0'), 0);
        assert.strictEqual(parser.evaluate('0b1'), 1);
        assert.strictEqual(parser.evaluate('0b01'), 1);
        assert.strictEqual(parser.evaluate('0b10'), 2);
        assert.strictEqual(parser.evaluate('0b100'), 4);
        assert.strictEqual(parser.evaluate('0b101'), 5);
        assert.strictEqual(parser.evaluate('0b10101'), 21);
        assert.strictEqual(parser.evaluate('0b10111'), 23);
        assert.strictEqual(parser.evaluate('0b11111'), 31);
        assert.strictEqual(parser.evaluate('0b11111111111111111111111111111111'), Math.pow(2, 32) - 1);
        assert.strictEqual(parser.evaluate('0b100000000000000000000000000000000'), Math.pow(2, 32));
        assert.strictEqual(parser.evaluate('0b11111111111111111111111111111111111111111111111111111'), Math.pow(2, 53) - 1);
        assert.strictEqual(parser.evaluate('0b100000000000000000000000000000000000000000000000000000'), Math.pow(2, 53));
      });

      it('should fail on invalid hexadecimal numbers', function () {
        assert.throws(function () { parser.parse('0x'); }, Error);
        assert.throws(function () { parser.parse('0x + 1'); }, Error);
        assert.throws(function () { parser.parse('0x1.23'); }, Error);
        assert.throws(function () { parser.parse('0xG'); }, Error);
        assert.throws(function () { parser.parse('0xx0'); }, Error);
        assert.throws(function () { parser.parse('0x1g'); }, Error);
        assert.throws(function () { parser.parse('1x0'); }, Error);
      });

      it('should fail on invalid binary numbers', function () {
        assert.throws(function () { parser.parse('0b'); }, Error);
        assert.throws(function () { parser.parse('0b + 1'); }, Error);
        assert.throws(function () { parser.parse('0b1.1'); }, Error);
        assert.throws(function () { parser.parse('0b2'); }, Error);
        assert.throws(function () { parser.parse('0bb0'); }, Error);
        assert.throws(function () { parser.parse('0b1e+1'); }, Error);
        assert.throws(function () { parser.parse('1b0'); }, Error);
      });

      it('should fail on unknown characters', function () {
        assert.throws(function () { parser.parse('1 + @'); }, Error);
      });

      it('should fail with partial operators', function () {
        assert.throws(function () { parser.parse('"a" | "b"'); }, Error);
        assert.throws(function () { parser.parse('2 = 2'); }, Error);
        assert.throws(function () { parser.parse('2 ! 3'); }, Error);
        assert.throws(function () { parser.parse('1 o 0'); }, Error);
        assert.throws(function () { parser.parse('1 an 2'); }, Error);
        assert.throws(function () { parser.parse('1 a 2'); }, Error);
      });

      it('should parse strings', function () {
        assert.strictEqual(parser.evaluate('\'asdf\''), 'asdf');
        assert.strictEqual(parser.evaluate('"asdf"'), 'asdf');
        assert.strictEqual(parser.evaluate('""'), '');
        assert.strictEqual(parser.evaluate('\'\''), '');
        assert.strictEqual(parser.evaluate('"  "'), '  ');
        assert.strictEqual(parser.evaluate('"a\nb\tc"'), 'a\nb\tc');
        assert.strictEqual(parser.evaluate('"Nested \'single quotes\'"'), 'Nested \'single quotes\'');
        assert.strictEqual(parser.evaluate('\'Nested "double quotes"\''), 'Nested "double quotes"');
        assert.strictEqual(parser.evaluate('\'Single quotes \\\'inside\\\' single quotes\''), 'Single quotes \'inside\' single quotes');
        assert.strictEqual(parser.evaluate('"Double quotes \\"inside\\" double quotes"'), 'Double quotes "inside" double quotes');
        assert.strictEqual(parser.evaluate('"\n"'), '\n');
        assert.strictEqual(parser.evaluate('"\\\'\\"\\\\\\/\\b\\f\\n\\r\\t\\u1234"'), '\'"\\/\b\f\n\r\t\u1234');
        assert.strictEqual(parser.evaluate('"\'\\"\\\\\\/\\b\\f\\n\\r\\t\\u1234"'), '\'"\\/\b\f\n\r\t\u1234');
        assert.strictEqual(parser.evaluate('\'\\\'\\"\\\\\\/\\b\\f\\n\\r\\t\\u1234\''), '\'"\\/\b\f\n\r\t\u1234');
        assert.strictEqual(parser.evaluate('\'\\\'"\\\\\\/\\b\\f\\n\\r\\t\\u1234\''), '\'"\\/\b\f\n\r\t\u1234');
        assert.strictEqual(parser.evaluate('"\\uFFFF"'), '\uFFFF');
        assert.strictEqual(parser.evaluate('"\\u0123"'), '\u0123');
        assert.strictEqual(parser.evaluate('"\\u4567"'), '\u4567');
        assert.strictEqual(parser.evaluate('"\\u89ab"'), '\u89ab');
        assert.strictEqual(parser.evaluate('"\\ucdef"'), '\ucdef');
        assert.strictEqual(parser.evaluate('"\\uABCD"'), '\uABCD');
        assert.strictEqual(parser.evaluate('"\\uEF01"'), '\uEF01');
        assert.strictEqual(parser.evaluate('"\\u11111"'), '\u11111');
      });

      it('should fail on bad strings', function () {
        assert.throws(function () { parser.parse('\'asdf"'); }, Error);
        assert.throws(function () { parser.parse('"asdf\''); }, Error);
        assert.throws(function () { parser.parse('"asdf'); }, Error);
        assert.throws(function () { parser.parse('\'asdf'); }, Error);
        assert.throws(function () { parser.parse('\'asdf\\'); }, Error);
        assert.throws(function () { parser.parse('\''); }, Error);
        assert.throws(function () { parser.parse('"'); }, Error);
        assert.throws(function () { parser.parse('"\\x"'); }, Error);
        assert.throws(function () { parser.parse('"\\u123"'); }, Error);
        assert.throws(function () { parser.parse('"\\u12"'); }, Error);
        assert.throws(function () { parser.parse('"\\u1"'); }, Error);
        assert.throws(function () { parser.parse('"\\uGGGG"'); }, Error);
      });

      it('should parse arrays correctly', function () {
        assert.strictEqual(parser.parse('[1, 2, 3+4, 5*6, (7/8)]').toString(), '[1, 2, (3 + 4), (5 * 6), (7 / 8)]');
      });

      it('should parse empty arrays correctly', function () {
        assert.strictEqual(parser.parse('[]').toString(), '[]');
      });

      it('should fail with missing ]', function () {
        assert.throws(function () { parser.parse('[1, 2, 3+4, 5*6, (7/8)'); }, Error);
      });

      it('should parse operators that look like functions as function calls', function () {
        assert.strictEqual(parser.parse('sin 2^3').toString(), '(sin (2 ^ 3))');
        assert.strictEqual(parser.parse('sin(2)^3').toString(), '((sin 2) ^ 3)');
        assert.strictEqual(parser.parse('sin 2^3').evaluate(), Math.sin(Math.pow(2, 3)));
        assert.strictEqual(parser.parse('sin(2)^3').evaluate(), Math.pow(Math.sin(2), 3));
      });

      it('should parse named prefix operators as function names at the end of expressions', function () {
        assert.strictEqual(parser.parse('sin;').toString(), '(sin)');
        assert.strictEqual(parser.parse('(sin)').toString(), 'sin');
        assert.strictEqual(parser.parse('sin; (2)^3').toString(), '(sin;(2 ^ 3))');
        assert.deepStrictEqual(parser.parse('f(sin, sqrt)').evaluate({ f: function (a, b) { return [ a, b ]; }}), [ Math.sin, Math.sqrt ]);
        assert.strictEqual(parser.parse('sin').evaluate(), Math.sin);
        assert.strictEqual(parser.parse('cos;').evaluate(), Math.cos);
        assert.strictEqual(parser.parse('cos;tan').evaluate(), Math.tan);
        assert.strictEqual(parser.parse('(floor)').evaluate(), Math.floor);
        assert.strictEqual(parser.parse('4; ceil').evaluate(), Math.ceil);
      });

      it('unary + and - should not be parsed as function calls', function () {
        assert.strictEqual(parser.parse('-2^3').toString(), '(-(2 ^ 3))');
        assert.strictEqual(parser.parse('-(2)^3').toString(), '(-(2 ^ 3))');
      });

      it('should treat ∙ and • as * operators', function () {
        assert.strictEqual(parser.parse('2 ∙ 3').toString(), '(2 * 3)');
        assert.strictEqual(parser.parse('4 • 5').toString(), '(4 * 5)');
      });

      it('should parse variables that start with operators', function () {
        assert.strictEqual(parser.parse('org > 5').toString(), '(org > 5)');
        assert.strictEqual(parser.parse('android * 2').toString(), '(android * 2)');
        assert.strictEqual(parser.parse('single == 1').toString(), '(single == 1)');
      });

      it('should parse valid variable names correctly', function () {
        assert.deepStrictEqual(parser.parse('a').variables(), [ 'a' ]);
        assert.deepStrictEqual(parser.parse('abc').variables(), [ 'abc' ]);
        assert.deepStrictEqual(parser.parse('a+b').variables(), [ 'a', 'b' ]);
        assert.deepStrictEqual(parser.parse('ab+c').variables(), [ 'ab', 'c' ]);
        assert.deepStrictEqual(parser.parse('a1').variables(), [ 'a1' ]);
        assert.deepStrictEqual(parser.parse('a_1').variables(), [ 'a_1' ]);
        assert.deepStrictEqual(parser.parse('a_').variables(), [ 'a_' ]);
        assert.deepStrictEqual(parser.parse('a_c').variables(), [ 'a_c' ]);
        assert.deepStrictEqual(parser.parse('A').variables(), [ 'A' ]);
        assert.deepStrictEqual(parser.parse('ABC').variables(), [ 'ABC' ]);
        assert.deepStrictEqual(parser.parse('A+B').variables(), [ 'A', 'B' ]);
        assert.deepStrictEqual(parser.parse('AB+C').variables(), [ 'AB', 'C' ]);
        assert.deepStrictEqual(parser.parse('A1').variables(), [ 'A1' ]);
        assert.deepStrictEqual(parser.parse('A_1').variables(), [ 'A_1' ]);
        assert.deepStrictEqual(parser.parse('A_C').variables(), [ 'A_C' ]);
        assert.deepStrictEqual(parser.parse('abcdefg/hijklmnop+qrstuvwxyz').variables(), [ 'abcdefg', 'hijklmnop', 'qrstuvwxyz' ]);
        assert.deepStrictEqual(parser.parse('ABCDEFG/HIJKLMNOP+QRSTUVWXYZ').variables(), [ 'ABCDEFG', 'HIJKLMNOP', 'QRSTUVWXYZ' ]);
        assert.deepStrictEqual(parser.parse('abc123+def456*ghi789/jkl0').variables(), [ 'abc123', 'def456', 'ghi789', 'jkl0' ]);
        assert.deepStrictEqual(parser.parse('_').variables(), [ '_' ]);
        assert.deepStrictEqual(parser.parse('_x').variables(), [ '_x' ]);
        assert.deepStrictEqual(parser.parse('$x').variables(), [ '$x' ]);
        assert.deepStrictEqual(parser.parse('$xyz').variables(), [ '$xyz' ]);
        assert.deepStrictEqual(parser.parse('$a_sdf').variables(), [ '$a_sdf' ]);
        assert.deepStrictEqual(parser.parse('$xyz_123').variables(), [ '$xyz_123' ]);
        assert.deepStrictEqual(parser.parse('_xyz_123').variables(), [ '_xyz_123' ]);
      });

      it('should not parse invalid variables', function () {
        assert.throws(function () { parser.parse('a$x'); }, /parse error/);
        assert.throws(function () { parser.parse('ab$'); }, /parse error/);
      });

      it('should not parse a single $ as a variable', function () {
        assert.throws(function () { parser.parse('$'); }, /parse error/);
      });

      it('should not allow leading digits in variable names', function () {
        assert.throws(function () { parser.parse('1a'); }, /parse error/);
        assert.throws(function () { parser.parse('1_'); }, /parse error/);
        assert.throws(function () { parser.parse('1_a'); }, /parse error/);
      });

      it('should not allow leading digits or _ after $ in variable names', function () {
        assert.throws(function () { parser.parse('$0'); }, /parse error/);
        assert.throws(function () { parser.parse('$1a'); }, /parse error/);
        assert.throws(function () { parser.parse('$_'); }, /parse error/);
        assert.throws(function () { parser.parse('$_x'); }, /parse error/);
      });

      it('should track token positions correctly', function () {
        assert.throws(function () { parser.parse('@23'); }, /parse error \[1:1]/);
        assert.throws(function () { parser.parse('\n@23'); }, /parse error \[2:1]/);
        assert.throws(function () { parser.parse('1@3'); }, /parse error \[1:2]/);
        assert.throws(function () { parser.parse('12@'); }, /parse error \[1:3]/);
        assert.throws(function () { parser.parse('12@\n'); }, /parse error \[1:3]/);
        assert.throws(function () { parser.parse('@23 +\n45 +\n6789'); }, /parse error \[1:1]/);
        assert.throws(function () { parser.parse('1@3 +\n45 +\n6789'); }, /parse error \[1:2]/);
        assert.throws(function () { parser.parse('12@ +\n45 +\n6789'); }, /parse error \[1:3]/);
        assert.throws(function () { parser.parse('123 +\n@5 +\n6789'); }, /parse error \[2:1]/);
        assert.throws(function () { parser.parse('123 +\n4@ +\n6789'); }, /parse error \[2:2]/);
        assert.throws(function () { parser.parse('123 +\n45@+\n6789'); }, /parse error \[2:3]/);
        assert.throws(function () { parser.parse('123 +\n45 +\n@789'); }, /parse error \[3:1]/);
        assert.throws(function () { parser.parse('123 +\n45 +\n6@89'); }, /parse error \[3:2]/);
        assert.throws(function () { parser.parse('123 +\n45 +\n67@9'); }, /parse error \[3:3]/);
        assert.throws(function () { parser.parse('123 +\n45 +\n679@'); }, /parse error \[3:4]/);
        assert.throws(function () { parser.parse('123 +\n\n679@'); }, /parse error \[3:4]/);
        assert.throws(function () { parser.parse('123 +\n\n\n\n\n679@'); }, /parse error \[6:4]/);
      });

      it('should allow operators to be disabled', function () {
        var parser = new Parser({
          operators: {
            add: false,
            sin: false,
            remainder: false,
            divide: false
          }
        });
        assert.throws(function () { parser.parse('+1'); }, /\+/);
        assert.throws(function () { parser.parse('1 + 2'); }, /\+/);
        assert.strictEqual(parser.parse('sin(0)').toString(), 'sin(0)');
        assert.throws(function () { parser.evaluate('sin(0)'); }, /sin/);
        assert.throws(function () { parser.parse('4 % 5'); }, /%/);
        assert.throws(function () { parser.parse('4 / 5'); }, /\//);
      });

      it('should allow operators to be explicitly enabled', function () {
        var parser = new Parser({
          operators: {
            add: true,
            sqrt: true,
            divide: true,
            'in': true,
            assignment: true
          }
        });
        assert.strictEqual(parser.evaluate('+(-1)'), -1);
        assert.strictEqual(parser.evaluate('sqrt(16)'), 4);
        assert.strictEqual(parser.evaluate('4 / 6'), 2 / 3);
        assert.strictEqual(parser.evaluate('3 in array', { array: [ 1, 2, 3 ] }), true);
        assert.strictEqual(parser.evaluate('x = 4', { x: 2 }), 4);
      });
    });

    it('should allow addition operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          add: false
        }
      });

      assert.throws(function () { parser.parse('2 + 3'); }, /\+/);
    });

    it('should allow comparison operators to be disabled', function () {
      var parser = new Parser({
        operators: {
          comparison: false
        }
      });

      assert.throws(function () { parser.parse('1 == 1'); }, /=/);
      assert.throws(function () { parser.parse('1 != 2'); }, /!/);
      assert.throws(function () { parser.parse('1 > 0'); }, />/);
      assert.throws(function () { parser.parse('1 >= 0'); }, />/);
      assert.throws(function () { parser.parse('1 < 2'); }, /</);
      assert.throws(function () { parser.parse('1 <= 2'); }, /</);
    });

    it('should allow concatenate operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          concatenate: false
        }
      });

      assert.throws(function () { parser.parse('"as" || "df"'); }, /\|/);
    });

    it('should allow conditional operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          conditional: false
        }
      });

      assert.throws(function () { parser.parse('true ? 1 : 0'); }, /\?/);
    });

    it('should allow division operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          divide: false
        }
      });

      assert.throws(function () { parser.parse('2 / 3'); }, /\//);
    });

    it('should allow factorial operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          factorial: false
        }
      });

      assert.throws(function () { parser.parse('5!'); }, /!/);
    });

    it('should allow in operator to be enabled', function () {
      var parser = new Parser({
        operators: {
          'in': true
        }
      });

      assert.throws(function () { parser.parse('5 * in'); }, Error);
      assert.strictEqual(parser.evaluate('5 in a', { a: [ 2, 3, 5 ] }), true);
    });

    it('should allow in operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          'in': false
        }
      });

      assert.throws(function () { parser.parse('5 in a'); }, Error);
      assert.strictEqual(parser.evaluate('5 * in', { 'in': 3 }), 15);
    });

    it('should allow logical operators to be disabled', function () {
      var parser = new Parser({
        operators: {
          logical: false
        }
      });

      assert.throws(function () { parser.parse('true and true'); }, Error);
      assert.throws(function () { parser.parse('true or false'); }, Error);
      assert.throws(function () { parser.parse('not false'); }, Error);

      assert.strictEqual(parser.evaluate('and * or + not', { and: 3, or: 5, not: 2 }), 17);
    });

    it('should allow multiplication operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          multiply: false
        }
      });

      assert.throws(function () { parser.parse('3 * 4'); }, /\*/);
    });

    it('should allow power operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          power: false
        }
      });

      assert.throws(function () { parser.parse('3 ^ 4'); }, /\^/);
    });

    it('should allow remainder operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          remainder: false
        }
      });

      assert.throws(function () { parser.parse('3 % 2'); }, /%/);
    });

    it('should allow subtraction operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          subtract: false
        }
      });

      assert.throws(function () { parser.parse('5 - 3'); }, /-/);
    });

    it('should allow assignment operator to be enabled', function () {
      var parser = new Parser({
        operators: {
          'assignment': true
        }
      });

      assert.throws(function () { parser.parse('a ='); }, Error);
      assert.strictEqual(parser.evaluate('a = 5', {}), 5);
    });

    it('should allow assignment operator to be disabled', function () {
      var parser = new Parser({
        operators: {
          'assignment': false
        }
      });

      assert.throws(function () { parser.parse('a = 5'); }, Error);
    });

    it('should allow assignment operator by default', function () {
      var parser = new Parser();

      assert.strictEqual(parser.evaluate('a = 5', {}), 5);
    });

    it('should allow arrays to be enabled', function () {
      var parser = new Parser({
        operators: {
          array: true
        }
      });

      assert.deepStrictEqual(parser.evaluate('[1, 2, 3]'), [1, 2, 3]);
      assert.strictEqual(parser.evaluate('a[0]', { a: [ 4, 2 ] }), 4);
    });

    it('should allow arrays to be disabled', function () {
      var parser = new Parser({
        operators: {
          array: false
        }
      });

      assert.throws(function () { parser.parse('[1, 2, 3]'); }, /\[/);
      assert.throws(function () { parser.parse('a[0]'); }, /\[/);
    });

    it('Should allow functions to be disabled', function () {
      var parser = new Parser({
        operators: {
          fndef: false
        }
      });
      var obj = {};
      assert.throws(function () { parser.parse('f(x) = x * x'); }, /function definition is not permitted/);
      assert.strictEqual('f' in obj, false);
      assert.strictEqual('x' in obj, false);
    });

    it('Should allow functions to be enabled', function () {
      var parser = new Parser({
        operators: {
          fndef: true
        }
      });
      var obj = {};
      assert.strictEqual(parser.evaluate('f(x) = x * x', obj) instanceof Function, true);
      assert.strictEqual(obj.f instanceof Function, true);
      assert.strictEqual(obj.f(3), 9);
    });

    it('Disabling assignment should disable function definition', function () {
      var parser = new Parser({
        operators: {
          assignment: false
        }
      });
      var obj = {};
      assert.throws(function () { parser.parse('f(x) = x * x'); }, Error);
      assert.strictEqual('f' in obj, false);
      assert.strictEqual('x' in obj, false);
    });
  });

  it('should disallow member access', function () {
    var parser = new Parser({ allowMemberAccess: false });
    assert.throws(function () { parser.evaluate('min.bind'); }, /member access is not permitted/);
    assert.throws(function () { parser.evaluate('min.bind()'); }, /member access is not permitted/);
    assert.throws(function () { parser.evaluate('32 + min.bind'); }, /member access is not permitted/);
    assert.throws(function () { parser.evaluate('a.b', { a: { b: 2 } }); }, /member access is not permitted/);
  });
});
