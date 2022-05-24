/*
  Make almost any webpage editable. It's temporary, of course.
  This script simply injects an attribute into most HTML elements, allowing them to be edited by clicking on them.
  Click handlers are disabled so links won't cause a new page load.
  Really helpful for copying snippets of information from the web or working on updating website copy. 
  You can see how new content will fit on the page, live in the browser, rather than editing a file or logging into a CMS.
  Again, the changes aren't saved on the server, but you can edit a page and download the HTML source code to keep a static version locally
  or to upload it later on.
  
*/
[...document.querySelectorAll("body *:not(img)")].forEach(el => {
  el.innerText && el.innerText.replace(/[\s\r\t]+/gim,"").length > 0 ? el.contentEditable = 'true' : null
})
document.addEventListener("click",handler,true);
function handler(e){
    e.stopPropagation();
    e.preventDefault();
}
