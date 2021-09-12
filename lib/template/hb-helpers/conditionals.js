import {BlockIdField, BlockParentField} from '../sugar-transformer.js';

export default function choiceHelper(conditional, options) {
    // console.log('choice helper', options.hash);
    const parent = options.hash[BlockParentField];
    const name = options.hash[BlockIdField];

    if (parent === 'general' && 'general' in options.data.root) {
        const data = options.data.root['general'];
        // console.log('data', data, 'name', name);
        if (name in data) {
            conditional = data[name];
        }

    }

    if (conditional) {
        return options.fn(this);
    }
}
