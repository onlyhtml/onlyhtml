import path from 'path';
import TemplateBuilder from './lib/build/template.js';
import JSCompiler from './lib/build/javascript.js';
import CSSCompiler from './lib/build/stylesheet.js';
import Logger from './lib/logger.js';

import TemplateParser from './lib/parser.js';
import RapidContentFetcher from './lib/rapidgen/index.js';
import SanityFetcher from './lib/sanity/fetcher.js';

// TODO make fetchers implement an interface

export async function buildRapid() {
    const www = path.resolve('www');
    const fetcher = new RapidContentFetcher(new TemplateParser(www));
    await build(fetcher);
}

export async function buildSanity(config) {
    const www = path.resolve('www');

    // convert blocks from simple array iterator to map { id -> block }
    const getBlocksMap = () => {
        const blocks = {};
        const parser = new TemplateParser(www);
        for (const block of parser.parseAll()) {
            blocks[block.id] = block;
        }

        return blocks;
    };

    const fetcher = new SanityFetcher(config.sanity, getBlocksMap());
    await build(fetcher);
}

async function build(fetcher,  extraTasks = []) {
    Logger.info("Getting ready to build...");

    const dist = path.resolve('dist');
    const www = path.resolve('www');
    const javascripts = path.join(www, 'javascripts');
    const stylesheets = path.join(www, 'stylesheets');

    const builder = new TemplateBuilder(fetcher);
    const jscompiler = new JSCompiler(dist);
    const csscompiler = new CSSCompiler(process.cwd(), dist);

    const tasks = [];
    tasks.push(dolog('Building HTML', async () => {await builder.build(dist)}));
    tasks.push(dolog('Building JS', async () => {await jscompiler.compileDirectory(javascripts);}));
    tasks.push(dolog('Building CSS', async () => {await csscompiler.compileDirectory(stylesheets);}));
    tasks.concat(extraTasks);

    await Promise.all(tasks);
    Logger.info('Done!');

    process.exit(0);
}

async function dolog(desc, fn) {
    Logger.info(`${desc}`);
    await fn();
    Logger.info(`[Done] ${desc}`);
}
