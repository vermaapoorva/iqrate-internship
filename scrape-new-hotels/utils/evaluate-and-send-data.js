const fs = require("fs");
const sendgrid = require("../connectors/sendgrid_connector");
const Pipedrive = require("../connectors/pipedrive_connector");

// check for new hotels by comparing the results with
// the hotels already in the file for this location
function checkNewHotels(results, outputFile) {
  const currentHotels = getCurrentHotels(outputFile);
  const newHotels = [];
  results.forEach((element) => {
    if (!JSON.stringify(currentHotels).includes(element.name)) {
      newHotels.push(element);
    }
  });
  return newHotels;
}

// get hotels from current file for this location
function getCurrentHotels(outputFile) {
  try {
    return fs.readFileSync(outputFile, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return "[]";
    throw err;
  }
}

// update the file for this location with the new hotels found
function writeResultstoFile(newHotels, outputFile) {
  const currentHotels = JSON.parse(getCurrentHotels(outputFile));
  const allHotels = JSON.stringify([...currentHotels, ...newHotels]);
  fs.writeFile(outputFile, allHotels, "utf8", function (err) {
    if (err) throw err;
    console.log("There were " + newHotels.length + " new properties.");
    console.log(
      "There are now " + JSON.parse(allHotels).length + " properties."
    );
  });
}

// add new hotels to pipedrive
function addToPipedrive(newHotels, location) {
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

module.exports = {
  checkNewHotels,
  writeResultstoFile,
  addToPipedrive,
  sendEmail,
};