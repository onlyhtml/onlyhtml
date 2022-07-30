import fs from 'fs';
import path from 'path';
import glob from 'glob';

import Handlebars from 'handlebars';
import { SugarSyntaxTransform } from './sugar-transformer.js';
import { HBTemplateParser } from './hb-parser.js';
import { registerHelpers } from './hb-helpers/index.js';

export default class Template {
    constructor() {
        this.hb = Handlebars.create();
        this.partials = {};
        this.sugarSyntaxTransformer = new SugarSyntaxTransform();

        this.hbOptions = {
            strict: false,
            compat: true,
        };

        registerHelpers(this.hb);
    }

    registerPartials(root, folder) {
        const d = path.join(root, folder)
        glob.sync(`${d}/**/*.html`).map(file => {
            let name = file.replace(`${root}/`, '');
            name = name.replace('/_', '/');
            name = name.replace('.html', '');

            // console.log('register partial', name, file);
            this.registerPartialString(name, fs.readFileSync(file, 'utf8'));
        });

    }

    registerPartialString(key, templateString) {
        this.partials[key] = templateString;
        const ast = this.hb.parse(templateString);
        this.sugarSyntaxTransformer.addPartial(key, ast);
    }

    /**
     * Render a template and it's values into a single string
     */
    render(templateString, values) {
        const templateSpec = this._transformSugarSyntax(templateString);
        const builder = this.hb.compile(templateSpec, this.hbOptions);
        values = this._filterUndefined(values)
        // console.log('values just before rendering', values);
        return builder(values);
    }

    /**
     * Precompile a given template so it can be sent to the client and executed without compilation. 
     * Useful for live previews.
     */
    precompile(templateString) {
        const templateSpec = this._transformSugarSyntax(templateString);
        return this.hb.precompile(templateSpec, this.hbOptions);
    }

    /**
     * @param templateString {string} template string
     * @returns {[] import { Block } from '../model/block.js'} a list of Blocks
     */
    parse(templateString) {
        const ast = this._transformSugarSyntax(templateString);
        return HBTemplateParser.parse(ast);
    }

    /**
     * @param templateStrings {[]string} list of template strings
     * @returns {[] import { Block } from '../model/block.js'} a list of Blocks
     */
    parseMany(templateStrings) {
        let parser = new HBTemplateParser();
        templateStrings.map(tmplt => {
            const ast = this._transformSugarSyntax(tmplt);
            parser.accept(ast);
        });

        return parser.getBlocks();
    }

    _transformSugarSyntax(templateString) {
        return this.sugarSyntaxTransformer.accept(this.hb.parse(templateString));
    }

    _filterUndefined(obj) {
        for (const key of Object.keys(obj)) {
            if (obj[key] === undefined) {
                // console.log('Template._filterUndefined() deleting key', key);
                delete obj[key];
            }
        }

        return obj;
    }
}
