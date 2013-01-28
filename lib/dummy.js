var util = require('util');
var arr = [ "foo", "bar" ];

console.log("ERROR: ", arr);
console.log("ERROR: " + util.inspect(arr));
