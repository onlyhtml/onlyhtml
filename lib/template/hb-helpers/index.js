import { getBlockHelper } from './block.js';
import { getCollectionHelper } from './collection.js';
import { collectionItemHelper } from './collection-item.js';
import choiceHelper from './conditionals.js';
import getDirectiveHelper from './icomponents.js';
import getLocalDirectiveHelper from './local.js';
import UtilHelpers from './util-helpers.js';

import { BlockType } from '../block.js';

// import hbhelpers from 'handlebars-helpers'

/**
 * @param handlebars {import 'handlebars'}
 */
export function registerHelpers(handlebars) {
    // core helpers
    handlebars.registerHelper(BlockType.PAGE, getBlockHelper());
    handlebars.registerHelper(BlockType.SECTION, getBlockHelper());
    handlebars.registerHelper(BlockType.COLLECTION, getCollectionHelper());
    handlebars.registerHelper(BlockType.COLLECTION_ITEM, collectionItemHelper);
    handlebars.registerHelper(BlockType.CHOICE, choiceHelper);
    handlebars.registerHelper('oh', getDirectiveHelper());
    handlebars.registerHelper('local',getLocalDirectiveHelper()); // local fields are to be rendered but not sent to the backend 
    handlebars.registerHelper('declare', function(){ return ''; }); // declare nodes are for the backend, not to be rendered
    // utilty helpers
    handlebars.registerHelper('split', UtilHelpers.split);
    handlebars.registerHelper('range', UtilHelpers.range);
    handlebars.registerHelper('json', UtilHelpers.json);
    handlebars.registerHelper('sum', UtilHelpers.sum);
    handlebars.registerHelper('subtract', UtilHelpers.subtract);
    handlebars.registerHelper('divide', UtilHelpers.divide);

    handlebars.registerHelper('compare', UtilHelpers.compare);
    handlebars.registerHelper('length', UtilHelpers.length);

    // console.log('hb helpers', hbhelpers, hbhelpers.math, Object.keys(hbhelpers));
    // hbhelpers.comparison({handlebars: handlebars});
    // hbhelpers.math({handlebars: handlebars});

}
