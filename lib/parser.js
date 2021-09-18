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
        let blocks = [];
        glob.sync(path.resolve(this.www, '**/*.{html,xml,rss,json}'))
            .map(p => {
                Logger.extra('parsing template', p);
                const newblocks = this.engine.parse(fs.readFileSync(p, 'utf8'));
                blocks = blocks.concat(newblocks);
            });

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
                const merged = this.mergeBlocks(m.get(blockId), b);
                m.set(blockId, merged);
                return;
            }
            
            m.set(blockId, b);
        });

        // return only array of values
        return m.values();
    }

    mergeBlocks(b1, b2) {
        if (b1.getType() !== b2.getType()) {
            throw new Error('Cant merge two blocks with different types');
        }

        b2.getFields().map(f => {
            b1.addField(f);
        });

        b1.mergeOptions(b2.getOptions())

        return b1;
    };

}

