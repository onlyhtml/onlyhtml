import Logger from "../logger.js";
import sanityClient from '@sanity/client'
import blocksToHtml from '@sanity/block-content-to-html'
import parse5 from 'parse5'
import imageUrlBuilder from '@sanity/image-url'

import {Block, BlockType} from "../template/block.js";


const { defaultSerializers }  = blocksToHtml;

export class ChangeType {
    static UPDATE_OR_CREATE = 'update_or_create';
    static DELETE = 'delete';
}

export default class SanityFetcher {

    /**
     * @param sanityConfig {object} config info for sanity
     * @param blocks {Map<string, Block>} mapping between type to block schema
     */
    constructor(sanityConfig, blocks) {
        this.sanityConfig = sanityConfig;
        this.sanity = sanityClient(sanityConfig);
        this.blocks = blocks;
        this.query = '*[_type in $types] { ..., "order": coalesce(order, 0) } | order(order asc)';
        this.params = {
            types: Object.keys(blocks),
        };
    }

    subscribeToChanges(callback) {
        if (this._subscription !== undefined) {
            Logger.warn('subscribed more than once');
            return;
        }

        this._subscription = this.sanity.listen(this.query, this.params).subscribe(async (update) => {
            Logger.extra('[sanity/fetcher] on update');

            if (update.result && callback) {
                let doc = update.result;
                doc = await this._prepareDoc(doc);
                callback(ChangeType.UPDATE_OR_CREATE, doc);
                return;
            }

            if (update.mutations && callback) {
                for (const mutation of update.mutations) {
                    if (mutation.delete) {
                        callback(ChangeType.DELETE, {id: mutation.delete.id});
                    }
                }
                return;
            }
        });
    }

    /*
     * @returns {Promise<object>} a map from blockName -> document | list of documents 
     */
    async fetchRecords() {
        // sanity returns a flat list of documents
        // the _type field is equivilent to the name of the field in interneto block
        const sanityDocs = await this.sanity.fetch(this.query, this.params);

        const records = {};
        for (const doc of sanityDocs) {
            if (this.blocks[doc._type].type == BlockType.COLLECTION) {
                records[doc._type] = records[doc._type] || [];
                records[doc._type].push(await this._prepareDoc(doc));
                Object.assign(records, await this._prepareDirectChildren(doc));
                continue;
            }

            records[doc._type] = await this._prepareDoc(doc);
            Object.assign(records, await this._prepareDirectChildren(doc));
        }

        return records;
    }

    async _prepareDirectChildren(doc) {
        const block = this.blocks[doc._type];
        if (block === undefined) {return {};}
        // console.log('prepare direct child', block.id);
        return await this._prepareDirectChildrenWithBlock(doc, block);
    }

    async _prepareDirectChildrenWithBlock(doc, block) {
        if (!block.directChildren) {
            return {};
        }

        let internalRecords = {};
        for (const childBlock of block.directChildren) {
            // console.log('prepare direct child', childBlock.id);

            if (!(childBlock.id in doc)) {
                continue
            }

            if (childBlock.type === BlockType.COLLECTION) {
                let childDocs = doc[childBlock.id];
                internalRecords[childBlock.id] = await Promise.all(childDocs.map(doc => {
                    if (doc.directChildren !== undefined && doc.directChildren.length !== 0) {
                        throw new Error("Unimlemented, direct children of child array");
                    }

                    return this._prepareDocWithBlock(doc, childBlock);
                }));

                // this._prepareDirectChildrenWithBlock(childDocs, childBlock);
                continue;
            }

            const childDoc = doc[childBlock.id];
            internalRecords[childBlock.id] = await this._prepareDocWithBlock(childDoc, childBlock);
            Object.assign(internalRecords, await this._prepareDirectChildrenWithBlock(childDoc, childBlock));
        }

        return internalRecords;
    }

    async _prepareDoc(doc) {
        const block = this.blocks[doc._type];
        return await this._prepareDocWithBlock(doc, block);
    }


