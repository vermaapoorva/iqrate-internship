// Returns array with all room details
const extractRooms = () => {
  let roomType;
  let bedText;
  let roomDesc;
  let features;
  const rooms = [];
  const $ = window.jQuery;

  // Iterate all table rows
  const rows = $(".hprt-table > tbody > tr");

  for (let i = 0; i < rows.length; i++) {
    const row = rows.eq(i);
    const roomRow = row.find(".hprt-table-cell-roomtype");
    // Get details about specific room from first row of each room
    if (roomRow.length > 0) {
      roomType = row.find(".hprt-roomtype-icon-link");
      const bedType = row.find(".hprt-roomtype-bed");
      bedText = bedType.length > 0 ? bedType.text() : null;
      roomDesc = row.find(".short-room-desc").text();
      // Iterate and parse all room facilities.
      features = [];
      const facilities = roomRow.find(".hprt-facilities-facility");
      if (facilities.length > 0) {
        for (let fi = 0; fi < facilities.length; fi++) {
          const f = facilities.eq(fi);
          const fText = f.text().replace("•", "").trim();
          if (fText.indexOf("ft²") > -1) {
            const num = parseInt(fText.split(" ")[0], 10);
            const nText = `${parseInt(num * 0.092903, 10)} m²`;
            features.push(nText);
          } else {
            features.push(fText);
          }
        }
      }
    }

    // Extract data for each room.
    const priceE = row.find(".bui-price-display__value").eq(0);
    const priceT =
      priceE.length > 0
        ? priceE
            .text()
            .replace(/\s|,/g, "")
            .match(/(\d|\.)+/)
        : null;
    const priceC =
      priceE.length > 0
        ? priceE
            .text()
            .replace(/\s|,/g, "")
            .match(/[^\d.]+/)
        : null;
    const cond = row.find(".hprt-conditions li");
    const taxAndFeeText = row
      .find(".prd-taxes-and-fees-under-price")
      .eq(0)
      .text()
      .trim();
    const taxAndFee = taxAndFeeText.match(/\d+/);

    const room = { available: true };
    if (roomType) {
      room.roomType = roomType.text().trim();
    }
    if (bedText) {
      room.bedType = bedText.replace(/\n+/g, "");
    }
    if (roomDesc) {
      room.roomDesc = roomDesc.replace(/\n+/g, "");
    }
    if (priceT && priceC) {
      room.price = parseFloat(priceT[0]);
      if (taxAndFee) {
        room.price += taxAndFee ? parseFloat(taxAndFee[0]) : 0;
      }
      room.currency = priceC[0];
      room.features = JSON.stringify(features);
    } else {
      room.available = false;
    }
    if (cond.length > 0) {
      conditions = [];
      for (let ci = 0; ci < cond.length; ci++) {
        const cText = cond.eq(ci).text().trim();
        conditions.push(cText.replace(/(\n|\s)+/g, " "));
      }
    }
    room.conditions = JSON.stringify(conditions);
    rooms.push(room);
  }
  return rooms;
};

// returns a JSON object with details about the hotel on the given page
async function extractDetail(page) {
  const ldElem = await page.$('script[type="application/ld+json"]');
  const ld = JSON.parse(await getAttribute(ldElem, "textContent"));
  const addr = ld.address || null;
  const address = addr.streetAddress;
  const name = await page.$("#hp_hotel_name");
  const nameText = (await getAttribute(name, "textContent")).split("\n");
  const hotelType = await page.$(".hp__hotel-type-badge");
  const breakfast = await page.$(".ph-item-copy-breakfast-option");
  const rooms = await page.evaluate(extractRooms);

  return {
    name: nameText[nameText.length - 1].trim(),
    type: await getAttribute(hotelType, "textContent"),
    address,
    breakfast: await getAttribute(breakfast, "textContent"),
    rooms,
  };
}

// returns given attribute of the element if it exists, else ""
const getAttribute = async (element, attr, fallback = "") => {
  try {
    const prop = await element.getProperty(attr);
    return (await prop.jsonValue()).trim();
  } catch (e) {
    return fallback;
  }
};

// extracts information from the detail page.
module.exports = { extractDetail };
