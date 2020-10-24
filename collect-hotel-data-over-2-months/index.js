const puppeteer = require("puppeteer");
const { extractDetail } = require("./utils/scrape-data.js");
const { writeResultstoFile } = require("./utils/file-handling");
const outputFile = "results.json";
const url =
  "https://www.booking.com/hotel/gr/hilton-athens.en-gb.html?label=gen173nr-1FCAEoggI46AdIM1gEaFCIAQGYAQm4ARfIAQzYAQHoAQH4AQuIAgGoAgO4Ap3UgvsFwAIB0gIkMTZmNzMxMmItYTU2Yi00MjYxLWEyNDgtY2RkNjQ4ZTRmODEy2AIG4AIB;sid=ef8ea64618b8e6fdd5294e207bfda97d;all_sr_blocks=9735401_274559655_2_2_0;checkin=2020-10-24;checkout=2020-10-25;dest_id=-814876;dest_type=city;dist=0;group_adults=2;group_children=0;hapos=1;highlighted_blocks=9735401_274559655_2_2_0;hp_group_set=0;hpos=1;no_rooms=1;room1=A%2CA;sb_price_type=total;sr_order=popularity;sr_pri_blocks=9735401_274559655_2_2_0__18458;srepoch=1603557386;srpvid=92da74c48be70124;type=total;ucfs=1&#hotelTmpl";
// main function
void (async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.goto(url);
    page.waitForNavigation();
    console.log("extracting detail...");
    const detail = await extractDetail(page);
    console.log("detail extracted");
    console.log(detail);
    writeResultstoFile(detail, outputFile);
  } catch (err) {
    console.log(err);
  }
})();
