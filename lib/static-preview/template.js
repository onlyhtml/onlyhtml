import fs from 'fs';
import path from 'path';
import glob from 'glob';
import mkdirp from 'mkdirp';
import { Buffer } from 'buffer';

import Logger from '../logger.js';
import Template from '../template/hb-glue.js';
import {getCurrentSourceDirName} from './dirname.js';

/**
 *
 * Builder builds an onlyhtml website into a final static html directory, ready to be uploaded to a static site hosting service
 */
export default class TemplateBuilder {
    constructor() {
        const www = path.join(process.cwd(), 'www');
        this.precompiler = new Template();
        this.precompiler.registerPartials(www, 'parts');
        this.precompiler.registerPartials(www, 'components');
    }

    getTemplatePaths() {
        return glob.sync(path.resolve('www', '*.html'));
    }

    async buildTemplates(outDir) {
        let tasks = [];
        await mkdirp(outDir);

        const pageTemplate = this.getSiteTemplateFile('page.html');
        console.log('page template', typeof pageTemplate);

        const templates = this.getTemplatePaths();
        for (const tmpl of templates) {
            const templateName = path.basename(tmpl, '.html'); // remove .html extension
            const precompiledTemplate = await this.compilePage(tmpl);
            if (!precompiledTemplate) {
                console.log('skipping...');
                continue;
            }

            // https://handlebarsjs.com/installation/precompilation.html#getting-started
            // const templateFileName = `${templateName}.precompiled.js`;
            // const templateFullPath = path.join(outDir, templateFileName);
            const htmlPath = path.join(outDir, `${templateName}.html`);
            const htmlFile = pageTemplate
                .replace(/\{template_name\}/g, templateName)
                .replace(/\{template_b64\}/g, Buffer.from(precompiledTemplate).toString('base64'));

            // tasks.push(this.saveToFile(templateFullPath, precompiledTemplate));
            tasks.push(this.saveToFile(htmlPath, htmlFile));
            console.log('saving html file', htmlFile);
        }

        await Promise.all(tasks);
        Logger.info('done build.');
    }

    async compilePage(templatePath) {
        const tmpl = fs.readFileSync(templatePath, 'utf8');
        const precompiled = this.precompiler.precompile(tmpl);
        // console.log('precompiled', precompiled);
        return precompiled;
    }

    async saveToFile(_path, content) {
        await mkdirp(path.dirname(_path));
        fs.writeFileSync(_path, content);
    }

    getSiteTemplateFile(name) {
        const __dirname = getCurrentSourceDirName();
        const filePath = path.resolve(__dirname, 'site-template', name);
        return fs.readFileSync(filePath, 'utf8');
    }
}

