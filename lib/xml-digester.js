var sax;

// wrapper for non-node envs
(function(xml_digester) {
  // TODO: CDATA
  // TODO: Namespace handling
  // TODO: error handling

  // Logger:
  // ---------------------------------------------------------------------------

  var _logger = {
    ERROR_LEVEL: 1,
    WARN_LEVEL: 2,
    INFO_LEVEL: 3,
    DEBUG_LEVEL: 4,
    TRACE_LEVEL: 5,
    current_level: 3,

    log: function(level, prefix, message) {
      if (this.current_level >= level) {
        console.log(prefix, message);
      }
    },
    error: function(message) { this.log(this.ERROR_LEVEL, "ERROR: ", message); },
    warn:  function(message) { this.log(this.WARN_LEVEL,  "WARN:  ", message); },
    info:  function(message) { this.log(this.INFO_LEVEL,  "INFO:  ", message); },
    debug: function(message) { this.log(this.DEBUG_LEVEL, "DEBUG: ", message); },
    trace: function(message) { this.log(this.TRACE_LEVEL, "TRACE: ", message); },
    level: function(new_level) {
      if (new_level) {
        this.current_level = new_level;
      } else {
        return this.current_level;
      }
    },
    isEnabled: function(level) { return this.current_level >= level; }
  };

  // Digester:
  // ---------------------------------------------------------------------------

  function XmlDigester(opt) {
    if (!(this instanceof XmlDigester)) return new XmlDigester(opt);

    var digester = this;
    if (opt) {
      digester.handler = opt.handler;
    }

    digester.sax = require("sax").parser(true);

    digester.defaultHandler = new DefaultHandler();

    var only_whitespace_pattern = /^\s*$/;

    digester.sax.onerror = function(e) {
      _logger.error("error!" + e);
      _logger.error(e.stack);
      this.error = this.error + e + "\n";
    };

    digester.sax.onopentag = function(node) {
      digester.xpath_stack.push(node.name);

      var handled = false;
      if (digester.handler) {
        digester.handler.forEach(function(elem) {
          _logger.trace(" --- checking: " + elem.path);
          // TODO: break
          if (! handled && match_stack(elem.path, digester.xpath_stack)) {
            _logger.trace("--- using: " + elem.handler);
            handled = true;
            elem.handler.onopentag(node, digester);
          }
        });
      }
      if (! handled) {
        digester.defaultHandler.onopentag(node, digester);
      }

      _logger.trace("   ");
      _logger.trace("<" + digester.xpath_stack.join('><') + '>');
      _logger.trace(node);

      if (_logger.isEnabled(_logger.DEBUG_LEVEL)) { digester._printObjectStack(); }
    };

    digester.sax.ontext = function(t) {
      if (! only_whitespace_pattern.test(t)) {
        digester.current_text = t;
      } else {
        digester.current_text = "";
      }
    };

    digester.sax.onclosetag = function(node_name) {
      var handled = false;
      if (digester.handler) {
        digester.handler.forEach(function(elem) {
          // TODO: break
          if (! handled && match_stack(elem.path, digester.xpath_stack)) {
            handled = true;
            elem.handler.onclosetag(node_name, digester);
          }
        });
      }
      if (! handled) {
        digester.defaultHandler.onclosetag(node_name, digester);
      }

      if (digester.xpath_stack.length == 1) {
        _logger.trace("</" + digester.xpath_stack[0] + ">");
      } else {
        _logger.trace("<" + digester.xpath_stack.join('></') + ">");
      }

      digester.xpath_stack.pop();
    };
  } // XmlDigester


  // helper functions
  // ---------------------------------------------------------------------------
  function has_properties(object) {
    var propertyName;

    for (propertyName in object) {
      if (object.hasOwnProperty(propertyName)) {
        return true;
      }
    }
    return false;
  }

  // import util (if possible)
  var util;
  try {
    util = require("util");
  } catch (ex) {
    util = { inspect: function(object) { return object.toString(); } };
  }

  // handler for XML element that should be skipped
  // ---------------------------------------------------------------------------

  function SkipElementsHandler() {
    if (!(this instanceof SkipElementsHandler)) return new SkipElementsHandler();
    this.defaultHandler = new DefaultHandler();
  }

  SkipElementsHandler.prototype.onopentag = function(node, digester) {
    this.defaultHandler.onopentag(node, digester);
  };

  SkipElementsHandler.prototype.onclosetag = function(node_name, digester) {
    var parent_object = digester.object_stack.pop();
    digester.current_object = parent_object;
  };

  // handler for XML element, where the order of elements must be preserved
  // ---------------------------------------------------------------------------
  function OrderedElementsHandler(name_property) {
    if (!(this instanceof OrderedElementsHandler)) return new OrderedElementsHandler(name_property);

    this.name_property = name_property;

    this.defaultHandler = new DefaultHandler();
  }

  OrderedElementsHandler.prototype.onopentag = function(node, digester) {
    var parent_object = digester.current_object;

    var new_object = node.attributes;
    if (this.name_property) {
      new_object[this.name_property] = node.name;
    } else {
      Object.defineProperty(new_object, "_name", {value: node.name});
    }

    if (! Array.isArray(parent_object)) {
      if (has_properties(parent_object)) {
        _logger.warn(util.inspect(node, false, 1));
        console.log("<" + digester.xpath_stack.join('><') + ">");
        console.log(new Error().stack);
        throw "Ordered Element Container must not have attributes: " + util.inspect(parent_object, true, 1);
      }

      parent_object = [];
    }
    digester.object_stack.push(parent_object);

    digester.current_object = new_object;
  };

  OrderedElementsHandler.prototype.onclosetag = function(node_name, digester) {
    var parent_object = digester.object_stack.pop();

    if (! Array.isArray(parent_object)) {
      throw "internal error: object should be Array: (" + node_name + ") " + util.inspect(parent_object, true, 1);
    }

    this.defaultHandler.textifyCurrentObject(digester);

    parent_object.push(digester.current_object);

    digester.current_object = parent_object;
  };

  // default handler for an XML element
  // ---------------------------------------------------------------------------
  function DefaultHandler() {
    if (!(this instanceof DefaultHandler)) return new DefaultHandler();
  }

  DefaultHandler.prototype.onopentag = function(node, digester) {
    var new_object = node.attributes;
    Object.defineProperty(new_object, "_name", {value: node.name});
    digester.object_stack.push(digester.current_object);
    digester.current_object = new_object;
  };

  // If the current_object only has text content (no attributes, no child 
  // elements), than just use the text as the current_object
  DefaultHandler.prototype.textifyCurrentObject = function(digester) {
    if (digester.current_text) {
      if (has_properties(digester.current_object)) {
        digester.current_object._text = digester.useText();
      } else {
        digester.current_object = digester.useText();
      }
    }
  };

  DefaultHandler.prototype.onclosetag = function(node_name, digester) {
    var parent_object = digester.object_stack.pop();

    // the text of a node has been collected previously
    // if the current object has no properties (i.e. the XML element had 
    // no children nor attributes) replace the current _object_ with the text
    // otherwise add the text as "_text"
    this.textifyCurrentObject(digester);

    // does the parent object already have a property with the name of the current node?
    // i.e. there are multiple child elements with the same name
    if (parent_object[node_name]) {
      // if there are multiple elements with the same name the value is converted to an array

      // has this already happend? 
      if (! Array.isArray(parent_object[node_name])) {
        parent_object[node_name] = [ parent_object[node_name] ];
      }

      parent_object[node_name].push(digester.current_object);
      _logger.info("the parent object already has a property with the name: " + node_name);

      // either: make all properties into an array, but we have already lost the order :-(
      // or: make only elements of the same name into an array: default?

      if (_logger.isEnabled(_logger.DEBUG_LEVEL)) { digester._printObjectStack(); }
    } else {
      parent_object[node_name] = digester.current_object;
    }

    digester.current_object = parent_object;
  };


  XmlDigester.prototype.digest = function(xml, func) {
    this.xml = xml;
    this.object_stack = [];
    this.xpath_stack = [];
    this.error = "";
    this.document = { };
    Object.defineProperty(this.document, "_name", {value: "document"});
    this.current_object = this.document;
    this.current_text = "";

    try {
      this.sax.write(xml).close();
    } catch (err)  {
      this.error = err;
      console.log(err.stack);
    }

    if (this.error) {
      if (func) {
        func(this.error, null);
      } else {
        return undefined;
      }
    } else {
      if (func) {
        func(null, this.document);
      } else {
        return this.document;
      }
    }
  };
  
  XmlDigester.prototype._printObjectStack = function() {
    var length = this.object_stack.length;
    var i;
    var indent = "-> ";
    for (i = 0; i < length; i++) {
      if (Array.isArray(this.object_stack[i])) {
        if (this.object_stack[i][0]) {
          _logger.debug(indent + "[" + util.inspect(this.object_stack[i][0]) + ", ...]");
        } else {
          _logger.debug(indent + "[ ]");
        }
      } else {
        _logger.debug(indent + this.object_stack[i]._name);
      }
      indent = indent + "  ";
    }
  };

  XmlDigester.prototype.useText = function() {
    var result = this.current_text;
    this.current_text = "";
    return result;
  };


  // StackMatcher:
  // ---------------------------------------------------------------------------

  var pattern = /^(.*?)(\/*)([^\/]*)$/;

  function match_stack(match_expression, stack) {
    _logger.trace(" ");
    _logger.trace("-----------------------------------------------------------");
    return match_stack_from_pos(match_expression, stack, stack.length - 1);
  }

  function match_stack_from_pos(match_expression, stack, pos) {
    // end of stack reached?
    if (pos < 0) {
      // path not completely consumed?
      if (match_expression) {
        return false;
      } else {
        return true;
      }
    }

    var match = pattern.exec(match_expression);
    _logger.trace(match);
    _logger.trace("pos: " + pos);

    var name = match[3].toString();
    var sep = match[2];
    var rest = match[1];
    if ((name != '*') && (stack[pos] != name)) {
      _logger.trace("'" + stack[pos] + "' != '" + name + "' -- " + (typeof name));
      return false;
    }

    if (sep) {
      sep = sep.toString();
      if (sep == "/") {
        return match_stack_from_pos(rest, stack, pos - 1);
      } else if (sep == "//") {
        while (pos >= 0) {
          _logger.trace("--pos: " + (pos -1));
          if (match_stack_from_pos(rest, stack, pos - 1)) {
            return true;
          } else {
            pos--;
          }
        }
        if (pos < 0) {
          return false;
        }
      }
    }

    return true;
  }

  // StackMatcher end

  xml_digester.digester = function(xml, options) { return new XmlDigester(xml, options); };
  xml_digester.XmlDigester = XmlDigester;
  xml_digester.DefaultHandler = DefaultHandler;
  xml_digester.OrderedElementsHandler = OrderedElementsHandler;
  xml_digester.SkipElementsHandler = SkipElementsHandler;
  xml_digester._logger = _logger;
  xml_digester._match_stack = match_stack;

})(typeof exports === "undefined" ? sax = {} : exports);
