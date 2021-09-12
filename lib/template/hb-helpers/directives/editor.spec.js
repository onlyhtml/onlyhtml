import chai from 'chai';
import chaiStrings from 'chai-string';
chai.use(chaiStrings);
const { assert } = chai;

import editor from './editor.js';
import htmlparser from 'node-html-parser';

describe('editor directive rendering', function () {
    it("happy flow should work", function() {
        const root = htmlparser.parse(editor('Hello World'));
        const node = root.firstChild;

        console.log(node.classList.values());


        assert.equalIgnoreCase(node.tagName, 'div');
        assert.isTrue(node.classList.contains('ql-editor'));
        assert.equal(node.innerText, 'Hello World');
    });
});
