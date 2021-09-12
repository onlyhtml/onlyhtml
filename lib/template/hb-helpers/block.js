import { BlockIdField } from '../sugar-transformer.js';

export function getBlockHelper(undefinedHandler = defaultUndefinedHandler) {
    function blockHelper(_ctx, options) {
        if (options === undefined || options.fn === undefined) {
            throw new Error('Block must be called from block context only');
        }

        const blockType = options.name;
        let blockName = options.hash[BlockIdField] ? options.hash[BlockIdField] : 'missing-name';

        // take data from root and not from context
        // this way infinte recursive inclusion of blocks is easy
        const data = options.data.root;
        if (!data || typeof data !== 'object' || !Object.keys(data).includes(blockName)) {
            console.warn('missing block', blockType, blockName);
            return undefinedHandler({}, options);
        }

        // child context controls which values are used to render 
        // mustache fields, but does not affect blocks due to our `options.data.root` trick
        let child_ctx = data[blockName];
        return options.fn(child_ctx);
    }

    return blockHelper;
}

function defaultUndefinedHandler(ctx, options) {
    // by default if a block's data is undefined, this means it was disabled
    return '';
}
