import pkg from 'lorem-ipsum';
const { LoremIpsum }  = pkg;

import { Block, BlockType } from '../template/block.js';
import TemplateParser from '../parser.js';

const LOREM_IMG_SERVICE = 'https://us-central1-interneto-819cf.cloudfunctions.net/imglorem';

export default class RapidContentFetcher {
    
    /** 
     * @param templateParser {TemplateParser}
     */
    constructor(templateParser) {
        this.parser = templateParser;
        this.clearCache();
    }

    async fetchSpecificRecords(blockName, recordId) {
        const values = Object.assign({}, this.getValues());
        const specificRecordKey = hashKey(blockName, {recordId: recordId});
        values[blockName] = this.valuesCache.get(specificRecordKey);
        return values;
    }

    async fetchRecords() {
        return this.getValues();
    }

    watchForChanges() {}
    
    getValues() {
        return this.generateContent(this.parser.parseAll());
    }

    clearCache() {
        this.valuesCache = new Map();
    }

    /**
     * @param blocks {Block[]}
     */
    generateContent(blocks) {
        const data = {};
    
        for (const block of blocks) {
            const blockId = block.getId();
            let blockOptions = hashBlockOptions(block);

            if (block.getType() == BlockType.COLLECTION) {
                const count = block.getOption('lorem_count', 1);
                const blockValues = [];

                for (let i=0; i<count; i++) {
                    const recordId = i;

                    const key = hashKey(blockId, {options: blockOptions, recordId: recordId});
                    if (this.valuesCache.has(key) === false) {
                        this.valuesCache.set(key, this.generateBlockContent(block));
                    }

                    const record = this.valuesCache.get(key);
                    record._permalink = `/${blockId}/${recordId}`;
                    blockValues.push(record);
                }

                data[blockId] = blockValues;
                continue;
            }

            const key = hashKey(blockId, {options: blockOptions});

            if (this.valuesCache.has(key) === false) {
                this.valuesCache.set(key, this.generateBlockContent(block));
            }


            data[blockId] = this.valuesCache.get(key);
        }

        return data;
    }

    /** 
     * @param block {Block}
     * @returns {object}
     */
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

/**
 * @param block {Block}
 * @returns {string}
 */
function hashBlockOptions(block) {
    let blockOptions = Object.entries(block.getOptions()).map(([key, value]) =>  `${key}-${value}`).join('');
    blockOptions += block.getFields().map(f => Object.entries(f.getOptions()).map( ([key, value]) => `${key}-${value}`).join('')).join('');
    return blockOptions;
}

/**
 * @param blockId {string}
 * @param recordId {string}
 * @param options {string}
 * @returns {string}
 */
function hashKey(blockId, {recordId, options}) {
    const key = blockId + recordId + options;
    // console.log('key', key);
    return key;
}
