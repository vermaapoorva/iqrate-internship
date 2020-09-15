const cheerio = require("cheerio");
const fs = require("fs");

const {
  checkNewHotels,
  addToPipedrive,
} = require("./evaluate-and-send-data.js");

// search the given location and wait for results to load
async function searchLocation(page, location) {
  const searchBox =
    "input.c-autocomplete__input.sb-searchbox__input.sb-destination__input";
  const searchButton = "button.sb-searchbox__button";
  await page.waitFor(searchBox);
  await page.type(searchBox, location);
  await page.evaluate(
    (searchButton) => document.querySelector(searchButton).click(),
    searchButton
  );
  await page.waitForNavigation();
}

// scrape the results and return an array of all the hotels currently on the site
const scrape = async (page, outputFile, location) => {
  var results = [];
  const lastPageNumber = await getLastPageNumber(page);
  // loop through all pages and get hotels
  for (let index = 0; index < lastPageNumber; index++) {
    await checkCurrentPage(page, lastPageNumber); //optional
    results = await scrapeCurrentPage(page, results, outputFile, location);
    await goToNextPage(page, index, lastPageNumber);
  }
  return results;
};

// ---------- check that page is changing (can remove) ---------- //
async function checkCurrentPage(page, lastPageNumber) {
  var currentPageNumber = 1;
  if (lastPageNumber !== 1) {
    const currentPageElement =
      "#search_results_table > div.bui-pagination.results-paging > nav > ul > li.bui-pagination__pages > ul > li.bui-pagination__item.bui-pagination__item--active.sr_pagination_item.current > a > div.visuallyhidden";
    var current = await page.$(currentPageElement);
    currentPageNumber = (
      await page.evaluate((current) => current.textContent, current)
    ).split(" ")[1];
  }
  console.log("currently page: " + currentPageNumber);
}
// -------------------------------------------------------------- //

// get hotel names from current page
// add new hotels to array of hotel names so far
// add new hotels to pipedrive
async function scrapeCurrentPage(page, results, outputFile, location) {
  await page.waitForSelector("#hotellist_inner");
  const data = await getData(
    await page.evaluate(() => document.querySelector("body").innerHTML)
  );
  const newHotels = checkNewHotels(data, outputFile);
  addToPipedrive(newHotels, location);
  return [...results, ...newHotels];
}

// get the number of pages (default 1)
async function getLastPageNumber(page) {
  const lastPageNumberElem =
    "#search_results_table > div.bui-pagination.results-paging > nav > ul > li.bui-pagination__pages > ul > li:nth-child(10) > a > div.visuallyhidden";
  const number = await page.$(lastPageNumberElem);
  if (number !== null) {
    return (await page.evaluate((number) => number.textContent, number)).split(
      " "
    )[1];
  }
  return 1;
}

// next page button clicked to jump to next page (not on last page)
async function goToNextPage(page, index, lastPageNumber) {
  if (index != lastPageNumber - 1) {
    const nextArrow =
      "#search_results_table > div.bui-pagination.results-paging > nav > ul > li.bui-pagination__item.bui-pagination__next-arrow > a";
    await page.waitForSelector(nextArrow);
    await page.evaluate(
      (nextArrow) => document.querySelector(nextArrow).click(),
      nextArrow
    );
    await page.waitForNavigation();
  }
}

// get names of all hotels on current page given innerHTML
async function getData(html) {
  data = [];
  const $ = cheerio.load(html);
  $(".sr-hotel__name").map((i, element) => {
    data.push({
      name: $(element).text().trim(),
    });
  });
  return data;
}

module.exports = { scrape, searchLocation };