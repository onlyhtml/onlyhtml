import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import Logger from '../../logger.js';

const JS_DIR = 'javascripts';

class JavascriptsMiddleware {
    constructor(wwwDirectory) {
        this.www = wwwDirectory;
        this.cache = new Map();

        const jsdir = path.join(this.www, JS_DIR);
        fs.watch(jsdir, {}, (_e, _f) => {
            console.log('js changed');
            this.cache.clear();
        });
    }

    getMiddleware() {
        return this.handleRequest.bind(this);
    }

    async handleRequest(ctx, next) {
        let uriPath = ctx.path;
        if (!uriPath.startsWith('/'+JS_DIR)) {
            return await next();
        }

        if (this.cache.has(uriPath)) {
            Logger.extra('js cached respones');
            ctx.body = this.cache.get(uriPath);
            ctx.type = '.js';
            return;
        }

        const _path = this.resolveUri(uriPath);
        if (!_path) {
            Logger.warn('Could not js file');
            return await next();
        }

        const { outputFiles, warnings } = await esbuild.build({
            entryPoints: [_path],
            write: false,
            bundle: true,
            color: true,
            format: 'iife',
        });

        warnings.map(w => {
            Logger.warn('JS Compilation warning', w);
        });

        if (outputFiles.length !== 1) {
            Logger.warn('ESBuild returned unexpected number of output files');
        }

        const file = outputFiles[0];
        ctx.body = Buffer.from(file.contents).toString();
        ctx.type = '.js';

        this.cache.set(uriPath, ctx.body);
    }

    /**
     * @returns {String} path to requrested css, 
     * or undefined if not found
     */
    resolveUri(uriPath) {
        const fname = path.basename(uriPath).split('.')[0];

        const possiblePaths = [
            path.join(this.www, uriPath),
            path.join(this.www, JS_DIR, fname+'.js'),
            path.join(this.www, JS_DIR, fname+'.pack.js'),
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        
        return undefined;
    }
}

export default function (www) {
    const instance = new JavascriptsMiddleware(www);
    return instance.getMiddleware();
}
