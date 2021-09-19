import {assert} from 'chai';
import Template from './hb-glue.js';
import { Block, BlockType } from './block.js';
import Field from './field.js';

describe('rendering vapid syntax templates', function () {

    function render(templateString, values) {
        const template = new Template();
        return template.render(templateString, values);
    }

    describe("block rendering", function () {
        it("render page block", function () {
            assert.equal(
                render("{{#page page_a}} hello {{/page}}", {page_a: 1}).trim(),
                "hello");
            assert.equal(
                render("{{#page page_a a=1}} hello {{/page}}", {page_a: 1}).trim(),
                "hello");
        });

        it("render section block", function () {
            assert.equal(
                render("{{#section contact_us}} hello {{/section}}", {contact_us: 1}).trim(),
                "hello");
            assert.equal(
                render("{{#section contact_us a=1}} hello {{/section}}", {contact_us: 1}).trim(),
                "hello");
        });

        it("render block in block", function () {
            const params = {
                home_page: {},
                contact_us: {
                    title: 'Hello World',
                }
            };

            const template = `{{#page home_page}} {{#section contact_us}} {{title}} {{/section}} {{/page}}`;

            assert.equal(
                render(template, params).trim(),
                "Hello World");
        });

        it("render field in section with numeric name", function() {
            const template = `{{#page 404}}{{title}}{{/page}}`;
            assert.equal(render(template, { 404: { title: 'Hello' }}), 'Hello');
        });

        it("dont allow page as non-block helper", function () {
            const template = `{{page}}`
            const params = {page: 'hello'};
            assert.throws(() => {render(template, params)}, 'Block must be called from block context only');
        });

        it("dont allow page as non-block helper with option", function () {
            const template = `{{page aaa}}`
            const params = {page: 'hello'};
            assert.throws(() => {render(template, params)}, 'Block must be called from block context only');
        });

        it("should render collection block", function() {
            const template = '{{#collection my_collection}}{{field}},{{/collection}}'
            const params = {
                my_collection: [{field: 'a'}, {field: 'b'}, {field: 'c'}]
            }

            assert.equal(render(template, params), 'a,b,c,');
        });
        it("should render collection block with oh field", function() {
            const template = '{{#collection my_collection}}{{oh field}},{{/collection}}'
            const params = {
                my_collection: [{field: 'a'}, {field: 'b'}, {field: 'c'}]
            }

            assert.equal(render(template, params), 'a,b,c,');
        });

        it("render block with @index", function() {
            const template = '{{#collection my_collection}}[{{@index}},{{field}}]{{/collection}}'
            const params = {
                my_collection: [{field: 'a'}, {field: 'b'}, {field: 'c'}]
            }

            const rendered = render(template, params);
            assert.equal(rendered, '[1,a][2,b][3,c]');
        });

        it("dont render `declare` field", function() {
            const template = "{{declare title type='text'}}";
            const params = {
                title: "Hello World",
            };

            assert.equal(render(template, params), "");
        });

        it("should be able to render values with same key name from different blocks", function() {
            const template = `
                {{oh title}}
                {{#section my_section}}
                    {{oh title}}
                {{/section}}
            `;
            const params = {
                title: 'Title 3',
                general: {title: 'Main Title'},
                my_section: {title: 'Another Title'},
            };

            const rendered = render(template, params).trim();
            assert.include(rendered, 'Main Title');
            assert.include(rendered, 'Another Title');
            assert.notInclude(rendered, 'Title 3');
        });

        it("should be able to render values with same key name from different blocks inside a page block", function() {
            const template = `
                {{#page main_page}}
                    {{oh title}}
                    {{#section my_section}}
                        {{oh title}}
                    {{/section}}
                {{/page}}
            `;
            const params = {
                title: 'Title 3',
                main_page: {},
                general: {title: 'Main Title'},
                my_section: {title: 'Another Title'},
            };

            const rendered = render(template, params).trim();
            assert.notInclude(rendered, 'Main Title');
            assert.include(rendered, 'Another Title');
        });

        it("should not render values from when inside other blocks", function() {
            const template = `
                {{#page main_page}}
                    {{oh title}}
                    {{#section my_section}}
                        {{oh title}}
                    {{/section}}
                {{/page}}
            `;
            const params = {
                general: {title: 'Main Title'},
            };

            const rendered = render(template, params).trim();
            assert.notInclude(rendered, 'Main Title');
        });

        it("should render fields without parent blocks from general", function() {
            const template = '{{oh title}}';
            const params = {
                title: 'XXX',
                general: {title: 'YYY'},
            };

            const rendered = render(template, params).trim();
            assert.equal(rendered, 'YYY');
        });

        it("should render fields with corrent parents even within partials", function() {
            const template = new Template();

            template.registerPartialString('my_partial', `{{oh field type="text"}}`);
            const tmpl = `{{#page main_page}}
                {{> my_partial}}
            {{/page}}`;

            const rendered = template.render(tmpl, {
                main_page: {
                    field: 'Hello World'
                }
            }).trim();
            assert.equal(rendered, 'Hello World');
        });

        it("sanity check of partial params", function() {
            const template = new Template();
            const tmpl = `{{> my_partial param="123"}}`;;
            template.registerPartialString('my_partial', `{{param}}`);

            const rendered = template.render(tmpl, {
                main_page: { }
            }).trim();

            assert.equal(rendered, '123');
        });

        it("should render partials with parameters", function() {
            const template = new Template();
            const tmpl = `{{#page main_page}}
                {{> my_partial param="123"}}
            {{/page}}`;

            template.registerPartialString('my_partial', `{{param}}`);

            const rendered = template.render(tmpl, {
                main_page: { }
            }).trim();

            assert.equal(rendered, '123');
        });

        it("should render partials with parameters and local", function() {
            const template = new Template();
            const tmpl = `{{#page main_page}}
                {{> my_partial param="123"}}
            {{/page}}`;

            template.registerPartialString('my_partial', `{{local param}}`);

            const rendered = template.render(tmpl, {
                main_page: { }
            }).trim();

            assert.equal(rendered, '123');
        });

    });

    describe("choice block", function () {
        it("render true choice directive with type parameter", function () {
            const template = '{{#choice is_visible type="checkbox"}}visible{{/choice}}'
            const params = {general: {is_visible: true}};
            assert.equal(render(template, params), 'visible');
        });
        it("render true choice directive", function () {
            const template = '{{#choice is_visible}}visible{{/choice}}'
            const params = {general: {is_visible: true}};
            assert.equal(render(template, params), 'visible');
        });
        it("render false choice directive", function () {
            const template = '{{#choice is_visible}}visible{{/choice}}'
            const params = {general: {is_visible: false}};
            assert.equal(render(template, params), '');
        });
    });

    describe("oh directives", function () {
        // it("render oh image component", function () {
        //     const url = '11-2222-333';
        //     const template = '{{oh image_field type="image"}}';
        //     const values = {general: {image_field: 'img:'+url}};
        //     assert.equal(render(template, values), `<img src="uploads/${url}" />`);
        // });

        // it("render single image with different params", function () {
        //     const template = `{{oh image_1 type="image" width=20}}{{oh image_1 type="image" width=32}}`;
        //     const values = {general: {image_1: 'img:IMG_URL'}};
        //     assert.equal(render(template, values), '<img src="uploads/IMG_URL" width=20 /><img src="uploads/IMG_URL" width=32 />');
        // });

        it("dont allow oh block", function () {
            const template = '{{#oh image_1 type="image"}}{{/oh}}';
            const values = {general: {image_1: 'IMAGE_URL'}};
            assert.throws(() => {render(template, values)}, '');
        });

        it('parse a complex oh directive', function() {
            const template = new Template();
            const blocks = template.parse('{{oh some_icon type="editor"}}');
            const block = blocks[0];
            const field = block.getFields()[0];

            assert.equal(field.getId(), 'some_icon');
            assert.equal(field.getType(), 'editor');
        });
    });

    it("should render template with empty values", function() {
        const template = `
            {{#page main_page}}
                {{title}}
                {{sub_title}}
            {{/page}}
            {{some_field}}
            {{oh some_other_field key="value"}}
        `;
        assert.doesNotThrow(() => {
            render(template, {});
        });
    });

});

