#! /usr/bin/env node
const CONFIG_FILE = 'onlyhtml.json';

import fs from 'fs';
// import path from 'path';

import caporal from '@caporal/core'
const {program} = caporal;

import Logger from './lib/logger.js';


import {buildRapid, buildSanity} from './build.js';
import {serveRapid, serveSanity} from './serve.js';
import {pushLocalSanityio} from './push.js';
import {watchAndPushSanity} from './lib/push/sanity.js';
import {CloudProvider} from './lib/cloud/index.js';
import {buildPreview} from './lib/static-preview/index.js';

program
    .command('export sanity', 'push structure to server')
    .option('--path <file>', 'path to put sanity schema configuration')
    .option('--watch', 'watch for schema changes in www')
    .action(async ({options}) => {
        try {
            // always export at first, then if watching start a watching loop
            await pushLocalSanityio(options.path);
            if (options.watch === true) {
                await watchAndPushSanity(options.path);
            }
        } catch (e) {
            console.log('error', e);
        }
    })

    .command('build rapid', 'build output html using rapid generated content')
    .action(async () => {
        try {
            await buildRapid();
        } catch (e) {
            console.log('error', e);
        }
    })

    .command('build sanity', 'build output html using sanity.io')
    .action(async ({}) => {
        let config = init();
        if (config === undefined) {
            return;
        }

        try {
            await buildSanity(config);
        } catch (e) {
            console.log('error', e);
        }
    })

    .command('serve sanity', 'live server with sanity.io backend')
    .action(async () => {
        let config = init();
        if (config === undefined) {
            return;
        }
        try {
            await serveSanity(config);
        } catch (e) {
            console.log('error', e);
        }
    })

    .command('serve rapid', 'live server with auto-generated content for rapid development')
    .action(async () => {
        try {
            await serveRapid();
        } catch (e) {
            console.log('error', e);
        }
    })

    .command('cloud upload', 'upload current project configuration to onlyhtml cloud')
    .action(async () => {
        let config = init();
        if (config === undefined) {
            return;
        }

        if (!config.cloud || !config.cloud.site) {
            console.log('must configure cloud site');
            return;
        }

        const cloud = new CloudProvider(config);
        await cloud.upload();
    })

    .command('compile preview', '')
    .action(async () => {
        await buildPreview();
    })


program.run();


function init() {
    Logger.info('Welcome!');

    let config = getConfig();
    if (!config) {
        Logger.error('Interneto website not configured!');
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
    config.hidden_sections = config.hidden_sections || [];

    return config;
}
