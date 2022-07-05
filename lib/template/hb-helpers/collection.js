import { BlockIdField } from '../sugar-transformer.js';
import { BlockType } from '../block.js';

function defaultUndefinedHandler(ctx, options) {
    return options.fn(ctx);
}

export function getCollectionHelper(hb, undefinedHandler = defaultUndefinedHandler) {

    function blockCollectionHelper(_ctx, options,) {
        if (options === undefined || options.fn === undefined) {
            throw new Error('Collection block must be called from block context only');
        }

        const blockType = options.name;
        const blockName = options.hash[BlockIdField] ? options.hash[BlockIdField] : 'missing-name';

        if (blockType !== BlockType.COLLECTION) {
            throw new Error('Collection block with invalid block type');
        }

        const limit = options.hash.limit;
        const skip = options.hash.skip || 0;


        const dataRoot = options.data.root;

        const child_ctx = dataRoot[blockName];
        const dataFrame = hb.createFrame(options.data);

        // Most common case, collection has many items inside it, 
        // render all of them and combine results
        if (Array.isArray(child_ctx)) {
            return child_ctx.map((item, i) => {

                if(limit) {
                    if (i < skip) { return; }
                    if (i >= limit) { return; }
                }

                dataFrame.index = i+1;
                dataFrame.last = i+1 === child_ctx.length;
                dataFrame.first = i == 0;

                return options.fn(item, { data: dataFrame })
            }).join('');
        }

        return undefinedHandler(child_ctx, options);
    }

    return blockCollectionHelper;
}
