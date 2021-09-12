import {assert} from 'chai';
import icon from './icon.js';

describe("directive icon rendering", function () {
    it("happy flow works", function(){
        const html = icon('icons');
        assert.equal(html, '<i class="fas fa-icons"></i>');
    });

    it("should allow adding custom classes", function() {
        const html = icon('icons', {class: 'fa-2x'});
        assert.equal(html, '<i class="fas fa-icons fa-2x"></i>');
    });
});
