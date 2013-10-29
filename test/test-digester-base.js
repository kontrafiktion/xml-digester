var xml_digester = require("../lib/xml-digester");

var digester = xml_digester.XmlDigester({});

//var _logger = xml_digester._logger;
// _logger.level(_logger.TRACE_LEVEL);

function test_parse(test, xml, expected) {
  digester.digest(xml, function(err, result) {
    test.ifError(err);
    test.deepEqual(result, expected, "xml: " + xml);
  });
}

exports.testSimple = function(test) {

  test_parse(test,
    "<root></root>",
    { root: { } });

  test_parse(test,
    "<root/>",
    { root: { } });

  test_parse(test,
    "<root id=\"13\"></root>",
    { root: { id: 13 } });

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
    { root: { foo: [ 'foo1', 'foo2' ] } });

  test_parse(test,
    "<root><foo>foo1</foo><foo attr=\"attrvalue\">foo2</foo></root>",
    { root: { foo: [ 'foo1', { attr: 'attrvalue', _text: 'foo2' } ] } });

  test_parse(test,
    "<root foo=\"fooattr\"><foo>content</foo></root>",
    { root: { foo: [ 'fooattr', 'content' ] } });


  test.done();
};

/*
function test_error(test, xml) {
  digester.digest(xml, function(err, result) {
    test.ok(err === undefined, "error expected: Xml is not correct: \"" + xml + "\"");
  });
}
*/

// exports.testInvalidXml = function(test) {
//   test_error(test, "<missing-closing");
//   test_error(test, "<missing-closing><foo/></missing-closin>");
//   test_error(test, "missing-closing");
//   test_error(test, "");
//   test.done();
// }

exports.testSkipHandler = function(test) {
  var options = {
    "handler": [
      { "path": "foo", "handler": new xml_digester.SkipElementsHandler()}
    ],
    "sax_opts": {}
  };

  var digester = new xml_digester.XmlDigester(options);

  digester.digest("<root><foo></foo><bar><foo/></bar></root>", function(err, result) {
    test.ifError(err);
    test.deepEqual(result, { root: { bar: {} } }, "xml: " + "<root><foo>/foo><bar><foo/></bar></root>");
    test.done();
  });
};

function test_handler(test, xml, path, handler, expected) {
  var options = {
    "handler": [
      { "path": path, "handler": handler}
    ],
    "sax_opts": {}
  };
  var digester = new xml_digester.XmlDigester(options);
  digester.digest(xml, function(err, result) {
    if (! expected) {
      test.ok(err, "error expected");
    } else {
      test.ifError(err);
      test.deepEqual(result, expected, "xml: " + xml);
    }
  });
}

exports.testSimpleOrderedElementsHandler = function(test) {

  var xml = "<root><books>" +
    "<book><author>Philipp Pullmann</author><title>The Golden Compass</title></book>" +
    "<book><author>Jonathan Carroll</author><title>Land of Laughs</title></book>" +
    "</books></root>";

  test_handler(test,
                xml,
                "books/book",
                new xml_digester.OrderedElementsHandler(),
                { root:
                  { books:
                    [ { author: 'Philipp Pullmann', title: 'The Golden Compass' },
                      { author: 'Jonathan Carroll', title: 'Land of Laughs' } ] } });

  test_handler(test,
                xml,
                "books/*",
                new xml_digester.OrderedElementsHandler(),
                { root:
                  { books:
                    [ { author: 'Philipp Pullmann', title: 'The Golden Compass' },
                      { author: 'Jonathan Carroll', title: 'Land of Laughs' } ] } });

  test_handler(test,
                xml,
                "book",
                new xml_digester.OrderedElementsHandler(),
                { root:
                  { books:
                    [ { author: 'Philipp Pullmann', title: 'The Golden Compass' },
                      { author: 'Jonathan Carroll', title: 'Land of Laughs' } ] } });
  test.done();
};

exports.testDifferingOrderedElements = function(test) {
  var xml = "<root><path>" +
    "<Betriebsstellengrenzknoten id=\"1452\"/>" +
    "<Weiche id=\"1557\"></Weiche>" +
    "</path></root>";

  test_handler(test,
                xml,
                "path/*",
                new xml_digester.OrderedElementsHandler("name"),
                 { root:
                   { path:
                      [ { id: '1452', name: 'Betriebsstellengrenzknoten' },
                        { id: '1557', name: 'Weiche' } ] } });


  xml = "<root><path>" +
    "<Betriebsstellengrenzknoten></Betriebsstellengrenzknoten>" +
    "<Weiche>content</Weiche>" +
    "</path></root>";

  test_handler(test,
                xml,
                "path/*",
                new xml_digester.OrderedElementsHandler("name"),
                 { root:
                   { path:
                      [ { name: 'Betriebsstellengrenzknoten' },
                        { name: 'Weiche', _text: 'content' } ] } });



  xml = "<root><path order-number=\"1\">" +
    "<Betriebsstellengrenzknoten></Betriebsstellengrenzknoten>" +
    "<Weiche>content</Weiche>" +
    "</path></root>";

  test_handler(test,
                xml,
                "path/*",
                new xml_digester.OrderedElementsHandler("name"),
                undefined);
  test.done();
};
