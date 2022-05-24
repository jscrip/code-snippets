/*Select the form */

var form = document.querySelector('form');

/* listen for live input events on the form.
   The form is logged every time a change is made.*/

form.addEventListener('input', (e) => {
      e.preventDefault();
      /* get all form data as of input event*/
      var fData = new FormData(form);
      /* Convert form data to JSON */
      var data = [...fData.entries()].reduce((o,d) =>{
        o[d[0]] = d[1];
        return o;
      },{});
      console.log({data})
});
