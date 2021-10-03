export default class Field {
    constructor(id, type, options={}) {
        this.id = id;
        this.type = type;
        this.options = options;
    }

    getId() {
        return this.id;
    }

    getType() {
        return this.type;
    }

    /**
     * @returns {object}
     */
    getOptions() {
        const opts = Object.assign({}, this.options); // clone
        opts['type'] = this.type;

        for (const [k, v] of Object.entries(opts)) {
            if (v === undefined) {
                delete opts[k];
            }
        }

        return opts;
    }

    getOption(key, def = undefined) {
        return this.getOptions()[key] || def;
    }

    mergeOptions(newOptions) {
        this.options = Object.assign(this.options, newOptions);
    }
}
