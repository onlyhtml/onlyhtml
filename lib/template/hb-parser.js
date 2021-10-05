import Field from './field.js';
import { Block, BlockType } from './block.js';
import { Visitor } from './visitor.js'; 

import { BlockIdField, BlockParentField } from './sugar-transformer.js';

const NativeHandlebarsBlocks = ['each', 'if', 'with', 'compare'];
const SpecialHashFields = [BlockIdField, BlockParentField];
const BackendMustacheNodeAllowlist = ['oh', 'declare'];
const GeneralBlockID = 'general';

export class HBTemplateParser extends Visitor {
    constructor() {
        super();
        this.currentBlock = new Block(GeneralBlockID);
        this.blocks = [this.currentBlock];
        this.blocksToParents = {};
    }

    /**
     * @param ast {Handlebars.AST}
     * @returns {[Block]}
     */
    static parse(ast) {
        const parser = new HBTemplateParser();
        parser.accept(ast);
        return parser.getBlocks();
    }

    /**
     * @returns {[Block]}
     */
    getBlocks() {
        const getBlock = (id) => {
            return this.blocks.filter(b => b.getId() === id)[0];
        }

        for (const [childId, parentIds] of Object.entries(this.blocksToParents)) {
            const child = getBlock(childId);
            // console.log('add inheritence', parentIds);

            if (parentIds.length > 1) {
                for (const parentId of parentIds) {
                    const parent = getBlock(parentId);
                    parent.addWeakChild(child);
                }
            } else {
                const parent = getBlock(parentIds[0]);
                parent.addDirectChild(child);
            }
        }

        return this.blocks;
    }

    program(programNode) {
        let self = this;
        programNode.body.map((statement) => { self.accept(statement)} );
    }

    blockstatement(blockNode) {
        let blockType = blockNode.path.original;
        let hasCollectionItems = false;

        // choice is a special case of a block node, 
        // that we represent as a field and not a block on our backend
        if (blockType === BlockType.CHOICE) {
            this.handleChoice(blockNode);
            return;
        }

        if (blockType === BlockType.COLLECTION_ITEM) {
            // this should not matter for the parser,
            // collection and collection_item defer only in rendering
            blockType = BlockType.COLLECTION; 
            hasCollectionItems = true;
        }

        if (NativeHandlebarsBlocks.includes(blockType)) {
            // ignore this when parsing but continue inwards to parse children
            if (blockNode.program) {
                this.accept(blockNode.program);
            }
            return;
        }

        let hashParams = {};
        if (blockNode.hash) {
            hashParams = this._hashToKeyValue(blockNode.hash);
        }

        if (blockNode.hash === undefined) {
            throw new Error(`Invaid block with type ${blockType}, without block Id`);
        }


        const blockId = this._findValueInPairs(blockNode.hash.pairs, BlockIdField);
        if (!blockId) {
            throw new Error('Block without ID');
        }
        
        const block = this._getOrCreateBlock(blockId.toString(), blockType, hashParams);

        if (blockType == BlockType.COLLECTION) {
            block.hasCollectionItems = hasCollectionItems;
        }

        if (this.currentBlock.getId() !== GeneralBlockID) {
            // we are handling a block with an inner block
            this._validateBlockInheritance(this.currentBlock, block);
            this._markInheritance(this.currentBlock.getId(), block.getId());
         }

        // enter the context of the inner block
        // pop back to the outer context when done
        if (blockNode.program) {
            const prevBlock = this.currentBlock;
            this.currentBlock = block;
            this.accept(blockNode.program);
            this.currentBlock = prevBlock;
        }
    }

    mustachestatement(mustacheNode) {
        // detect our special mustache node types
        let mustacheId = mustacheNode.path.original;

        if (BackendMustacheNodeAllowlist.includes(mustacheId) === false) {
            // only specific field types should be taken into account when parsing
            // this way our dashboard will not show local fields
            return;
        }

        mustacheId = mustacheNode.params[0].original;
        const options = this._hashToKeyValue(mustacheNode.hash || []);
        // console.log('parse options', options);
        const type = options.type || 'text';
        delete options['type'];

        const field = new Field(mustacheId, type, options);
        this.currentBlock.addField(field);
    }

    partialstatement(partialNode) {
        // if partial has a program, accept it as we don't need to resolve it ourselfs
        if (partialNode.program) {
            this.accept(partialNode.program);
            return;
        }

        throw new Error('Unexpected partial. SugarSyntaxTransformer should have inlined them already');
    }

    partialblockstatement(_block) {
        throw new Error('Inline partials are not supported yet');
    }

    handleChoice(choiceBlockNode) {
        if (choiceBlockNode.params.length < 1) {
            throw new Error('Choice without ID');
        }

        const id = choiceBlockNode.params[0].original;
        let hashParams = {};

        if (choiceBlockNode.hash) {
            hashParams = this._hashToKeyValue(choiceBlockNode.hash);
            hashParams.name = id; // This way choice has same parameters as a normal mustacheNode
        }

        this.currentBlock.addField(new Field(id, 'choice', hashParams));
        this.accept(choiceBlockNode.program);
    }

    // Notice! this removes SpecialHashFields
    _hashToKeyValue(hash) {
        const pairs = hash.pairs || [];
        const kv = pairs.map( p => {
            return [p.key, p.value.value];
        }).filter(kv => SpecialHashFields.includes(kv[0]) === false);

        return Object.fromEntries(kv);
    }

    _findValueInPairs(pairs, wantedKey) {
        const _pairs = pairs.filter( p => p.key === wantedKey ) || [];
        if (_pairs.length <= 0) { return undefined; }
        return _pairs[0].value.value;
    }

    /**
     *  get (or create if needed) the block for the given ID and type
     *  if a new block was created, add it to the block list `this.blocks`
     *  @param id {string}
     *  @param type {string}
     *  @param options {Object} should hold the hashParams from handlebars
     *  @returns {Block}
     */
    _getOrCreateBlock(id, type, options) {
        const blocks = this.blocks.filter(b => b.getId() === id);
        if (blocks.length > 1) {
            throw new Error(`More than one block with id=${id}`); 
        }

        if (blocks.length == 1) {
            const block = blocks[0];
            if (block.getType() !== type) {
                throw new Error(`Conflict two blocks with id=${id} but with conflicting types: ${type}, ${block.getType()}`);
            }

            block.mergeOptions(options);
            return block;
        }

        const block = new Block(id, type, options);
        this.blocks.push(block);
        return block;
    }

    _markInheritance(parentBlockId, childBlockId) {
        const parents = this.blocksToParents[childBlockId] || [];
        if (parents.includes(parentBlockId)) {
            return;
        }

        parents.push(parentBlockId);
        this.blocksToParents[childBlockId] = parents;
    }

    _validateBlockInheritance(parentBlock, childBlock) {
        // console.log('parent', parentBlock, 'child', childBlock);
        
        // page can't have an inner page
        // section can embed only repeat
        // repeat can embed any
        if (parentBlock.getType() === BlockType.PAGE) {
            if (childBlock.getType() === BlockType.PAGE) {
                throw new Error("Page block can't have a page child");
            }

            return;
        }
        
        if (parentBlock.getType() === BlockType.SECTION) {
            if (childBlock.getType() === BlockType.COLLECTION) {
                return;
            }

            throw new Error("Section block can only have collection children");
        }

        if (parentBlock.getType() === BlockType.COLLECTION) {
            throw new Error("Repeat block can't have children");
        }

        // unknown type
        throw new Error(`Unknown type of block parent: ${parentBlock.getType()}, child: ${childBlock.getType()}`);
    }

}
