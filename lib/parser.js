import fs from 'fs';
import glob from 'glob';
import path from 'path';
import Logger from './logger.js';

import Template from './template/hb-glue.js';

export default class TemplateParser {
    constructor(www, watch = false) {
        this.www = www;
        this.engine = new Template();
        this.engine.registerPartials(www, 'parts');
        this.engine.registerPartials(www, 'components');

        if (watch) {
            fs.watch(www, {recursive: true} , () => {
                this.engine.registerPartials(www, 'parts');
                this.engine.registerPartials(www, 'components');
            });
        }
    }

    /**
     * @returns {Iterator<interneto.Block>}
     */
    parseAll() {
        const templates = glob.sync(path.resolve(this.www, '**/*.{html,xml,rss,json}'))
            .map(p => fs.readFileSync(p, 'utf8'));
        const blocks = this.engine.parseMany(templates);
        return this.flattenBlocks(blocks);
    }


    /**
     * @returns {Iterator<interneto.Block>}
     */
    flattenBlocks(blocks) {
        const m = new Map();

        blocks.map(b => {
            const blockId = b.getId();
            if (m.has(blockId)) {
                const block = m.get(blockId);
                block.mergeBlock(b);
                m.set(blockId, block);
                return;
            }
            
            m.set(blockId, b);
        });

        // return only array of values
        return m.values();
    }
}

