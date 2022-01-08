import path from 'path';
import lodash from 'lodash';
import TemplateParser from '../parser.js';
import Logger from '../logger.js';
import SanityFetcher, {ChangeType} from './fetcher.js';


export default class SanityLiveserverFetcher {
    constructor(config) {
        const www = path.resolve('www');
        this.parser = new TemplateParser(www);

        this._blocks = undefined;
        this._records = undefined;
        this._changeListener = undefined;

        this.subscribed = false;
        this.sanityFetcher = new SanityFetcher(config.sanity, this.getBlocks());
    }

    async fetchSpecificRecords(blockName, recordId) {
        this.subscribeToChanges();

        const records = await this.getRecordsCopy();
        const doc = records[blockName].find(d => {
            if (d.slug) {
                return d.slug.current === recordId || encodeURIComponent(d.slug.current) == recordId;
            }

            return d._id === recordId;
        });

        if (!doc) {
            Logger.warn(`Could not find record for ${blockName}/${recordId}. got ${doc}`);
            return records;
        }

        // instead of having an array of entries (collection) we want to display a single item
        // this is why we overwrite the array with a single entry
        records[blockName] = doc;

        return records;
    }

    // public
    async fetchRecords() {
        this.subscribeToChanges();
        return await this.getRecordsCopy();
    }

    async getRecordsCopy() {
        const records = await this.getRecords();
        return lodash.cloneDeep(records);
    }

    /**
     *
     * @returns {Promise<object>}
     */
    async getRecords() {
        if (this._records) {
            Logger.extra('returning records from cache');
            return this._records;
        }

        this._records = await this.sanityFetcher.fetchRecords();
        return this._records;
    }

    getBlocks() {
        if (!this._blocks) {
            this._blocks = {};
            for (const block of this.parser.parseAll()) {
                this._blocks[block.id] = block;
            }
        }

        // console.log('blocks', this.blocks);
        return this._blocks;
    }

    _getBlockByType(type) {
        return this.getBlocks()[type];
    }

    clearCache() {
        // no need to clear cache as we are listening to changes in db anyway
    }

    subscribeToChanges() {
        if (this.subscribed) {
            return;
        }

        this.sanityFetcher.subscribeToChanges((type, doc) => {
            Logger.extra("on update", type);

            if (type == ChangeType.DELETE) {
                // instead of doing hard work to find document by ID, lets just reset all cache
                this._records = undefined;
                if (this._changeListener) {
                    this._changeListener();
                }
                return;
            }

            // console.log('update', doc);
            const docType = doc._type;

            if (Array.isArray(this._records[docType])) {
                // console.log('doc record is array');
                const currentValue = this._records[docType];
                // console.log('currentValue', currentValue);
                const index = currentValue.map(record => record._id).indexOf(doc._id);
                if (index == -1) {
                    // we got a new document
                    this._records[docType].push(doc);
                }
                else {
                    // update an existing document in a collection
                    this._records[docType][index] = doc;
                }
            } 

            else {
                // console.log('update singleton record', docType, 'prev', this._records[docType], this._records);
                this._records[docType] = doc;
            }

            if (this._changeListener) {
                this._changeListener();
            }
        });

        this.subscribed = true;
    }

    watchForChanges(listener) {
        this._changeListener = listener;
    }
}
