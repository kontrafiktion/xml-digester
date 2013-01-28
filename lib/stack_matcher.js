

var pattern = /^(.*?)(\/*)([^\/]*)$/

function match_stack(match_expression, object_stack) {
  console.log(" ");
  console.log("-----------------------------------------------------------");
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
  console.log(match);
  console.log("pos: " + pos);

  var name = match[3].toString();
  var sep = match[2];
  var rest = match[1];
  if ( (name != '*') && (object_stack[pos] != name) ) {
    console.log("'" + object_stack[pos] + "' != '" + name + "' -- " + (typeof name));
    return false;
  } 

  if ( sep ) {
    sep = sep.toString();
    if ( sep == "/" ) {
      return match_stack_from_pos(rest, object_stack, pos - 1);
    } else if ( sep == "//" ) {
      while ( pos >= 0 ) {
        console.log("--pos: " + (pos -1));
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
