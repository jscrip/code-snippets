var collection = [];
(() => {
  //application settings, such as dependencies, limits, and collected data
  var options = {
    scripts: ["https://d3js.org/d3.v6.min.js"],
    data: collection,
    maxPages: 5,
    pagesCrawled: 0
  };
  //A wrapper function that makes it easy to download JSON files as CSV, all from the client-side
  const downloadCSV = (data, fileName) => {
    var d = document;
    var a = d.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([d3.csvFormat(data)], {type: 'text/csv;charset=utf-8;'}));
    a.setAttribute('download', `${fileName}.csv`);
    d.body.appendChild(a);
    a.click();
    d.body.removeChild(a);
  };
  const delay = ms => new Promise(r => setTimeout(r, ms));
  //getDoc will fetch, parse, and return an HTML document without altering the page where the code is running
  const getDoc = async (url) => {
    try {
      let res = await fetch(url);
      let htmlSource = await res.text();
      let parser = new DOMParser();
      return await parser.parseFromString(htmlSource, "text/html");
    } catch (e) {
      return {error: e}
    }
  };
  const processDoc = async (doc) => {
    //getProductData() is the first stage in converting the HTML into JSON.
    //All elements within the product listing container are selected, then filters are used to narrow down the number of elements used in the next step.
    const getProductData = (item) => {
      /* this script was part of the discovery process.
			The purpose was to review all descendants to find which elements contained product information
			*/
      //get all elements within product listing, then filter them to reduce the number of useless results.
      return [...item.querySelectorAll("*")].reduce((results, el) => {
        //add elements that meet criteria
        var addEl = (el) => {
          var dataSet = Object.entries(el.dataset);
          dataSet = dataSet.length
            ? dataSet
            : [];
          var lineCount = el.innerText.match(/\n/gim);
          lineCount = lineCount
            ? lineCount.length
            : 0;
          if (lineCount > 4) {
            skipEl(el);
          } else {
            results.data.push({
              dataSet,
              lineCount,
              nodeName: el.nodeName,
              id: el.id || "",
              classList: [...el.classList].join(","),
              text: el.innerText.trim(),
              el
            });
          }
        }
        //do not add elements that don't meet criteria
        var skipEl = (el) => {
          results.skipped.push(el);
        }
        //if the element contains text, is an image, or has data attributes, then keep it, otherwise skip it(el.innerText && el.innerText.trim().length) || el.nodeName == "IMG" || Object.keys(el.dataset).length
          ? addEl(el)
          : skipEl(el);
        return results;
      }, {
        skipped: [],
        data: []
      });
    };
    const getOffers = async (id) => {
      try {
        var doc = getDoc(`https://www.amazon.com/gp/product/ajax/ref=auto_load_aod?asin=${id}&experienceId=aodAjaxMain`);
        var prices = [...doc.querySelectorAll(`.a-price .a-offscreen`)].map(d => + d.innerText.replace(/[/$,]/gim, ""));
        price = prices.length
          ? Math.round(prices.reduce((s, n) => s += n, 0) / price.length)
          : false;
        price = price && price.innerText.length
          ? + price.innerText.replace(/[\$,]/gim, "")
          : false;
        price = isNaN(price) || price < 1
          ? false
          : price;
        return {price};
      } catch (e) {
        return false;
      }
    };
    //getProductPage can do more than price, but for now, I'm just access product pages when a price can't be found in the search results
    const getProductPage = async (url) => {
      const getPriceFromProdPage = (doc) => {
        var price = doc.querySelector(`[class*="a-price"] .a-offscreen`);
        price = price && price.innerText.length
          ? + price.innerText.replace(/[\$,]/gim, "")
          : false;
        price = isNaN(price) || price < 1
          ? false
          : price;
        return price;
      };
      try {
        var doc = await getDoc(url);
        var price = getPriceFromProdPage(doc);
        //add more properties from the product page here...
        return {price};
      } catch (e) {
        console.log({"getProductPage Error": e})
        return false;
      }
    };
    /*findBy() is a lazy attempt at refactoring a bad process. The "data" variable is an array of HTML elements that are descendants of the product container
			"key" = the property name that will be searched. "value" = search value, "propKey" is usually "text" but can sometimes target other element attributes, such as href for anchor tags, aria labels, and dataset key/value pairs
			when "el." is in the first part of the propKey, then a special condition is raised to acccess an attribute such as "el.href" or "el.src".
		*/
    const findBy = (data, key, value, propKey) => propKey
      ? propKey.indexOf("el.") == 0
        ? data.find(d => d[key] == value).el[propKey.split(".")[1]]
        : propKey.length
          ? data.find(d => d[key] == value)[propKey]
          : data.find(d => d[key] == value)
      : data.find(d => d[key] == value);
    /*
			Currently scraping the following properties:
				asin, title, price, rating, reviewCount
		*/
    const scrapeProduct = (item) => {
      /* add a timestamp to the data as it is collected so we can compare changes over time */
      let lastUpdate = new Date().toISOString();
      /*getRating() gets the average product rating from the SERP.
			finds the element containing the text "out of", intended to match cases like: "4.5 out of 5 stars")
			There is likely a better method, but this works for now*/
      const getRating = (data) => {
        var rating = data.find(d => d.text.length < 20 && d.text.indexOf("out of") > -1);
        rating = rating
          ? rating.text.split(" out of")[0].trim()
          : false;
        return rating
          ? + rating
          : false;
      };
      /*The product price is more complicated to scrape than other details.
				Prices can be in 3 places:
					1) The SERPs
					2) the product page
					3) (Least often) by clicking on "offers" while on the product page.
				Typically, the act of clicking on offers will overlay the prices on the product page.
				Using the network request tab, I found the url that requests the offer overlay and
				now have a template for requesting offers for any product, given the asin
			*/
      const getPrice = (data) => {
        var price = data.find(d => d.classList == "a-offscreen");
        price = price
          ? price.text.replace(/[\$,]/gim, "")
          : false;
        price = price
          ? + price
          : false;
        if (!price) {
          //"Couldn't find pricing, checking product page... this could be expanded to capture more info from the product page, but as it stands, product pages are only scraped when a price could not be found in SERPs"
          var productPageData = getProductPage(`https://www.amazon.com/dp/${id}`);
          price = productPageData.price;
        }
        if (!price) {
          /*"Still no price, so we're going deeper by checking offers.
						 Requesting the offers view in ajax mode, which is usually triggered via click,
						 but we are accessing it via fetch"
					*/
          var offerPageData = getOffers(id);
          price = offerPageData.price;
        }
        //if we made it to this point without a price, the product is likely unavailable or amazon changed something that broke my collection method
        return price;
      };
      /* find the link with "#customerReviews" hashtag to get the total review count */
      const getReviewCount = (data) => {
        var reviews = data.find(d => d.nodeName == "A" && d.el.href && d.el.href.indexOf("#customerReviews") > -1);
        reviews = reviews
          ? reviews.text.replace(/[\D]/gim, "")
          : false;
        return reviews
          ? + reviews
          : 0;
      };
      /*
			 This filter is probably no longer necessary, but this is leftover from combing through all the elements for each product listing.
			 The idea is to eliminate some of the "noise" by filtering on properties that I know I'm not looking for.
			 In this case, I was bombarded by elements containing the phrase, "Best Seller",
			 so I filtered out those elements so I could review a shorter list
			*/
      options.exactMatchStop = ["Best Seller"];
      options.subStringMatchStop = ["Bob Dole's Best Bargains"];
      /* && options.subStringMatchStop.some(t => el.text.indexOf(t) == -1) */
      const removeUselessElements = el => options.exactMatchStop.some(t => el.text != t);
      /* parseItemData() converts product data from HTML to JSON format */
      const parseItemData = (id, data) => {
        console.log({
          parseItemData: {
            id,
            data
          }
        });
        try {
          return {
            asin: id,
            title: findBy(data, "nodeName", "H2", "text"),
            price: getPrice(data),
            img: findBy(data, "nodeName", "IMG", "el.src"),
            url: findBy(data, "nodeName", "A", "el.href"),
            rating: getRating(data),
            reviewCount: getReviewCount(data),
            lastUpdate
          }
        } catch (e) {
          return false;
        };
      };
      //processProduct() converts the data from HTML to JSON
      const processProduct = item => {
        try {
          //asin = amazon's product id
          //get asin from the dataset attributes on the product element
          var id = item.dataset.asin;
          //if the asin is not already known, then get it
          if (!collection.find(c => c.asin == id)) {
            //get all HTML elements related to the product and apply a pre-filter
            var results = getProductData(item);
            console.log({results})
            //filter the list again with (options.exactMatchStop & options.subStringMatchStop)
            var itemData = results.data.filter(removeUselessElements);
            console.log({itemData})
            //convert the HTML to JSON format
            return parseItemData(id, itemData);
          }
          //if the asin already exists, then skip it
          console.log("Duplicate: Skipping " + id);
          return false;
        } catch (e) {
          console.log({e});
          return false;
        }
      }
      var processProductData = processProduct(item);
      console.log({processProductData});
      return processProductData;
    };
    //Get the list of products from the product search results page, and add product data to the collection
    const getProducts = async (doc) => {
      try {
        //select the elements that contain the product information, excluding ads
        var products = doc.querySelectorAll(`.sg-row [class*="s-asin"]:not(.AdHolder)`);
        for await(let productHTML of products) {
          console.log({productHTML})
          //iterate over each product listing in the SERP
          var productInfo = scrapeProduct(productHTML);
          //if productInfo contains results, then add to the report that will be downloaded at the end
          productInfo
            ? collection.push(productInfo)
            : console.log({productInfo});
        }
      } catch (e) {
        console.log({e})
      };
    };
    await getProducts(doc);
  };
  const download = () => downloadCSV(options.data, "demo");
  const getPage = async (url) => {
    //finds the next page to crawl, then calls getPage() recursively
    const nextPage = async (doc) => {
      try {
        var nextUrl = doc.querySelector(`[class*="s-pagination-next"]`).href;
        var delayMS = 250 * (Math.random() * (50 * Math.random()));
        await delay(delayMS);
        await getPage(nextUrl);
      } catch (e) {
        download()
      };
    };
    try {
      //if crawl limit is reached, download the product report and break the recursion
      if (options.pagesCrawled >= options.maxPages) {
        download();
        return "max reached";
      }
      //otherwise, fetch the doc...
      var doc = await getDoc(url);
      try {
        //and extract the product information.
        await processDoc(doc);
      } catch (e) {
        //catch the errors silently for processDoc to keep the crawler from stopping due to errors
        //Error handling can be improved all around, but just making note of try/catch usage
      };
      //keep count of pagesCrawled, even failed attempts.
      options.pagesCrawled++;
      //find the next page, then rinse and repeat
      nextPage(doc);
    } catch (e) {
      //if nextPage or any process within getPage() fails,
      //then we likely ran out of pages to scrape, so download the product data
      download();
    };
  };
  //Crawler starts at run() by scraping the first page of search results,
  //then it fetches additional pages until it runs out or hits the threshold for page requests.
  const run = async () => {
    try {
      //start the crawler by processing the current page, which should be the first page of product search results.
      await processDoc(document);
    } catch (e) {
      console.log({e})
    }
    var url = document.querySelector(`[class*="s-pagination-next"]`).href;
    getPage(url);
  };
  /* external library injection
		 Note: may require modifying the browsers security settings to work.
		 For this script, I'm using D3.js to convert JSON to CSV.
	*/
  const loadScripts = ({scripts}) => {
    console.log(`Loading External Scripts`);
    var scriptCountdown = scripts.length;
    var loadScript = (url) => {
      var scriptsLoaded = () => scriptCountdown == 0
        ? run()
        : null;
      var imported = document.createElement('script');
      imported.src = url;
      imported.addEventListener("load", () => {
        scriptCountdown--;
        scriptsLoaded();
      });
      document.head.appendChild(imported);
    }
    scripts.forEach(loadScript)
  };
  loadScripts(options);
})();
