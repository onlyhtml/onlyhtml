import fs from 'fs';
import path from 'path';
import glob from 'glob';
import mkdirp from 'mkdirp';
import postcss from 'postcss';
import getTailwind from '../config/tailwind.js';

export default class CSSCompiler {
    constructor(rootDir, destinationDirectory) {
        this.rootDir = rootDir;
        this.destDir = destinationDirectory;
        this.postcss = undefined;
        this.getPostcss();
    }

    async compileDirectory(directory) {
        const destCssDir = path.join(this.destDir, 'stylesheets');
        await mkdirp(destCssDir);

        const jobs = [];
        glob.sync(`${directory}/*`).forEach(fpath => {
            const fname = path.basename(fpath).split('.')[0];
            const dest = path.join(destCssDir, `${fname}.css`); 
            jobs.push(this.compile(fpath, dest));
        });

        await Promise.all(jobs);
    }

    async compile(inputPath, dest) {
        const input = fs.readFileSync(inputPath, 'utf8');
        const postcss = await this.getPostcss();
        const result = await postcss.process(input, {from: inputPath});
        fs.writeFileSync(dest, result.css)
    }

    async getPostcss() {
        if(!this.postcss) {
            const www = path.join(this.rootDir, 'www');
            const tailwindConf = path.join(this.rootDir, 'tailwind.config.js');
            const tailwindPlugin = await getTailwind(www, tailwindConf);
            this.postcss = postcss([tailwindPlugin]);
        }

        return this.postcss;
    }
}
