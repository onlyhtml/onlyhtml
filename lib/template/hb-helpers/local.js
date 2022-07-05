import renderHelper from './directives/index.js';

export default function getLocalDirectiveHelper(hb, undefinedHandler = fillUndefinedValue) {

    function directiveHelper(value, options) {
        if (options.fn) {
            throw new Error('cannot be called from a block directive');
        }

        if (!options || !options.hash) {
            console.log('value', value, 'options', options);
            throw new Error('cannot render local iComponent without params');
        }

        if (value == undefined) {
            return new hb.SafeString(undefinedHandler(options));
        }

        const type = options.hash['type'] || 'text';
        const renderFunction = renderHelper.getHelper(type)
        const rendered = renderFunction(value, options.hash);
        return new hb.SafeString(rendered);
    }

    return directiveHelper;
}

function fillUndefinedValue() {
    return '';
}
