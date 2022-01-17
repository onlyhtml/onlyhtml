import fs from 'fs';
import path from 'path'
import glob from 'glob';
import axios from 'axios';
import { dolog } from '../logger.js';

import JSCompiler from '../build/javascript.js';
import CSSCompiler from '../build/stylesheet.js';

const ENDPOINT = 'http://localhost:5001/onlysites-3fd15/us-central1/uploadTempaltes'

export class CloudProvider {
    constructor(config) {
        this.config = config;
    }

    async upload() {
        const tempaltes = this._getAllTemplates();
        const resources = await this._buildResources();
        await this._upload(tempaltes, resources);
    }

    // task get all templates and add them to firebase?
    //  one record, key is path, value is html template

    _getAllTemplates() {
        const templates = {};
        glob.sync("www/**/*.{html,xml,rss,json}").map(p => {
            let content = fs.readFileSync(p, 'utf8');
            templates[p] = content;
        });

        return templates;
    }

    async _buildResources() {
        const tmpDist = fs.mkdtempSync('onlysites');
        const www = path.resolve('www');
        const javascripts = path.join(www, 'javascripts');
        const stylesheets = path.join(www, 'stylesheets');
        const jscompiler = new JSCompiler(tmpDist);
        const csscompiler = new CSSCompiler(process.cwd(), tmpDist);

        const tasks = [];
        tasks.push(dolog('Building JS', async () => {await jscompiler.compileDirectory(javascripts);}));
        tasks.push(dolog('Building CSS', async () => {await csscompiler.compileDirectory(stylesheets);}));
        await Promise.all(tasks);

        const resources = {}
        glob.sync(`${tmpDist}/**/*.{js,css}`).map(p=> {
            resources[p] = fs.readFileSync(p, 'utf8');
        });

        fs.rmdirSync(tmpDist, { recursive: true });
        return resources;
    }

    async _upload(templates, resources) {
        const res = await axios.post(ENDPOINT, {
            site: this.config.cloud.site,
            templates: templates,
            resources: resources,
        });

        if (res.status >= 400) {
            console.warn("got error response from server", res.data);
        }
    }
}
