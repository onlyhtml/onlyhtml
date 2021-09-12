import {assert} from 'chai';

import {kvToHtml} from './util.js';

describe("directive util functions", function () {
    it("happy flow works", function() {
        const kv = {
            b: 'a',
            c: 'hello',
        }
        assert.equal(kvToHtml(kv).trim(), 'b="a" c="hello"');
    });

    it("does not quote numbers", function() {
        const kv = {
            a: 1,
            b: 'a',
            c: 'hello',
        }
        assert.equal(kvToHtml(kv).trim(), 'a=1 b="a" c="hello"');
    });

    it("blacklist is functional", function() {
        const kv = {
            a: 1,
            b: 'a',
            c: 'hello',
        }
        assert.equal(kvToHtml(kv, ['a', 'b', 'c'], ['a']).trim(), 'b="a" c="hello"');
    });

    it("only uses key from whitelist", function() {
        const kv = {
            a: 1,
            b: 'a',
            c: 'hello',
        }
        assert.equal(kvToHtml(kv, ['b', 'c']).trim(), 'b="a" c="hello"');
    });

    it("empty input is empty string", function() {
        assert.equal(kvToHtml(), '');
    });

    it("first char must be space with input is not empty", function() {
        const firstChar = kvToHtml({x: 1}).substr(0,1);
        assert.equal(firstChar, ' ');
    });
});
