import {assert} from 'chai';
import choice from './choice.js';

describe('choice rendering', function () {
    it('positive choice', function () {
        assert.equal(
            choice('true', {options: 'yes'}),
            'yes',
        );
    });

    it('negative choice', function () {
        assert.equal(
            choice('false', {options: 'yes'}),
            undefined,
        );
    });

    it('negative choice with value', function () {
        assert.equal(
            choice('false', {options: 'yes,no'}),
            'no',
        );
    });

    it('without options', function () {
        assert.equal(choice('false'), undefined);
        assert.equal(choice('true'), 'true');
    });
});