    async _prepareDocWithBlock(doc, block) {
        if (block === undefined) {
            throw new Error(`no block with type ${doc._type}`);
        }

        for (const field of block.fields) {
            if (!(field.id in doc)) {
                // field is in schema decleration but not in document
                continue;
            }

            // copy value so if we edit it we dont change the original field type
            let fieldType = field.type;

            // handle references before other types so we can handle references to images too
            if (fieldType === 'reference' && Array.isArray(doc[field.id]) === true) {
                const refs = doc[field.id].map(d => d._ref);
                const refDocs = await this.sanity.fetch('*[_id in $refs]', {refs: refs});
                doc[field.id] = refDocs;
                fieldType = 'array';
            }
            else if (fieldType === 'reference') {
                const refDoc = await this.sanity.fetch('*[_id == $_ref]', {_ref: doc[field.id]._ref});
                doc[field.id] = refDoc;
            }
            else if (fieldType === 'video') {
                console.log('field type video', doc[field.id]);
                const videoDoc = doc[field.id];
                if (videoDoc && videoDoc.asset && videoDoc.asset._ref) {
                    const videoRef = videoDoc.asset._ref;
                    console.log('fetched video doc', videoRef);
                    doc[field.id] = await this.sanity.getDocument(videoRef)
                }
            }

            if (fieldType === 'array') {
                const newDocs = [];
                // recursive resolving for array of references
                for (const innerDoc of doc[field.id]) {
                    newDocs.push(await this._prepareDoc(innerDoc));
                }
                doc[field.id] = newDocs;
            }


            if (fieldType === 'html') {
                doc[field.id] = this._prepareHtmlField(doc[field.id]);
            }

            if (fieldType === 'image') {
                doc[field.id] = this._prepareImageField(doc[field.id]);
            }

            if (fieldType === 'video') {
                // note: result my be undefined, we trust the template engine will handle this.
                console.log('video - before', doc[field.id]);
                doc[field.id] = this._prepareVideoField(doc[field.id]);
                console.log('video - after', doc[field.id]);
            }
        }

        if (block.type == BlockType.COLLECTION && doc.slug) {
            doc._permalink = `/${doc._type}/${doc.slug.current}`;
        }

        return doc;
    }

    _prepareHtmlField(source) {
        return blocksToHtml({
            blocks: source,
            projectId: this.sanityConfig.projectId,
            dataset: this.sanityConfig.dataset,
            serializers: {
                types: {
                    code: this._prepareHtmlCodeSection.bind(this),
                    raw: this._prepareRawSection.bind(this),
                    table: this._prepareTableSection.bind(this),
                    block: this._preapreBlockElement.bind(this),
                }
            }
        });
    }

    // hook block element rendering to add id's to header elements
    _preapreBlockElement(props) {
        const { node } = props;
        const nodeStyle = node.style || 'normal';

        if (nodeStyle.startsWith('h')) {
            const titleElm = defaultSerializers.types.block(props)
            titleElm.id = encodeURIComponent(getInnerTextHyperscript(titleElm).replaceAll(' ', '-'));
            return titleElm;
        }

        return defaultSerializers.types.block(props)
    }

    _prepareTableSection(props) {
        const h = blocksToHtml.h;

        const rows = props.node.rows;
        if (rows.length < 1) {return '';}

        return h('table',
            h('tr', rows[0].cells.map(cell => h('th', cell))),
            rows.slice(1).map(row => {
                return h('tr',
                    row.cells.map(cell => h('td', cell)),
                )
            })
        );
    }

    _prepareHtmlCodeSection(props) {
        // `h` is a way to build HTML known as hyperscript
        const h = blocksToHtml.h;
        const className = `${props.node.language} language-${props.node.language}`;
        return h('pre', {className: className},
            h('code', {className: className}, props.node.code),
        );
    }

    _prepareRawSection(props) {
        return htmlToHyperscript(props.node.code);
    }

    _prepareImageField(source) {
        const builder = imageUrlBuilder(this.sanity);
        return builder.image(source).url();
    }

    _prepareVideoField(video) {
        if (!video.playbackId) {
            return undefined;
        }

        return `mux:${video.playbackId}`
        // return `hls:https://stream.mux.com/${assetDocument.playbackId}.m3u8`
    }
}

function getInnerTextHyperscript(node) {
    const values = []
    if (node.childNodes) {
        values.push(node.childNodes.map(c => getInnerTextHyperscript(c)))
    }


    return `${node.value || ''} ${values.join(' ')}`.trim()
}

function htmlToHyperscript(html) {
    const h = blocksToHtml.h;

    function parse5ToHyperscript(doc) {
        if (doc === undefined) {return undefined;}

        // return the actual content of the node, has no tag name as it is just text
        if (!doc.tagName && typeof doc.value === 'string') {
            return doc.value;
        }

        let children = [];
        if (Array.isArray(doc.childNodes)) {
            children = doc.childNodes.map(node => parse5ToHyperscript(node))
        }

        const attrs = {};
        doc.attrs.map(attr => attrs[attr.name] = attr.value);

        return h(doc.tagName, attrs, children);
    }

    const document = parse5.parseFragment(`<div class="embed">${html}</div>`);
    const documentHtml = document.childNodes[0];
    const out = parse5ToHyperscript(documentHtml);
    return out;
}
