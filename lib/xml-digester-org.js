var fs = require('fs');
var util = require('util');
var sax = require('sax');

var xml = fs.readFileSync("./resources/testarr.xml");

var only_whitespace = /^\s*$/


var make_children_array = [ "/root" ];

var _logger = {
  ERROR_LEVEL: 1, WARN_LEVEL: 2, INFO_LEVEL: 3, DEBUG_LEVEL: 4, TRACE_LEVEL: 5,
  current_level: 3,

  log: function(level, message) {
    if ( this.current_level >= level ) {
      console.log(message);
    }
  },
  error: function(message) { this.log(this.ERROR_LEVEL, "ERROR: " + message); },
  warn:  function(message) { this.log(this.WARN_LEVEL,  "WARN:  " + message); },
  info:  function(message) { this.log(this.INFO_LEVEL,  "INFO:  " + message); },
  debug: function(message) { this.log(this.DEBUG_LEVEL, "DEBUG: " + message); },
  trace: function(message) { this.log(this.TRACE_LEVEL, "TRACE: " + message); },
  level: function (new_level) {
    if (new_level) {
      this.current_level = new_level;
    } else {
      return this.current_level;
    }
  }
  
};

_logger.level(_logger.DEBUG_LEVEL);

//   bar/foo
//   /bar
//   foo//bar
//   //foo//bar
function match_stack(match_expression) {
  var pos = object_stack.length - 1;
  path = match_expression.split(/\//);
  while ( path.length > 0 ) {
    current = path.pop();
    if (current) {
      if ( current != object_stack[pos]._name ) {
        return false;
      }
    } else { // search up

    }
  }
}

var document = { };
Object.defineProperty(document, "_name", {value: "document"});

var xpath_stack = [];
var object_stack = [];
current_object = document;

var current_text = "";


// stream usage
// takes the same options as the parser
var saxStream = require("sax").createStream(true);

saxStream.on("error", function (e) {
  _logger.error("error!", e)
  this._parser.error = null
  this._parser.resume()
})

function print_object_stack_simple() {
  var length = object_stack.length;
  var element = null;
  var i;
  var indent = "-> "
  for (i = 0; i < length; i++) {
    console. log(indent + object_stack[i]._name);
    indent = indent + "  ";
  }
}

saxStream.onopentag = function (node) {
  xpath_stack.push(node.name);
  var new_object = node.attributes;
  Object.defineProperty(new_object, "_name", {value: node.name});

  _logger.debug("   ");
  _logger.debug("vvvvvvv " + node.name + " vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv");
  _logger.debug(node)

  object_stack.push(current_object);
  current_object = new_object;
  print_object_stack_simple();


}

saxStream.ontext = function (t) {
  if (! only_whitespace.test(t) ) {
    current_text = t;
  } else {
    current_text = "";
  }
};

function has_properties(object) {
  var propertyName;

  for (propertyName in object) {
    if (object.hasOwnProperty(propertyName)) {
        return true;
    }
  }
  return false;
}


saxStream.on("closetag", function (node_name) {

  xpath_stack.pop();
  parent_object = object_stack.pop();

  // does the parent object already have a property with the name of the current node?
  if ( parent_object[node_name] ) {

    // if there are multiple elements with the same name the value is converted to an array
    // has this already happend? 
    if ( ! Array.isArray(parent_object[node_name]) ) {
      parent_object[node_name] = [ parent_object[node_name] ];
    }
    parent_object[node_name].push(current_object)
    _logger.info("the parent object already has a property with the name: " + node_name);

    // either: make all properties into an array, but we have already lost the order :-(
    // or: make only elements of the same name into an array: default?

    print_object_stack_simple();
  } else {

    // does the current object have any properties (i.e. has the corresponding
    // XML element any attributes or children)
    if ( has_properties(current_object) ) {
      parent_object[node_name] = current_object;
      if ( current_text ) {
        current_object._text = current_text;
      }
    } else {
      // was there any text in the node?
      if ( current_text ) {
        parent_object[node_name] = current_text;
      }
    }
  }
  current_object = parent_object;

  _logger.debug("^^^^^^^^ " + node_name + " ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

  if ( current_object === document ) {
    _logger.debug("---------------------------------------------------------------");
    _logger.debug("HERE " + util.inspect(document, false, 4));
  }

})

// pipe is supported, and it's readable/writable
// same chunks coming in also go out.
fs.createReadStream("resources/testarr.xml")
  .pipe(saxStream);

