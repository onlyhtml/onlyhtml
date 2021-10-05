import Field from "./field.js";

export class BlockType {
    static PAGE = 'page';
    static SECTION = 'section';
    static COLLECTION = 'collection';
    static COLLECTION_ITEM = 'collection_item';
    static CHOICE = 'choice'; // represented as a field but for handlebarse purpose can be 
                              // also a block (if { ... })
}

export class Block {
    constructor(id, type = BlockType.SECTION, options={}, fields=[]) {
        this.id = id;
        this.type = type;
        this.options = options;
        this.fields = fields;

        this.directChildren = [];
        this.weakChildren = [];
        this.hasCollectionItems = false;
    }

    getId() {
        return this.id;
    }

    getType() {
        return this.type;
    }

    isMultiple() {
        // TODO: type more applicable, {page, section, repeat-section}
        return isTrue(this.options.multiple);
    }

    /**
     * @param field {Field}
     */
    addField(field) {
        const currentField = this.fields.find(f => f.getId() == field.getId());

        if (currentField) {
            currentField.mergeOptions(field.getOptions()); 
            return;
        }

        this.fields.push(field);
    }

    /**
     * @returns {Field[]}
     */
    getFields() {
        return this.fields;
    }

    /**
     * @returns {object}
     */
    getOptions() {
        return this.options;
    }

    getOption(key, def) {
        return this.options[key] || def;
    }

    mergeOptions(newOptions) {
        this.options = Object.assign(this.options, newOptions);
    }

    addDirectChild(childBlock) {
        this.directChildren.push(childBlock);
    }

    addWeakChild(childBlock) {
        this.weakChildren.push(childBlock);
    }

    getDirectChildren() {
        return this.directChildren;
    }

    getWeakChildren() {
        return this.weakChildren;
    }

    /** 
     * @param other {Block}
     */
    mergeBlock(other) {
        this.hasCollectionItems = this.hasCollectionItems || other.hasCollectionItems;

        if (this.getType() !== other.getType()) {
            throw new Error('Cant merge two blocks with different types');
        }

        other.getFields().map(f => {
            this.addField(f);
        });

        this.mergeOptions(other.getOptions())
    }
}

function isTrue(v) {
    return v === 'true' || v === true;
}
