import {assert} from 'chai';
import link from './link.js'

describe("link rendering", function() {
    it('renders a link', function() {
        const json = JSON.stringify({
            href: '/example',
            text: 'hello',
        });
        assert.equal(link(json, {}), '<a href="/example">hello</a>');
    });

    it('supports class', function() {
        const json = JSON.stringify({
            href: '/example',
            text: 'hello',
        });
        assert.equal(link(json, {class: 'abc'}), '<a href="/example" class="abc">hello</a>');
    });

    it('does not crash on empty data', function() {
        assert.doesNotThrow(() => {
            link(undefined);
        });
    });
});
