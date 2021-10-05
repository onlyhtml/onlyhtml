export default {
    split: (str, ch) => {
        if (!isString(str)) return '';
        if (!isString(ch)) ch = ',';
        return str.split(ch);
    },

    range: (count = 1) => {
        const arr = [];
        for (let i = 0; i < count; i++) {
            arr.push(i + 1);
        }

        return arr;
    },
    json: (obj) => {
        return JSON.stringify(obj)
    },
    sum: function (...args) {
        let sum = 0;

        for (let i = 0; i < args.length - 1; i++) {
            let arg = arguments[i];

            if (typeof arg !== 'number') {
                arg = parseInt(arg);
            }

            if (typeof arg !== 'number') {
                continue;
            }

            sum += arg;
        }

        return sum;
    },
    subtract: function (a, b) {
        if (!Number.isInteger(a) || !Number.isInteger(b)) {
            throw new TypeError('expected arguments to be a number');
        }

        return a - b;
    },
    divide: function (a, b) {
        if (!Number.isInteger(a) || !Number.isInteger(b)) {
            throw new TypeError('expected arguments to be a number');
        }

        return Math.floor(a / b);
    },
    compare: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

        const operator = options.hash.operator || "==";

        const operators = {
            '==': function (l, r) {return l == r;},
            '===': function (l, r) {return l === r;},
            '!=': function (l, r) {return l != r;},
            '<': function (l, r) {return l < r;},
            '>': function (l, r) {return l > r;},
            '<=': function (l, r) {return l <= r;},
            '>=': function (l, r) {return l >= r;},
            'typeof': function (l, r) {return typeof l == r;}
        }

        if (!operators[operator])
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);

        var result = operators[operator](lvalue, rvalue);

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },
    length: function (value) {
        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length;
        }

        return 0;
    }
};

const isString = function (value) {
    return typeof value === 'string';
};
