var xml_digester = require("../lib/xml-digester");

var handler = new xml_digester.OrderedElementsHandler("kind");
var path = "nodes/*";

  var options = {
    "handler": [
      { "path": path, "handler": handler}
    ]
  };


var digester = xml_digester.XmlDigester(options);

var xml = "<nodes>"
            + "<crossing/>"
            + "<street/>"
            + "<cross-walk/>"
            + "<street/>"
            + "<end-of-town/>"
          + "</nodes>"

digester.digest(xml, function(err, result) {
  if (err) { 
  } else {
    console.log(result);
    // result will 
    // { nodes: 
    //   [ { kind: 'crossing' },
    //     { kind: 'street' },
    //     { kind: 'cross-walk' },
    //     { kind: 'street' },
    //     { kind: 'end-of-town' } ] }
  }
})
