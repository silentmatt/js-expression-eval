import { INUMBER, IOP1, IOP2, IOP3, IVAR, IFUNCOP, IVARNAME, IFUNCALL, IFUNDEF, IEXPR, IEXPREVAL, IMEMBER, IENDSTATEMENT, IARRAY } from './instruction';

export default function evaluate(tokens, expr, values) {
  var nstack = stackFactory();
  var n1, n2, n3;
  var op1, op2;
  var f, args, argCount;

  if (isExpressionEvaluator(tokens)) {
    return resolveExpression(tokens, values);
  }

  var numTokens = tokens.length;

  for (var i = 0; i < numTokens; i++) {
    var item = tokens[i];
    var type = item.type;
    var token = item.value;
    if (type === INUMBER || type === IVARNAME) {
      nstack.push(type, token);
    } else if (type === IOP2) {
      op2 = nstack.pop();
      op1 = nstack.pop();
      n2 = op2.value;
      n1 = op1.value;
      if (token === 'and') {
        nstack.push(token, n1 ? !!evaluate(n2, expr, values) : false);
      } else if (token === 'or') {
        nstack.push(token, n1 ? true : !!evaluate(n2, expr, values));
      } else if (token === '=') {
        f = expr.binaryOps[token];
        nstack.push(token, f(n1, evaluate(n2, expr, values), values));
      } else if (token === '+' && op2.token === '#' && op2.token !== op1.token) {
        // If the percentage operator is applied to the right-hand operand of an addition,
        // we need to take into account the left-hand operand, because the percentage applies to it
        f = expr.binaryOps[token];
        n1 = resolveExpression(n1, values);
        n2 = evaluate([
          { type: INUMBER, value: n1 },
          { type: INUMBER, value: resolveExpression(n2, values) },
          { type: IOP2, value: '*' }
        ], expr, values);
        nstack.push(token, f(n1, n2));
      } else {
        f = expr.binaryOps[token];
        nstack.push(token, f(resolveExpression(n1, values), resolveExpression(n2, values)));
      }
    } else if (type === IOP3) {
      n3 = nstack.popValue();
      n2 = nstack.popValue();
      n1 = nstack.popValue();
      if (token === '?') {
        nstack.push(token, evaluate(n1 ? n2 : n3, expr, values));
      } else {
        f = expr.ternaryOps[token];
        nstack.push(token, f(resolveExpression(n1, values), resolveExpression(n2, values), resolveExpression(n3, values)));
      }
    } else if (type === IVAR) {
      if (/^__proto__|prototype|constructor$/.test(token)) {
        throw new Error('prototype access detected');
      }
      if (token in expr.functions) {
        nstack.push(token, expr.functions[token]);
      } else if (token in expr.unaryOps && expr.parser.isOperatorEnabled(token)) {
        nstack.push(token, expr.unaryOps[token]);
      } else {
        var v = values[token];
        if (v !== undefined) {
          nstack.push(token, v);
        } else {
          throw new Error('undefined variable: ' + token);
        }
      }
    } else if (type === IOP1) {
      op1 = nstack.pop();
      n1 = op1.value;
      f = expr.unaryOps[token];
      // If the percentage operator was applied to the operand of a negation, we need to forward it through the context.
      // Otherwise, it will be ignored from the detection made on a possible addition.
      if (token === '-' && op1.token === '#') {
        token = '#';
      }
      nstack.push(token, f(resolveExpression(n1, values)));
    } else if (type === IFUNCOP) {
      n2 = nstack.popValue();
      n1 = nstack.popValue();
      args = [n1, n2];
      f = expr.functions[token];
      if (f.apply && f.call) {
        nstack.push(token, f.apply(undefined, args));
      } else {
        throw new Error(f + ' is not a function');
      }
    } else if (type === IFUNCALL) {
      argCount = token;
      args = [];
      while (argCount-- > 0) {
        args.unshift(resolveExpression(nstack.popValue(), values));
      }
      f = nstack.popValue();
      if (f.apply && f.call) {
        nstack.push(token, f.apply(undefined, args));
      } else {
        throw new Error(f + ' is not a function');
      }
    } else if (type === IFUNDEF) {
      // Create closure to keep references to arguments and expression
      nstack.push(type, (function () {
        var n2 = nstack.popValue();
        var args = [];
        var argCount = token;
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
      nstack.push(type, createExpressionEvaluator(item, expr, values));
    } else if (type === IEXPREVAL) {
      nstack.push(type, item);
    } else if (type === IMEMBER) {
      n1 = nstack.popValue();
      nstack.push(token, n1[token]);
    } else if (type === IENDSTATEMENT) {
      nstack.pop();
    } else if (type === IARRAY) {
      argCount = token;
      args = [];
      while (argCount-- > 0) {
        args.unshift(nstack.popValue());
      }
      nstack.push(type, args);
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
