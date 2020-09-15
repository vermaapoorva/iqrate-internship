const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

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