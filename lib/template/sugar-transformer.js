import { BlockType } from './block.js';
import { RecursiveVisitor } from './visitor.js'; 

export const SpecialBlocks = [BlockType.PAGE, BlockType.SECTION, BlockType.COLLECTION, BlockType.CHOICE, BlockType.COLLECTION_ITEM];
export const SpecialMustacheNodes = ['oh', 'declare', 'local'];

export const BlockIdField = 'id';
export const BlockParentField = 'parent';

// Implements additional language features above Handlebars syntax
// Merges all partials into a single AST object
export class SugarSyntaxTransform extends RecursiveVisitor {

    /**
     * @param partials {Map<String, Handlebars.AST>}
     */
    constructor(partials) {
        super();
        this.blockCallStack = ['general'];
        this.partials = partials || new Map();
    }

    /**
     * @param name {String}
     * @param partial {Handlebars.AST}
     */
    addPartial(name, partial) {
        this.partials.set(name, partial);
    }

    /**
     * @returns {Handlebars.AST}
     */
    transform(ast) {
        return this.accept(ast);
    }

    /**
     *  @param {Handlebars.AST.BlockStatement} program
     */
    blockstatement(blockNode) {
        const blockType = blockNode.path.original;


        // allow writing {{#section contact_us sortable=false}} 
        // instead of {{#section this id="contact_us" sortable=false}}
        if (SpecialBlocks.includes(blockType) && blockNode.params.length >= 1) {
            const blockName = blockNode.params[0].original.toString(); // avoid numbers, all should be string

            if (blockType !== BlockType.CHOICE) {
                blockNode.params[0].parts = [];
                blockNode.params[0].original = 'this';
            }

            blockNode.hash = blockNode.hash || newHashObject();
            blockNode.hash.pairs = blockNode.hash.pairs || [];
            blockNode.hash.pairs.push(newHashPair(BlockIdField, blockName));
            blockNode.hash.pairs.push(newHashPair(BlockParentField, this._currentBlockName()));

            if (blockNode.program) { 
                blockNode.program = this.acceptAndPushStack(blockNode.program, blockName);
            }
        }
        else if (blockNode.program) { 
            blockNode.program = this.accept(blockNode.program); 
        }

        return blockNode;
    }

    mustachestatement(mustacheNode) {
        const nodeType = mustacheNode.path.original; // ic, declare etc..

        // this is a interneto directive mustache node
        if (SpecialMustacheNodes.includes(nodeType)) {
            const params = mustacheNode.params;
            if (!params || params.length == 0 || !params[0].original) {
                console.log('bad component', mustacheNode);
                throw new Error('iComponent without name');
            }

            const fieldName =  params[0].original;
            const parentBlock = this._currentBlockName();
            mustacheNode.hash = mustacheNode.hash || newHashObject();
            mustacheNode.hash.pairs.push(newHashPair('name', fieldName));
            mustacheNode.hash.pairs.push(newHashPair('parent', parentBlock));
        }
        // console.log(mustacheNode);
        return mustacheNode;
    }

    partialstatement(partialNode) {
        const name = partialNode.name.original;
        if (!name || this.partials.has(name) === false) {
            console.warn(`Can't parse partial with unknown name "${name}"`);
            return partialNode;
        }

        partialNode.program = this.accept(this.partials.get(name));
        return partialNode;
    }

    partialblockstatement(_block) {
        throw new Error('Inline partials are not supported');
    }
}

function newHashPair(key, value) {
    return {
        type: 'HashPair',
        key: key,
        value: {
          type: 'StringLiteral',
          value: value,
          original: value,
          loc: []
        }
    };
}

function newHashObject() {
    return {
        type: 'Hash',
        pairs: [],
        loc: undefined
    };
}
