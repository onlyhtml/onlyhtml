import {assert} from 'chai';
import date from './date.js';

describe('date rendering', function () {
    it('parse date with default format', function () {
        assert.equal(date(1597179600000), 'August 11, 2020');
    });

    it('parse date with specific format', function () {
        assert.equal(date(1597179600000, {format: '%d/%m/%Y'}), '11/08/2020');
    });

    it('date with timezone', function () {
        const HOUR = 60;
        assert.equal(date(1597179600000, {
            format: '%d/%m/%Y',
            timezone: +HOUR * 3,
        }), '12/08/2020');
    });

    it('date with string timezone', function () {
        assert.equal(date(1597179600000, {
            format: '%d/%m/%Y',
            timezone: '+0300',
        }), '12/08/2020');
    });
});
