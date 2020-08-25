const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const Pipedrive = require("./connectors/pipedrive_connector");
const sendgrid = require("./connectors/sendgrid_connector");

const outputFile = location + "Hotels.json";
const url = "https://www.booking.com/";

// change location as required
const location = "London";

// main function
void (async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.goto(url);
    await searchLocation(page);
    const newHotels = await scrape(page);
    browser.close();
    writeResultstoFile(newHotels);
    sendEmail(newHotels);
  } catch (err) {
    console.log(err);
  }
})();

// scrape the results and return an array of all the hotels currently on the site
const scrape = async (page) => {
  var results = [];
  const lastPageNumber = await getLastPageNumber(page);
  // loop through all pages and get hotels
  for (let index = 0; index < lastPageNumber; index++) {
    await checkCurrentPage(page, lastPageNumber); //optional
    results = await scrapeCurrentPage(page, results);
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
async function scrapeCurrentPage(page, results) {
  await page.waitForSelector("#hotellist_inner");
  const data = await getData(
    await page.evaluate(() => document.querySelector("body").innerHTML)
  );
  const newHotels = checkNewHotels(data);
  addToPipedrive(newHotels);
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

// search the given location and wait for results to load
async function searchLocation(page) {
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

// check for new hotels by comparing the results with
// the hotels already in the file for this location
function checkNewHotels(results) {
  const currentHotels = getCurrentHotels();
  const newHotels = [];
  results.forEach((element) => {
    if (!JSON.stringify(currentHotels).includes(element.name)) {
      newHotels.push(element);
    }
  });
  return newHotels;
}

// update the file for this location with the new hotels found
function writeResultstoFile(newHotels) {
  const currentHotels = JSON.parse(getCurrentHotels());
  const allHotels = JSON.stringify([...currentHotels, ...newHotels]);
  fs.writeFile(outputFile, allHotels, "utf8", function (err) {
    if (err) throw err;
    console.log("There were " + newHotels.length + " new properties.");
    console.log(
      "There are now " + JSON.parse(allHotels).length + " properties."
    );
  });
}

// get hotels from current file for this location
function getCurrentHotels() {
  try {
    return fs.readFileSync(outputFile, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return "[]";
    throw err;
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

// add new hotels to pipedrive
function addToPipedrive(newHotels) {
  newHotels.forEach(async (element) => {
    const input = {
      body: {
        name: element.name,
        address: location,
      },
    };
    await Pipedrive.OrganizationsController.addAnOrganization(
      input,
      (err, res, context) => {
        if (err) {
          console.log(err);
        }
      }
    );
  });
}

// send email with array of new hotels
function sendEmail(newHotels) {
  const msg = {
    to: "apoorvaverma2001@gmail.com",
    from: "apoorva.verma@hotmail.com",
    subject: "New Hotels",
    text: JSON.stringify(newHotels),
  };
  sendgrid.send(msg);
}
