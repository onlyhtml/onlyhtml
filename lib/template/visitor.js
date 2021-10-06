export class Visitor {

  /**
    Tries to call the method name found on `object.type`.
    @method accept
    @param {Object} object
    @param {Object} options
  */
    accept(object, options = {}) {
        if (!object || !object.type) {
            console.log('handlebars object', object);
            throw new Error('Invalid Handlebars AST Object without type');
        }

        var handler = this[object.type.toLowerCase()];
        if (handler) {
            return handler.call(this, object, options);
        } 

        return object;
    }
}

export class RecursiveVisitor extends Visitor {
    constructor() {
        super();
        this.blockCallStack = ['general'];
    }

    /**
     *  @param {Handlebars.AST.ProgramNode} program
     */
    program(programNode) {
        let self = this;
        programNode.body = programNode.body.map(function(statement) {
            return self.accept(statement);
        });

        return programNode;
    }

    acceptAndPushStack(blockNode, blockName) {
        this._pushCallStack(blockName);
        const ret = this.accept(blockNode);
        this._popCallStack();
        return ret;
    }

    _pushCallStack(blockName) {
        if (!blockName) { 
            throw new Error('Given blockname is empty');
        }

        this.blockCallStack.push(blockName);
    }

    /**
     * @returns {string}
     */
    _popCallStack() {
        if (this.blockCallStack.length <= 1) {
            throw new Error('Cant pop the last item in call stack');
        }

        return this.blockCallStack.pop();
    }

    /**
     * @returns {string}
     */
    _currentBlockName() {
        return this.blockCallStack[this.blockCallStack.length - 1];
    }
}
