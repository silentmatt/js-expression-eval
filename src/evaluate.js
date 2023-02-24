import { INUMBER, IOP1, IOP2, IOP3, IVAR, IFUNCOP, IVARNAME, IFUNCALL, IFUNDEF, IEXPR, IEXPREVAL, IMEMBER, IENDSTATEMENT, IARRAY } from './instruction';

export default function evaluate(tokens, expr, values) {
  var nstack = stackFactory();
  var n1, n2, n3;
  var f, args, argCount;

  if (isExpressionEvaluator(tokens)) {
    return resolveExpression(tokens, values);
  }

  var numTokens = tokens.length;

  for (var i = 0; i < numTokens; i++) {
    var item = tokens[i];
    var type = item.type;
    if (type === INUMBER || type === IVARNAME) {
      nstack.push(item.value, item.value);
    } else if (type === IOP2) {
      var right = nstack.pop();
      var left = nstack.pop();
      n2 = right.value;
      n1 = left.value;
      if (item.value === 'and') {
        nstack.push(item.value, n1 ? !!evaluate(n2, expr, values) : false);
      } else if (item.value === 'or') {
        nstack.push(item.value, n1 ? true : !!evaluate(n2, expr, values));
      } else if (item.value === '=') {
        f = expr.binaryOps[item.value];
        nstack.push(item.value, f(n1, evaluate(n2, expr, values), values));
      } else if ((item.value === '+' || item.value === '-') && right.token === '#' && right.token !== left.token) {
        f = expr.binaryOps[item.value];
        n1 = resolveExpression(n1, values);
        n2 = evaluate([
          { type: INUMBER, value: n1 },
          { type: INUMBER, value: resolveExpression(n2, values) },
          { type: IOP2, value: '*' }
        ], expr, values);
        nstack.push(item.value, f(n1, n2));
      } else {
        f = expr.binaryOps[item.value];
        nstack.push(item.value, f(resolveExpression(n1, values), resolveExpression(n2, values)));
      }
    } else if (type === IOP3) {
      n3 = nstack.popValue();
      n2 = nstack.popValue();
      n1 = nstack.popValue();
      if (item.value === '?') {
        nstack.push(item.value, evaluate(n1 ? n2 : n3, expr, values));
      } else {
        f = expr.ternaryOps[item.value];
        nstack.push(item.value, f(resolveExpression(n1, values), resolveExpression(n2, values), resolveExpression(n3, values)));
      }
    } else if (type === IVAR) {
      if (/^__proto__|prototype|constructor$/.test(item.value)) {
        throw new Error('prototype access detected');
      }
      if (item.value in expr.functions) {
        nstack.push(item.value, expr.functions[item.value]);
      } else if (item.value in expr.unaryOps && expr.parser.isOperatorEnabled(item.value)) {
        nstack.push(item.value, expr.unaryOps[item.value]);
      } else {
        var v = values[item.value];
        if (v !== undefined) {
          nstack.push(item.value, v);
        } else {
          throw new Error('undefined variable: ' + item.value);
        }
      }
    } else if (type === IOP1) {
      n1 = nstack.popValue();
      f = expr.unaryOps[item.value];
      nstack.push(item.value, f(resolveExpression(n1, values)));
    } else if (type === IFUNCOP) {
      n2 = nstack.popValue();
      n1 = nstack.popValue();
      args = [n1, n2];
      f = expr.functions[item.value];
      if (f.apply && f.call) {
        nstack.push(item.value, f.apply(undefined, args));
      } else {
        throw new Error(f + ' is not a function');
      }
    } else if (type === IFUNCALL) {
      argCount = item.value;
      args = [];
      while (argCount-- > 0) {
        args.unshift(resolveExpression(nstack.popValue(), values));
      }
      f = nstack.popValue();
      if (f.apply && f.call) {
        nstack.push(item.value, f.apply(undefined, args));
      } else {
        throw new Error(f + ' is not a function');
      }
    } else if (type === IFUNDEF) {
      // Create closure to keep references to arguments and expression
      nstack.push(type, (function () {
        var n2 = nstack.popValue();
        var args = [];
        var argCount = item.value;
        while (argCount-- > 0) {
          args.unshift(nstack.popValue());
        }
        var n1 = nstack.popValue();
        var f = function () {
          var scope = Object.assign({}, values);
          for (var i = 0, len = args.length; i < len; i++) {
            scope[args[i]] = arguments[i];
          }
          return evaluate(n2, expr, scope);
        };
        // f.name = n1
        Object.defineProperty(f, 'name', {
          value: n1,
          writable: false
        });
        values[n1] = f;
        return f;
      })());
    } else if (type === IEXPR) {
      nstack.push(IEXPR, createExpressionEvaluator(item, expr, values));
    } else if (type === IEXPREVAL) {
      nstack.push(IEXPREVAL, item);
    } else if (type === IMEMBER) {
      n1 = nstack.popValue();
      nstack.push(item.value, n1[item.value]);
    } else if (type === IENDSTATEMENT) {
      nstack.pop();
    } else if (type === IARRAY) {
      argCount = item.value;
      args = [];
      while (argCount-- > 0) {
        args.unshift(nstack.popValue());
      }
      nstack.push(IARRAY, args);
    } else {
      throw new Error('invalid Expression');
    }
  }
  if (nstack.length > 1) {
    throw new Error('invalid Expression (parity)');
  }
  // Explicitly return zero to avoid test issues caused by -0
  return nstack.first() === 0 ? 0 : resolveExpression(nstack.first(), values);
}

function createExpressionEvaluator(token, expr, values) {
  if (isExpressionEvaluator(token)) return token;
  return {
    type: IEXPREVAL,
    value: function (scope) {
      return evaluate(token.value, expr, scope);
    }
  };
}

function isExpressionEvaluator(n) {
  return n && n.type === IEXPREVAL;
}

function resolveExpression(n, values) {
  return isExpressionEvaluator(n) ? n.value(values) : n;
}

function stackFactory() {
  var stack = [];
  return {
    get length() {
      return stack.length;
    },
    pop: function pop() {
      return stack.pop();
    },
    popValue: function popValue() {
      return stack.pop().value;
    },
    push: function push(token, value) {
      stack.push({
        token: token,
        value: value
      });
    },
    first: function first() {
      return stack[0] && stack[0].value;
    }
  };
}
