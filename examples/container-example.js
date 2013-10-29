var xml_digester = require("../lib/xml-digester");
var util = require("util");

var handler = new xml_digester.OrderedElementsHandler("kind");
var path = "nodes/*";

  var options = {
    "handler": [
      { "path": path, "handler": handler}
    ]
  };


var digester = xml_digester.XmlDigester();

var xml = "<nodes>"
       + "<node kind=\"crossing\"/>"
       + "<node kind=\"street\"/>"
       + "<node kind=\"cross-walk\"/>"
       + "<node kind=\"street\"/>"
       + "<node kind=\"end-of-town\"/>"
    + "</nodes>";


digester.digest(xml, function(err, result) {
  if (err) { 
  } else {
    console.log(util.inspect(result, false, 3));
    // result will 
    // { nodes: 
    //   [ { kind: 'crossing' },
    //     { kind: 'street' },
    //     { kind: 'cross-walk' },
    //     { kind: 'street' },
    //     { kind: 'end-of-town' } ] }
  }
})
