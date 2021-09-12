import fs from 'fs';
import path from 'path';
import glob from 'glob';
import mkdirp from 'mkdirp';

import Logger from '../logger.js';
import Template from '../template/hb-glue.js';

/**
 *
 * Builder builds an onlyhtml website into a final static html directory, ready to be uploaded to a static site hosting service
 */
export default class TemplateBuilder {
    constructor(fetcher) {
        const www = path.join(process.cwd(), 'www');

        this.fetcher = fetcher; 
        this.renderer = new Template();
        this.renderer.registerPartials(www, 'parts');
        this.renderer.registerPartials(www, 'components');
    }

    getTemplatePaths() {
        return glob.sync(path.resolve('www', '*.{html,xml,rss,json}'));
    }

    async build(outDir) {
        let tasks = [];
        await mkdirp(outDir);

        const templates = this.getTemplatePaths();

        for (const tmpl of templates) {
            const templateName = path.basename(tmpl);

            // console.log('render template', tmpl, templateName);
            if(templateName.startsWith('_')) {
                const htmls = await this.renderPermalink(tmpl);
                htmls.map(f => {
                    const _path = path.join(outDir, f.path);
                    const task = this.saveToFile(_path, f.contents)
                    tasks.push(task);
                });

                continue;
            }

            const html = await this.renderPage(tmpl, templateName);
            if (!html) {
                continue;
            }

            const htmlPath = path.join(outDir, templateName);
            const _task = this.saveToFile(htmlPath, html);
            tasks.push(_task);
        }

        await Promise.all(tasks);
        console.log('done build.');
    }

    /// render a single page. regular pages are .html files under www dir
    /// permalink pages start with an underscore
    async renderPage(templatePath) {
        const records = await this.fetcher.fetchRecords();
        const tmpl = fs.readFileSync(templatePath, 'utf8');
        return this.renderer.render(tmpl, records);
    }

    /**
     * @param fname {String} 
     * @returns {Promise<[]LogicalFile>}
     */
    async renderPermalink(fname) {
        const out = [];

        const tmpl = fs.readFileSync(fname, 'utf8');
        const blockName = path.basename(fname).substring(1).split('.')[0];
        const records = await this.fetcher.fetchRecords();

        if (records === undefined || !(blockName in records)) {
            Logger.warn(`records is invalid. looking for ${blockName} in [${Object.keys(records)}]`);
            throw new Error(`Could not render block ${blockName}, not records for it`);
        }

        let blockRecords = records[blockName];

        if (Array.isArray(blockRecords) === false) {
            blockRecords = [blockRecords];
        }

        Logger.extra(`renderPermalink ${blockName} records count: ${blockRecords.length}`);

        for (let record of blockRecords) {
            const tmpRecords = Object.assign({}, records);
            tmpRecords[blockName] = record;
            const html = this.renderer.render(tmpl, tmpRecords);
            out.push(new LogicalFile(record._permalink + '.html', html));
        }

        return out;
    }

    async saveToFile(_path, content) {
        await mkdirp(path.dirname(_path));
        fs.writeFileSync(_path, content);
    }
}

class LogicalFile {
    constructor(path, contents) {
        this.path = path;
        this.contents = contents;
    }
}
