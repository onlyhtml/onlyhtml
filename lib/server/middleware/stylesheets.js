import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import Logger from '../../logger.js';

import getTailwind from '../../config/tailwind.js';

class StylesheetsMiddleware {
    constructor(rootdir) {
        // this.rootdir = rootDir;
        this.tailwindPath = path.join(rootdir, 'tailwind.config.js');
        this.www = path.join(rootdir, 'www');

        this.postcss = undefined;
        this.getPostcss(); // preload postcss
        

        fs.watchFile(this.tailwindPath, {}, async () => {
            this.postcss = undefined;
        });
    }

    getMiddleware() {
        return this.handleRequest.bind(this);
    }

    async getPostcss() {
        if (!this.postcss) {
            console.log('loading tailwind');
            const tailwind = await getTailwind(this.www, this.tailwindPath);
            // console.log(tailwind);
            this.postcss = postcss([tailwind]);
        }

        return this.postcss;
    }

    async handleRequest(ctx, next) {
        let uriPath = ctx.path;
        if (!uriPath.startsWith('/stylesheets')) {
            return await next();
        }


        const _path = this.resolveUri(uriPath);
        if (!_path) {
            Logger.warn('Could not find css');
            return await next(); // TODO: maybe just return 404?
        }

        const css = fs.readFileSync(_path, 'utf8');
        const postcss = await this.getPostcss();
        const compiled  = await postcss.process(css, {from: _path});

        ctx.body = compiled.css;
        ctx.type = '.css';
    }

    /**
     * @returns {String} path to requrested css, 
     * or undefined if not found
     */
    resolveUri(uriPath) {
        const fname = path.basename(uriPath).split('.')[0];

        const possiblePaths = [
            path.join(this.www, uriPath),
            path.join(this.www, 'stylesheets', fname+'.pack.css'),
            path.join(this.www, 'stylesheets', fname+'.pack.scss'),
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        
        return undefined;
    }
}

export default function (rootDir) {
    const instance = new StylesheetsMiddleware(rootDir);
    return instance.getMiddleware();
}
