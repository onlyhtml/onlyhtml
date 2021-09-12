import path from 'path';
import http from 'http';
import Koa from 'koa';
import livereload from 'koa-livereload';
import Logger from '../logger.js';
import {TemplateMiddleware} from './middleware/templates.js';
import MWLogger from './middleware/logger.js';
import MWStylesheets from './middleware/stylesheets.js';
import MWJavascripts from './middleware/javascripts.js';

export default class Server {
    constructor(fetcher, livereloadServer, extraMiddlewares = []) {
        const pwd = process.cwd();
        this.www = path.resolve('www');
        this.app = new Koa();
        this.livereloadServer = livereloadServer;

        this.mwTemplates = new TemplateMiddleware(fetcher);

        this.app
            .use(livereload())
            .use(MWLogger())

        for (const mw of extraMiddlewares) {
            this.app.use(mw);
        }

        this.app.use(MWStylesheets(pwd))
            .use(MWJavascripts(this.www))
            .use(this.mwTemplates.getMiddleware());

        this.app.on('error', err => {
            Logger.warn(`Caught error ${err}`);

            if (err.message.startsWith('Could not find template') === false) {
                console.warn(err);
            }
        });

        fetcher.watchForChanges(_ => {
            this.clearCache();
        });
    }

    clearCache() {
        Logger.extra('clearCache');
        this.mwTemplates.clearCache();
        this.livereloadServer.refresh('index.html');
    }

    async start(port) {
        this.mwTemplates.clearCache();
        this.server = http.createServer(this.app.callback());
        this.server.listen(port);
    }

    stop() {
        this.server.stop();
    }
}
