/*
  *Important:
  This example runs immediately on injection and attempts to load d3.js from an external resource. 
  Some websites and/or browsers may prevent you from loading external code from another domain for security reasons.
  
  *How to use your own data:
  Replace options.data with an array of objects.
  
*/

(() => {
  var options = {
    scripts: ["https://d3js.org/d3.v6.min.js"],
    data:[{x:'1', y:'2'},{x:'4', y:'5'}]
  }
  const downloadCSV = (data, fileName) => {
		var d = document;
    var a = d.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([d3.csvFormat(data)],{type:'text/csv;charset=utf-8;'}));
    a.setAttribute('download', `${fileName}.csv`);
    d.body.appendChild(a);
    a.click();
    d.body.removeChild(a);
  };
	var run = () => {
    downloadCSV(options.data, "demo")
  }
  const loadScripts = ({scripts}) => {
    console.log(`Loading External Scripts`);
    var scriptCountdown = scripts.length;
    var loadScript = (url) => {
      var scriptsLoaded = () => scriptCountdown == 0 ? run() : null;
      var imported = document.createElement('script');
      imported.src = url;
      imported.addEventListener("load", () => {
        scriptCountdown--;
        scriptsLoaded();
      });
      document.head.appendChild(imported);
    }
    scripts.forEach(loadScript)
  }
  loadScripts(options);
})();
