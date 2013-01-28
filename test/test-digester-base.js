var xml_digester = require("../lib/xml-digester");

digester = xml_digester.XmlDigester({});

var _logger = xml_digester._logger;
// _logger.level(_logger.DEBUG_LEVEL);


function test_parse(test, xml, expected) {
  test.deepEqual(digester.digest(xml), expected, "xml: " + xml);
}

exports.testSimple = function(test) {

  test_parse(test, 
    "<root></root>", 
    { root: { } });

  test_parse(test, 
    "<root/>", 
    { root: { } });

  test_parse(test, 
    "<root>content</root>", 
    { root: 'content' });

  test_parse(test, 
    "<root><foo>content</foo></root>", 
    { root: { foo: 'content' } });

  test_parse(test,
    "<root><foo attr=\"attrvalue\">content</foo></root>", 
    { root: { foo: { attr: 'attrvalue', _text: 'content' } } });

  test_parse(test,
    "<root><foo>foo1</foo><foo>foo2</foo></root>", 
    { root: { foo: [ 'foo1', 'foo2' ] } } );

  test_parse(test,
    "<root><foo>foo1</foo><foo attr=\"attrvalue\">foo2</foo></root>", 
    { root: { foo: [ 'foo1', { attr: 'attrvalue', _text: 'foo2' } ] } } );

  test_parse(test,
    "<root foo=\"fooattr\"><foo>content</foo></root>", 
    { root: { foo: [ 'fooattr', 'content' ] } } );


  test.done();
}

exports.testInvalidXml = function(test) {
  digester.digest("<missing-closing")
  test.done();
}

