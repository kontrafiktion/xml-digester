var xml_digester = require("../lib/xml-digester");
var match_stack = xml_digester._match_stack;

//var _logger = xml_digester._logger;
// _logger.level(_logger.DEBUG_LEVEL);

exports.testStackMatcher = function(test) {
  function check_match(object_stack, path, expected) {
    test.ok(match_stack(path, object_stack) == expected,
      "expectation: path: '" + path + "' should " + (expected ? "":"NOT ") + "match '" +
          object_stack.join("/") + "'\n");
  }

  var object_stack1 = [
    "foo",
    "bar"
  ];

  check_match(object_stack1, "foo", false);
  check_match(object_stack1, "/bar", false);
  check_match(object_stack1, "bar", true);
  check_match(object_stack1, "foo/bar", true);
  check_match(object_stack1, "/foo/bar", true);
  check_match(object_stack1, "foo/foo/bar", false);
  check_match(object_stack1, "//bar", true);
  check_match(object_stack1, "foo//bar", true);
  check_match(object_stack1, "/foo//bar", true);


  var object_stack2 = [
    "foo",
    "foo",
    "bar",
    "bar"
  ];

  check_match(object_stack2, "foo//bar", true);
  check_match(object_stack2, "/foo//bar", true);
  check_match(object_stack2, "blah/foo//bar", false);
  check_match(object_stack2, "foo//*", true);
  check_match(object_stack2, "/foo//*", true);
  check_match(object_stack2, "blah/*", false);
  check_match(object_stack2, "foo/*/bar", true);
  check_match(object_stack2, "/foo//*/bar", true);
  check_match(object_stack2, "/foo/*//bar", true);
  check_match(object_stack2, "*//bar", true);

  test.done();
};
