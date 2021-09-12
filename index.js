#! /usr/bin/env node
const CONFIG_FILE = 'onlyhtml.json';

import fs from 'fs';

import caporal from '@caporal/core'
const {program} = caporal;

import Logger from './lib/logger.js';


import {buildRapid, buildSanity} from './build.js';
import {serveRapid, serveSanity} from './serve.js';
import {pushLocalSanityio} from './push.js';

program
    .command('push sanity', 'push structure to server')
    .option('--path <file>', '')
    .action(async ({args, options}) => {
        try {
            await pushLocalSanityio(options.path);
        } catch (e) {
            console.log('error while executing action', args.action);
            console.log(e);
        }
    })

    .command('build rapid', 'build output html using rapid generated content')
    .action(async ({args}) => {
        try {
            await buildRapid();
        } catch (e) {
            console.log('error while executing action', args.action);
            console.log(e);
        }
    })

    .command('build sanity', 'build output html using sanity.io')
    .action(async ({args}) => {
        let config = init();
        if (config === undefined) {
            return;
        }

        try {
            await buildSanity(config);
        } catch (e) {
            console.log('error while executing action', args.action);
            console.log(e);
        }
    })

    .command('serve sanity', 'live server with sanity.io backend')
    .action(async ({args}) => {
        let config = init();
        if (config === undefined) {
            return;
        }

        try {
            await serveSanity(config);
        } catch (e) {
            console.log('error while executing action', args.action);
            console.log(e);
        }
    })

    .command('serve rapid', 'live server with auto-generated content for rapid development')
    .action(async ({args}) => {
        try {
            await serveRapid();
        } catch (e) {
            console.log('error while executing action', args.action);
            console.log(e);
        }
    })


program.run();


function init() {
    Logger.info('Welcome!');
    let config = getConfig();
    if (!config) {
        Logger.error('Interneto website not configured!');
        return;
    }
    initFirebase();
    if (config.website === undefined) {
        Logger.error('Website not defined!');
        console.log(config);
        return;
    }

    return config;
}

function getConfig() {
    let cwd = process.cwd();
    let path = `${cwd}/${CONFIG_FILE}`;
    let config;
    if (!fs.existsSync(path)) {
        console.log(path);
        return undefined;
    }

    config = JSON.parse(fs.readFileSync(path));

    console.assert(config.website != undefined, 'Must specify website in onlyhtml config');
    config.hidden_sections = config.hidden_sections || [];

    return config;
}
