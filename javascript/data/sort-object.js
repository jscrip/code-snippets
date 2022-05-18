/* Short and simple method for sorting Objects */
var o = {a:"Al",b:"Betty",c:"Cal"};
/* to sort by keys instead of values, change "[1]" to "[0]" */
var sortObj = obj => Object.entries(obj).sort((a, b) => a[1] < b[1]);
/* returns a nested array because order is maintained */
sortObj(o);
