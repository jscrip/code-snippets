/*
  Get the URLs and Titles from DuckDuckGo SERP 
*/
var urls = [...document.querySelectorAll(".results .result__title")].map(el => ({
 title:el.innerText,
 href:el.querySelector("a").href
}));
console.log(urls);

/* 

Example output

[
  {
    "title": "Amazon Best Sellers: Best 3D Printers",
    "href": "https://www.amazon.com/Best-Sellers-3D-Printers/zgbs/industrial/6066127011"
  },
  {
    "title": "The Best 3D Printers for 2022 | PCMag",
    "href": "https://www.pcmag.com/picks/the-best-3d-printers"
  },
  {
    "title": "Top 20 Best 3D Printers 2022 (For ALL Price Ranges!)",
    "href": "https://www.3dsourced.com/3d-printers/best-3d-printer/"
  },
  {
    "title": "What is 3D printing? How does a 3D printer work? Learn 3D printing",
    "href": "https://3dprinting.com/what-is-3d-printing/"
  },
  {
    "title": "The 12 Best 3D Printers 2022 for Professionals & Hobbyists",
    "href": "https://www.omnicoreagency.com/best-3d-printers/"
  },
  {
    "title": "3d Printers - Best Buy",
    "href": "https://www.bestbuy.com/site/shop/3d-printers"
  },
  {
    "title": "Best 3D Printers 2022 | Tom's Hardware",
    "href": "https://www.tomshardware.com/best-picks/best-3d-printers"
  },
  {
    "title": "Best 3D printers for 2022 | Tom's Guide",
    "href": "https://www.tomsguide.com/us/best-3d-printers,review-2236.html"
  },
  {
    "title": "3D Printer Options: 3D Printers, 3D Filament - Best Buy",
    "href": "https://www.bestbuy.com/site/printers/3d-printers/pcmcat748300445257.c?id=pcmcat748300445257"
  },
  {
    "title": "Home :: FORGE 3D Printing Studio",
    "href": "https://www.forgejax.com/"
  }
]

*/
