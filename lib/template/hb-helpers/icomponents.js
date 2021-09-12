import HB from 'handlebars';

import renderHelper from './directives/index.js';

export default function getDirectiveHelper(undefinedHandler = fillUndefinedValue) {

    function directiveHelper(value, options) {
        if (options.fn) {
            throw new Error('cannot be called from a block directive');
        }

        if (!options || !options.hash) {
            console.log('value', value, 'options', options);
            throw new Error('cannot render iComponent without params');
        }

        const type = options.hash['type'];
        const parent = options.hash['parent'];
        const name = options.hash['name'];


        const root = options.data.root;

        // prefer taking data from root if found the exact right value
        if (parent && parent in root) {
            // console.log('has valid parent', parent);
            if (name in root[parent]) {
                value = root[parent][name];
            }
        }

        // console.log(`mustacheNode type=${type} name=${name} parent=${parent} value=${value}`);
        if (value == undefined) {
            return new HB.SafeString(undefinedHandler(parent, name, options));
        }

        const renderFunction = renderHelper.getHelper(type)
        return new HB.SafeString(renderFunction(value, options.hash));
    }

    return directiveHelper;
}

function fillUndefinedValue(parent, name) {
    if (parent && name) {
        return `{{${parent}::${name}}}`;
    }
    if (parent) {
        return `{{${parent}}::?}}`;
    }
    if (name) {
        return `{{${name}}}`;
    }

    return '{{?}}';
}
