import fs from 'fs';
import path from 'path';
import Logger from '../../logger.js';
import Template from '../../template/hb-glue.js';

export class TemplateMiddleware {
    constructor(fetcher, requestReload) {
        this.www = path.resolve('www');

        this.cache = new Map();
        this.renderer = new Template();
        this.fetcher = fetcher;  
        this.registerPartials();
    }

    clearCache() {
        Logger.info('TemplateMiddleware.clearCache');
        this.registerPartials();
        this.cache.clear();
    }

    /***
     * @return {Boolean} true if was successful
     */
    registerPartials() {
        try {
            this.renderer.registerPartials(this.www, 'parts');
            this.renderer.registerPartials(this.www, 'components');
        } catch(e) {
            Logger.warn('Caught error while registering partials', e);
            return false;
        }
        return true;
    }

    getMiddleware() {
        return this.handleRequest.bind(this);
    }

    async handleRequest(ctx, next) {
        const cacheKey = ctx.path;
        const cacheValue = this.cache.get(cacheKey);
        if (cacheValue) { Logger.extra('cached!'); }

        const ext = path.extname(ctx.path);
        const mime = this.getMime(ext); 
        ctx.type = mime || ctx.type;

        if (mime !== undefined) {
            ctx.body = cacheValue || await this.renderContent(ctx.path, ext);
            this.cache.set(cacheKey, ctx.body);
        } else {
            next(); // if request is not for a template, give other middleware's a chance
        }
    }

    // should be called only for templated files, not assets
    async renderContent(_uriPath, _ext) {
        let { blockId, recordId, uriPath, ext } =  this.parseUri(_uriPath, _ext);

        const templatePath = this.lookupTemplate(blockId, uriPath, ext);
        const templateContent = fs.readFileSync(templatePath, "utf8");
        // console.log('template path', templatePath);

        let values = {};
        if (blockId != undefined && recordId != undefined) {
            values = await this.fetcher.fetchSpecificRecords(blockId, recordId);
        } else {
            values = await this.fetcher.fetchRecords();
        }

        // console.log('rendering values', values);
        const html = this.renderer.render(templateContent, values);
        // console.log('html', html);
        return html;
    }

    
    lookupTemplate(blockId, uriPath, ext) {
        const www = path.resolve('www');
        const templatePath = path.join(www, `${uriPath}${ext}`);
        const permalinkPath = `${www}/_${blockId}.html`;

        if (fs.existsSync(templatePath)) {
            return templatePath;
        }

        if (fs.existsSync(permalinkPath)) {
            return permalinkPath;
        }

        throw new Error(`Could not find template ${uriPath}${ext}. tried ${templatePath}, ${permalinkPath}`);
    }

    parseUri(uriPath, ext) {
        const ret = {};
        ret.uriPath = uriPath;

        if (uriPath === '/') { 
            ret.uriPath = '/index';
            ret.ext = '.html';
        }

        if (ext === undefined || ext === '') {
            ret.ext = '.html';
        }

        const parts = uriPath.split('/');
        if (parts.length <= 2) {
            return ret;
        }

        ret.blockId = parts[1];
        ret.recordId = parts[2];
        return ret;
    }

    getMime(ext) {
        switch (ext) {
            case '':
              return 'text/html';
            case '.html':
              return 'text/html';
            case '.xml':
              return 'application/xml';
            case '.rss':
              return 'application/rss+xml';
            case '.json':
              return 'application/json';
        }

        return undefined;
    }
}

export function getMiddleware(fetcher, requestReload) {
    const instance = new TemplateMiddleware(fetcher, requestReload);
    return instance.getMiddleware();
}
