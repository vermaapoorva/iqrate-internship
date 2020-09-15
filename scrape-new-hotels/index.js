const puppeteer = require("puppeteer");
const url = "https://www.booking.com/";

const {
  scrape,
  searchLocation,
} = require("./utils/scrape-and-navigate-page.js");
const {
  writeResultstoFile,
  sendEmail,
} = require("./utils/evaluate-and-send-data.js");

// change location as required
const location = "London";
const outputFile = location + "Hotels.json";

// main function
void (async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.goto(url);
    await searchLocation(page, location);
    const newHotels = await scrape(page, outputFile, location);
    browser.close();
    writeResultstoFile(newHotels, outputFile);
    sendEmail(newHotels);
  } catch (err) {
    console.log(err);
  }
})();
