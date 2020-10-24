const fs = require("fs");

function writeResultstoFile(data, outputFile) {
  fs.writeFile(
    outputFile,
    JSON.stringify(data, null, 4).replace(/\\"/g, '\\"'),
    function (err) {
      if (err) throw err;
      console.log("Data written to file " + outputFile);
    }
  );
}

module.exports = { writeResultstoFile };
