var xml_digester = require("../lib/xml-digester");

digester = xml_digester.XmlDigester({});

var _logger = xml_digester._logger;
_logger.level(_logger.TRACE_LEVEL);


function test_parse(test, xml, expected) {
  digester.digest(xml, function(err, result) {
    test.ifError(err);
    test.deepEqual(result, expected, "xml: " + xml);
  })
}

exports.testSimple = function(test) {

//   test_parse(test, 
//     "<root></root>", 
//     { root: { } });

  // test_parse(test, 
  //   "<root/>", 
  //   { root: { } });

//   test_parse(test, 
//     "<root>content</root>", 
//     { root: 'content' });

//   test_parse(test, 
//     "<root><foo>content</foo></root>", 
//     { root: { foo: 'content' } });

//   test_parse(test,
//     "<root><foo attr=\"attrvalue\">content</foo></root>", 
//     { root: { foo: { attr: 'attrvalue', _text: 'content' } } });

//   test_parse(test,
//     "<root><foo>foo1</foo><foo>foo2</foo></root>", 
//     { root: { foo: [ 'foo1', 'foo2' ] } } );

//   test_parse(test,
//     "<root><foo>foo1</foo><foo attr=\"attrvalue\">foo2</foo></root>", 
//     { root: { foo: [ 'foo1', { attr: 'attrvalue', _text: 'foo2' } ] } } );

//   test_parse(test,
//     "<root foo=\"fooattr\"><foo>content</foo></root>", 
//     { root: { foo: [ 'fooattr', 'content' ] } } );


   test.done();
}

function test_error(test, xml) {
  digester.digest(xml, function (err, result) {
    test.ok(err == undefined, "error expected: Xml is not correct: \"" + xml + "\"");
  })
}

// exports.testInvalidXml = function(test) {
//   test_error(test, "<missing-closing");
//   test_error(test, "<missing-closing><foo/></missing-closin>");
//   test_error(test, "missing-closing");
//   test_error(test, "");
//   test.done();
// }

exports.testHandler = function(test) {

  var options = {
    "handler": [
      { "path": "foo", "handler": xml_digester.SkipElementsHandler}
    ],
    "sax_opts": {}
  };

  var digester = new xml_digester.XmlDigester(options);

  digester.digest("<root><foo></foo><bar><foo/></bar></root>", function(err, result) {
    test.ifError(err);
    test.deepEqual(result, { root: { bar: {} } }, "xml: " + "<root><foo>/foo><bar><foo/></bar></root>");
    console.log(result);
  });

  test.done();
}