describe('parse templates', function () {
    function parse(templateString) {
        const template = new Template();
        return template.parse(templateString);
    }

    function NewField(name, type='text', params={}) {
        params.name = name;
        return new Field(name, type, params);
    }

    /**
     * all fields are owned by a block 
     */

    it("parse one mustache field", function () {
        const structure = parse('{{oh aa}}');
        assert.deepEqual(
            structure,
            [new Block('general', BlockType.SECTION, {}, [NewField('aa')])],
        );
    });

    it("parse one complex mustache field", function () {
        const structure = parse('{{oh aa type="image" class="w-full"}}');
        assert.deepEqual(
            structure,
            [new Block('general', BlockType.SECTION, {}, [
                NewField('aa', 'image', {'class': 'w-full'})
            ])],
        );
    });

    it("parse block with field", function () {
        const structure = parse('{{#page home_page}} {{oh aa}} {{/page}}');
        assert.deepEqual(
            structure,
            [
                new Block('general'),
                new Block('home_page', BlockType.PAGE, {}, [NewField('aa')]),
            ]
        );
    });

    it("parse block numeric name", function () {
        const structure = parse('{{#page 404}} {{oh aa}} {{/page}}');
        assert.deepEqual(
            structure,
            [
                new Block('general'),
                new Block('404', BlockType.PAGE, {}, [NewField('aa')]),
            ]
        );
    });

    it("parse page with inner section and field", function () {
        const structure = parse('{{#page home_page}} {{#section contact}} {{oh aa}} {{/section}} {{/page}}');
        const general = new Block('general');
        const homePage = new Block('home_page', BlockType.PAGE);
        const contact = new Block('contact', BlockType.SECTION, {}, [NewField('aa')])
        homePage.addDirectChild(contact);

        assert.deepInclude(structure, general);
        assert.deepInclude(structure, homePage);
        assert.deepInclude(structure, contact);
    });

    it("parse page with hash parameter", function () {
        const structure = parse('{{#page home_page slug="/111"}} {{oh aa}} {{/page}}');
        assert.deepEqual(
            structure,
            [
                new Block('general'),
                new Block('home_page', BlockType.PAGE, {'slug': '/111'}, [NewField('aa')]),
            ]
        );
    });

    it("parse conditional field", function () {
        const structure = parse('{{#choice is_rtl}} {{oh aa}} {{/choice}}');
        assert.deepEqual(
            structure,
            [new Block('general', BlockType.SECTION, {}, [NewField('is_rtl', 'choice'), NewField('aa')])],
        );
    });

    it("parse conditional field and hash parameter", function () {
        const structure = parse('{{#choice is_rtl type="dropdown"}} {{oh aa}} {{/choice}}');
        assert.deepEqual(
            structure,
            [new Block('general', BlockType.SECTION, {}, [NewField('is_rtl', 'choice', {'type': 'dropdown'}), NewField('aa')])],
        );
    });

    it("ignore if block", function() {
        const structure = parse('{{#if is_rtl}}{{/if}}');
        assert.deepEqual(structure, [
            new Block('general')
        ]);
    });

    it("parse contents of if block", function() {
        const structure = parse('{{#if is_rtl}} {{oh aaa}} {{/if}}');
        assert.deepEqual(structure, [
            new Block('general', 'section', {}, [
                NewField('aaa')
            ]),
        ]);
    });

    it("parse contents with partial", function() {
        const template = new Template();
        template.registerPartialString('my_partial', '{{oh aaa}}');
        const structure = template.parse('{{> my_partial}}');

        assert.deepEqual(structure, [
            new Block('general', BlockType.SECTION, {}, [
                NewField('aaa'),
            ]),
        ]);
    });

    it("parse contents with partial slash name", function() {
        const template = new Template();
        template.registerPartialString('my_partial/aa', '{{oh aaa}}');
        const structure = template.parse('{{> my_partial/aa }}');

        assert.deepEqual(structure, [
            new Block('general', BlockType.SECTION, {}, [
                NewField('aaa')
            ]),
        ]);
    });

    it("parse contents with partial with section", function() {
        const template = new Template();
        template.registerPartialString('my_partial', '{{#page home_page}} {{oh aaa}} {{/page}}');
        const structure = template.parse('{{> my_partial}}');

        assert.deepEqual(structure, [
            new Block('general'),
            new Block('home_page', BlockType.PAGE, {}, [
                NewField('aaa')
            ]),
        ]);
    });

    it("should be able to parse two blocks with same id", function() {
        const template = new Template();
        const structure = template.parse('{{#section section_key}} {{oh field_a}} {{/section}} {{#section section_key}} {{oh field_b}} {{/section}}');
        assert.deepEqual(structure, [
            new Block('general'),
            new Block('section_key', BlockType.SECTION, {}, [
                NewField('field_a'),
                NewField('field_b'),
            ])
        ]);

    });

    it("should be able to parse three blocks with same id", function() {
        const template = new Template();
        const structure = template.parse('{{#section section_key}} {{oh field_c}} {{/section}}{{#section section_key}} {{oh field_a}} {{/section}} {{#section section_key}} {{oh field_b}} {{/section}}');
        assert.deepEqual(structure, [
            new Block('general'),
            new Block('section_key', BlockType.SECTION, {}, [
                NewField('field_c'),
                NewField('field_a'),
                NewField('field_b')
            ])
        ]);
    });

    it("dont allow strange block inheritence", function() {
        const template = new Template();
        const cases = [
            '{{#section section_key}}{{oh field_a}}{{/section}}{{#page section_key}}{{aa}}{{/page}}', // same section id with different types
            '{{#page page_id}} {{oh field_a}} {{{#page page_id_2}}{{aa}}{{/page}} {/page}}', // page inside a page
            '{{#section block_id}} {{oh field_a}} {{{#page page_id_2}}{{aa}}{{/page}} {/section}}', // page inside a section 
            '{{#repeat block_id}} {{oh field_a}} {{field_b}} {{{#page page_id_2}}{{aa}}{{/page}} {/repeat}}', // page inside a repeat 
        ];

        for (const testcase of cases) {
            assert.throws(() => template.parse(testcase));
        }
    });

    it("dont allow blocks with themselvs as children", function() {
        for (const type of [BlockType.PAGE, BlockType.SECTION, BlockType.COLLECTION, BlockType.COLLECTION_ITEM]) {
            const template = new Template();
            assert.throws(() => {
                template.parse(`{{#${type} block_id}} {{field_a}} {{{#${type} block_id}}{{aa}}{{/${type}}} {/${type}}}`);
            })
        }
    });

    it("should parse `declare` field", function() {
        const tmpl = "{{declare title type='text'}}";
        const template = new Template();

        const blocks = template.parse(tmpl);
        assert.equal(blocks.length, 1);
        assert.equal(blocks[0].getFields().length, 1);

        const field = blocks[0].getFields()[0];
        assert.equal(field.getId(), 'title');
        assert.equal(field.getType(), 'text');
    });

    describe("block inheritence", function() {
        /**
         * @returns {Block}
         */
        function findBlock(blocks, id) {
            return blocks.filter(b => b.getId() === id)[0];
        }

        it("page with primary child", function() {
            const template = new Template();
            const structure = template.parse("{{#page main_page}} {{#section child}} {{oh field}} {{/section}} {{/page}}");
            const mainPage = findBlock(structure, 'main_page');
            const expected = [ new Block("child", BlockType.SECTION, {}, [ NewField('field')]) ];
            assert.deepEqual(mainPage.getDirectChildren(), expected)
        });

        it("page with repeat child", function() {
            const template = new Template();
            const structure = template.parse("{{#page main_page}} {{#collection child}} {{oh field}} {{/collection}} {{/page}}");
            const mainPage = findBlock(structure, 'main_page');
            const expected = [ new Block("child", BlockType.COLLECTION, {}, [ NewField('field')]) ];
            assert.deepEqual(mainPage.getDirectChildren(), expected)
        });

        it("section child with two parents", function() {
            const template = new Template();
            const structure = template.parse("{{#page page_one}} {{#section child}}{{/section}} {{/page}} {{#page page_two}} {{#section child}}{{/section}} {{/page}}");
            const pageOne = findBlock(structure, 'page_one');
            const pageTwo = findBlock(structure, 'page_two');

            assert.deepEqual(pageOne.getWeakChildren(), [ new Block("child") ]);
            assert.deepEqual(pageTwo.getWeakChildren(), [ new Block("child") ]);
        });

        it("block inheritence should work through paritals", function() {
            const template = new Template();
            template.registerPartialString('my_partial', '{{#section child}} {{oh field}} {{/section}}');
            const structure = template.parse("{{#page main_page}} {{> my_partial}} {{/page}}");
            const mainPage = findBlock(structure, 'main_page');
            assert.deepEqual(mainPage.getDirectChildren(), [ new Block('child', BlockType.SECTION, {}, [ NewField('field') ])] );
        });

        it("choice block should not account for inheritence", function() {
            const template = new Template();
            const structure = template.parse(`{{#page main_page}} 
                {{#choice aaa}} 
                    {{#section child}} 
                        {{oh field}} 
                    {{/section}} 
                {{/choice}} 
            {{/page}}`);

            const mainPage = findBlock(structure, 'main_page');
            assert.deepEqual(mainPage.getDirectChildren(), [ 
                new Block('child', BlockType.SECTION, {}, [ NewField('field') ])
            ]);
        });

        it("should be able to parse #collection-item fields", function() {
            const template = new Template();
            const structure = template.parse(`
                {{#collection_item post}}
                    {{oh title}}
                {{/collection_item}}
            `);

            const post = findBlock(structure, 'post');
            const expectedBlock = new Block('post', 'collection', {}, [
                NewField('title')
            ]);
            expectedBlock.hasCollectionItems = true;

            assert.deepEqual(post, expectedBlock);
        });

    });

    describe("local mustache field", function() {
        it("parsing should ignore `local` fields", function() {
            const template = new Template();
            const structure = template.parse(`
                {{oh field_a}}
                {{local field_b}}
                {{oh field_c}}
            `);

            const general = structure[0];
            const fieldNames = general.getFields().map(field => field.getId());
            assert.includeMembers(fieldNames, ['field_a', 'field_c']);
            assert.notInclude(fieldNames, 'field_b');
        });

        it("rendering of `local` fields should work", function() {
            const template = new Template();
            const params = {
                general: {
                    field_a: 'A',
                    field_b: 'B',
                }
            };

            const rendered = template.render("{{#section general}} {{oh field_a}}|{{local field_b}} {{/section}}", params).trim();
            assert.equal(rendered, 'A|B');
        });
    });

    it("should be able to parse #each block", function() {
        const template = new Template();
        
        assert.doesNotThrow(() => {
            template.parse(`
                {{#each range}}
                    {{this}}
                {{/each}}
            `);
        });
    });
});
