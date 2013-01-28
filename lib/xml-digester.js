// wrapper for non-node envs
;(function (xml_digester) {

  // TODO: CDATA
  // TODO: Namespace handling
  // TODO: error handling
  // TODO: handler API

  // Logger:
  // ---------------------------------------------------------------------------

  var _logger = {
    ERROR_LEVEL: 1, WARN_LEVEL: 2, INFO_LEVEL: 3, DEBUG_LEVEL: 4, TRACE_LEVEL: 5,
    current_level: 3,

    log: function(level, prefix, message) {
      if ( this.current_level >= level ) {
        console.log(prefix, message);
      }
    },
    error: function(message) { this.log(this.ERROR_LEVEL, "ERROR: ", message); },
    warn:  function(message) { this.log(this.WARN_LEVEL,  "WARN:  ", message); },
    info:  function(message) { this.log(this.INFO_LEVEL,  "INFO:  ", message); },
    debug: function(message) { this.log(this.DEBUG_LEVEL, "DEBUG: ", message); },
    trace: function(message) { this.log(this.TRACE_LEVEL, "TRACE: ", message); },
    level: function (new_level) {
      if (new_level) {
        this.current_level = new_level;
      } else {
        return this.current_level;
      }
    }
    
  };


  xml_digester.digester = function (xml, options) { return new XmLDigester(xml, options) };
  xml_digester.XmlDigester = XmlDigester;
  xml_digester._logger = _logger;
  xml_digester._match_stack=match_stack;

  // import util (if possible)
  try {
    var util = require("util")
  } catch (ex) {
    var util = { inspect: function(object) { return object.toString(); } }
  }



  // Digester:
  // ---------------------------------------------------------------------------

  function XmlDigester (opt) {
    if (!(this instanceof XmlDigester)) return new XmlDigester(opt);

    var digester = this;
    if ( opt ) {
      digester.handler = opt.handler;
    }

    digester.sax = require("sax").parser(true);



    var only_whitespace_pattern = /^\s*$/

    digester.sax.onerror = function (e) {
      _logger.error("error!" + e)
      // digester.sax.error = null
      // digester.sax.resume()
    }

    digester.sax.onopentag = function (node) {
      digester.xpath_stack.push(node.name);
      var new_object = node.attributes;
      Object.defineProperty(new_object, "_name", {value: node.name});

      _logger.debug("   ");
      _logger.debug("vvvvvvv " + node.name + " vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv");
      _logger.debug(node)

      digester.object_stack.push(digester.current_object);
      digester.current_object = new_object;
      digester._printObjectStack();

    }

    digester.sax.ontext = function (t) {
      if (! only_whitespace_pattern.test(t) ) {
        digester.current_text = t;
      } else {
        digester.current_text = "";
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


    digester.sax.onclosetag = function (node_name) {

      digester.xpath_stack.pop();
      var parent_object = digester.object_stack.pop();

      if ( digester.current_text ) {
        if ( has_properties(digester.current_object) ) {
          digester.current_object._text = digester.useText();
        } else {
          digester.current_object = digester.useText();
        }
      }

      // does the parent object already have a property with the name of the current node?
      if ( parent_object[node_name] ) {

        // if there are multiple elements with the same name the value is converted to an array
        // has this already happend? 
        if ( ! Array.isArray(parent_object[node_name]) ) {
          parent_object[node_name] = [ parent_object[node_name] ];
        }
        parent_object[node_name].push(digester.current_object)
        _logger.info("the parent object already has a property with the name: " + node_name);

        // either: make all properties into an array, but we have already lost the order :-(
        // or: make only elements of the same name into an array: default?

        digester._printObjectStack();
      } else {
       parent_object[node_name] = digester.current_object;
      }
      _logger.debug("^^^^^^^^ " + node_name + " ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

      if ( parent_object === digester.document ) {
        digester.root = digester.current_object;
        _logger.debug("---------------------------------------------------------------");
        _logger.debug("HERE " + util.inspect(digester.document, false, 4));
      }
      digester.current_object = parent_object;


    }
  } // XmlDigester

  XmlDigester.prototype.digest = function(xml) {
    this.xml = xml;
    this.object_stack = [];
    this.xpath_stack = [];

    this.document = { };
      Object.defineProperty(this.document, "_name", {value: "document"});
    this.current_object = this.document;
    this.current_text = "";
    this.sax.write(xml).close();
    return this.document;
  }

  XmlDigester.prototype._printObjectStack = function() {
    var length = this.object_stack.length;
    var element = null;
    var i;
    var indent = "-> "
    for (i = 0; i < length; i++) {
      _logger.debug(indent + this.object_stack[i]._name);
      indent = indent + "  ";
    }
  }

  XmlDigester.prototype.useText = function() {
    var result = this.current_text;
    this.current_text = "";
    return result;
  }




  // StackMatcher:
  // ---------------------------------------------------------------------------

  var pattern = /^(.*?)(\/*)([^\/]*)$/

  function match_stack(match_expression, object_stack) {
    _logger.debug(" ");
    _logger.debug("-----------------------------------------------------------");
    return match_stack_from_pos(match_expression, object_stack, object_stack.length - 1);
  }

  function match_stack_from_pos(match_expression, object_stack, pos) {

    // end of stack reached?
    if ( pos < 0 ) {
      // path not completely consumed?
      if ( match_expression ) {
        return false
      } else {
        return true;
      }
    }

    var match = pattern.exec(match_expression);
    _logger.debug(match);
    _logger.debug("pos: " + pos);

    var name = match[3].toString();
    var sep = match[2];
    var rest = match[1];
    if ( (name != '*') && (object_stack[pos] != name) ) {
      _logger.debug("'" + object_stack[pos] + "' != '" + name + "' -- " + (typeof name));
      return false;
    } 

    if ( sep ) {
      sep = sep.toString();
      if ( sep == "/" ) {
        return match_stack_from_pos(rest, object_stack, pos - 1);
      } else if ( sep == "//" ) {
        while ( pos >= 0 ) {
          _logger.debug("--pos: " + (pos -1));
          if ( match_stack_from_pos(rest, object_stack, pos - 1) ) {
            return true;
          } else {
            pos--;
          }
        }
        if ( pos < 0 ) {
          return false;
        }
      }
    }


    return true;
  }

  // StackMatcher end


  // if (!Object.create) Object.create = function (o) {
  //   function f () { this.__proto__ = o }
  //   f.prototype = o
  //   return new f
  // }

  // if (!Object.getPrototypeOf) Object.getPrototypeOf = function (o) {
  //   return o.__proto__
  // }

  // if (!Object.keys) Object.keys = function (o) {
  //   var a = []
  //   for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
  //   return a
  // }

})(typeof exports === "undefined" ? sax = {} : exports)

