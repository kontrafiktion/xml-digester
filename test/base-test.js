
var util = require('util');
var sax = require('sax');
var xml_digester = require('../lib/xml-digester');



var xml = '<root>\n' +
    '<foo name="foo1"><content>FOO1</content></foo>\n' +
    '<bar name="bar1"><content>BAR1</content></bar>\n' +
    '<foo name="foo2"><content>FOO2</content></foo>\n' +
    '<foo name="foo3"/>\n' +
    '</root>';

var foo_handler = {
  "opentag": function(object_stack, current_object, node) {

  },
  "closetag": function(object_stack, current_object, node_name) {

  },
  "text": function(object_stack, current_object, text) {

  }
}

var options = {
  "handler": [
    { "path": "/foo", "handler": foo_handler}
  ],
  "sax_opts": {}
};

// xml_digester.digest(xml, options);

console.log(util.inspect(xml_digester, false, 2));
// console.log(util.inspect(xml., false, 2));
// console.log(util.inspect(sax, false, 2));