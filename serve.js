import fs from 'fs';
import path from 'path';
import Server from './lib/server/server.js';
import livereload from 'livereload';
import Logger from './lib/logger.js';
import TemplateParser from './lib/parser.js';

import RapidContentFetcher from './lib/rapidgen/index.js';
import SanityLiveserverFetcher from './lib/sanity/livefetcher.js';

const PORT = 3000;

export async function serveSanity(config) {
    const livereloadServer = livereload.createServer();
    const fetcher = new SanityLiveserverFetcher(config);
    const server = new Server(fetcher, livereloadServer);
    server.start(PORT);
    Logger.info("Server is up!");

    const watchPaths = [
        path.resolve('www'),
        path.resolve('tailwind.config.js'),
    ];

    const www = path.resolve('www');
    fs.watch(www, {recursive: true}, (_eventType, _fname) => {
        Logger.extra("www file changed, reload!");
        server.clearCache();
    });

    livereloadServer.watch(watchPaths);
    Logger.info('Live realod server is up');
}

export async function serveRapid() {
    const www = path.resolve('www');
    const livereloadServer = livereload.createServer();

    const parser = new TemplateParser(www, true); // watch and auto reload
    const fetcher = new RapidContentFetcher(parser);
    const server = new Server(fetcher, livereloadServer);
    server.start(PORT);
    Logger.info("Server is up!");

    const watchPaths = [
        www,
        path.resolve('tailwind.config.js'),
    ];

    livereloadServer.watch(watchPaths);
    fs.watch(www, {recursive: true}, (_eventType, _fname) => {
        Logger.extra("[serve.js] www file changed, reload!");
        server.clearCache();
    });

    Logger.info('Live realod server is up');
}
