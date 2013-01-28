object_stack = [ 
  {"_name": "foo"}, 
  {"_name": "bar"} 
];


var pattern = /^(.*?)(\/*)([^\/]*)$/

var stack_element_accessor = function(stack_element) { return stack_element._name };

function _match_stack(match_expression) {
  console.log(" ");
  console.log("-----------------------------------------------------------");
  return match_stack_from_pos(match_expression,object_stack.length - 1);
}

function match_stack_from_pos(match_expression, pos) {


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
  console.log(match);
  console.log("pos: " + pos);

  var name = match[3].toString();
  var sep = match[2];
  var rest = match[1];
  if ( (name != '*') && (stack_element_accessor(object_stack[pos]) != name) ) {
    console.log("'"+stack_element_accessor(object_stack[pos]) + "' != '" + name + "' -- " + (typeof name));
    return false;
  } 

  if ( sep ) {
    sep = sep.toString();
    if ( sep == "/" ) {
      return match_stack_from_pos(rest, pos - 1);
    } else if ( sep == "//" ) {
      while ( pos >= 0 ) {
        console.log("--pos: " + (pos -1));
        if ( match_stack_from_pos(rest, pos - 1) ) {
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

function check_match(path, expected) {
  if ( match_stack(path) != expected ) {
    console.log("#############################################################")
    console.log("FAILED: " + path);
    console.log("#############################################################")
  }
}

check_match("foo", false);
check_match("/bar", false);
check_match("bar", true);
check_match("foo/bar", true);
check_match("/foo/bar", true);
check_match("foo/foo/bar", false);


check_match("//bar", true);
check_match("foo//bar", true);
check_match("/foo//bar", true);


object_stack = [ 
  {"_name": "foo"}, 
  {"_name": "foo"}, 
  {"_name": "bar"}, 
  {"_name": "bar"} 
];

check_match("foo//bar", true);
check_match("/foo//bar", true);
check_match("blah/foo//bar", false);


check_match("foo//*", true);
check_match("/foo//*", true);
check_match("blah/*", false);
check_match("foo/*/bar", true);
check_match("/foo//*/bar", true);
check_match("/foo/*//bar", true);
check_match("*//bar", true);

// console.log(match_stack("foo/bar"));
// console.log(match_stack("/foo/bar"));
// console.log(match_stack("//bar"));
