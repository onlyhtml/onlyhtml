export default {
    split: (str, ch) => {
        if (!isString(str)) return '';
        if (!isString(ch)) ch = ',';
        return str.split(ch);
    },

    range: (count=1) => {
        const arr = [];
        for (let i=0; i<count; i++) {
            arr.push(i+1);
        }

        return arr;
    },
    json: (obj) => {
        return JSON.stringify(obj)
    },
    sum: function(...args) {
        let sum = 0;

        for (let i=0; i<args.length - 1; i++) {
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
    }
};

const isString = function(value) {
  return typeof value === 'string';
};
