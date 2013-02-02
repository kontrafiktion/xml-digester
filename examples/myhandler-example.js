var xml_digester = require("../lib/xml-digester");
var util = require("util");

function MyHandler() {
  this.defaultHandler = new xml_digester.DefaultHandler();
}

MyHandler.prototype.onopentag = function(node, digester) {
  this.defaultHandler.onopentag(node, digester);
}

MyHandler.prototype.onclosetag = function(node_name, digester) {
  var parent_object = digester.object_stack.pop();

  this.defaultHandler.textifyCurrentObject(digester);

  parent_object[digester.current_object.name] = digester.current_object.content;

  digester.current_object = parent_object;

}

var options = {
"handler": [
  { "path": "bar", "handler": new MyHandler()}
]
};


var digester = xml_digester.XmlDigester(options);

var xml = "<root>"
      + "  <bar name=\"bar1\"><content>some_text</content></bar>"
      + "  <bar name=\"bar2\"><content>some_other_text</content></bar>"
      + "</root>"

digester.digest(xml, function(err, result) {
  if (err) { 
  } else {
    console.log(util.inspect(result, false, 3));
  }
})
