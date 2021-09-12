import pkg from 'lorem-ipsum';
const { LoremIpsum }  = pkg;

import { BlockType } from '../template/block.js';

const LOREM_IMG_SERVICE = 'https://us-central1-interneto-819cf.cloudfunctions.net/imglorem';

// Should implement an interface similar to interneto.FirebaseFetcher
// So rapid it fetches data from thin air!
export default class RapidContentFetcher {
    
    constructor(templateParser) {
        this.parser = templateParser;
        this.clearCache();
    }

    async fetchSpecificRecords(blockName, recordId) {
        const values = Object.assign({}, this.getValues());
        values[blockName] = this.collCache.get(blockName, recordId);
        return values;
    }

    async fetchRecords() {
        return this.getValues();
    }

    watchForChanges() {}
    
    getValues() {
        if (!this.values) {
            const blocks = this.parser.parseAll();
            this.values = this.generateContent(blocks);
        }

        return this.values;
    }

    clearCache() {
        this.values = undefined;
        this.collCache = new CollectionRecordsCache();
    }

    /***** private *****/

    /**
     * @param blocks {[]import('@inter-neto/core').Block}
     */
    generateContent(blocks) {
        const data = {};
    
        for (const block of blocks) {
            const blockId = block.getId();

            if (block.getType() == BlockType.COLLECTION) {
                const count = block.getOption('lorem_count', 1);
                const blockValues = [];

                // console.log('collection', blockId, block.getFields().map(f => f.getId()));

                for (let i=0; i<count; i++) {
                    const recordId = i;
                    const record = this.generateBlockContent(block);
                    record._permalink = `/${blockId}/${recordId}`;
                    this.collCache.set(blockId, recordId, record);
                    blockValues.push(record);
                }

                data[blockId] = blockValues;
                continue;
            }

            data[blockId] = this.generateBlockContent(block);
        }

        return data;
    }

    generateBlockContent(block) {
        const fieldData = {};
        for (const field of block.getFields()) {
            fieldData[field.getId()] = this.generateFieldContent(field)
        }

        return fieldData;
    }

    /**
     * @returns {String}
     */
    generateFieldContent(field) {
        const params = field.getOptions();
        const type = field.getType();

        if (params.default && type !== 'link') {
            return params.default;
        }
        const lorem = new LoremIpsum();

        switch (type) {
            case 'html':
                if (params.paragraphs) {
                    const s = Array(params.paragraphs).fill(0)
                        .map(() => lorem.generateParagraphs(1))
                        .map(p => `<h3>${lorem.generateWords(2)}</h3><p>${p}</p>`)
                        .join(' ')
                    return `<div class="ql-editor">${s}</div>`;
                }
            // fallthrough is intentional
            case 'text':
                if (params.words)
                    return lorem.generateWords(params.words);
                if (params.sentences)
                    return lorem.generateSentences(params.sentences);
                // default
                return lorem.generateWords(8);

            case 'icon':
                return 'icons'; // TODO randomize

            case 'link':
                const words = params.words || 2;
                return JSON.stringify({
                    text: params.default || lorem.generateWords(words),
                    href: params.default_link || '#'+lorem.generateWords(1),
                });
            case 'url':
                return '#'+lorem.generateWords(3);

            case 'image':
                return LOREM_IMG_SERVICE;
        }
    }
}

class CollectionRecordsCache {
    constructor() {
        this.cache = new Map();
    }
    
    set(blockId, recordId, value) {
        const key = this._getKey(blockId, recordId);
        this.cache.set(key, value);
    }

    get(blockId, recordId) {
        return this.cache.get(this._getKey(blockId, recordId));
    }

    _getKey(blockId, recordId) {
        return blockId.toLowerCase() + recordId;
    }
}
