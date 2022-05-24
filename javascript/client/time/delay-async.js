/* Simple function that waits for a set number of milliseconds before moving on to the next step */

var delay = ms => new Promise(r => setTimeout(r, ms));

/* Example Usage */

(async function(){
  console.log("before");
  await delay(1500);
  console.log("after");
})()
