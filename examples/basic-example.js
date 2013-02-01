var xml_digester = require("../lib/xml-digester");
var digester = xml_digester.XmlDigester({});

var xml = "<root>"
  + "<foo>foo1</foo>"
  + "<bar>bar1></bar>"
  + "<foo>foo2</foo>"
  + "</root>"

digester.digest(xml, function(err, result) {
  if (err) { 
  } else {
    console.log(result);
    // result will be { root: { foo: [ 'foo1', 'foo2' ], bar: 'bar1>' } }
  }
})
