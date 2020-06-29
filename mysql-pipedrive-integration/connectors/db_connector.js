"use strict";
const mysql = require("mysql");
const config = require("../config/db.json");

exports.sendQuery = (query, params) => {
  return new Promise((resolve, reject) => {
    var connection = getConnection();
    connection.query(query, params, function(err, rows, fields) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
    // ends connection thread after each query
    connection.end();
  });
};

function getConnection() {
  // initiates mysql db connection
  var connection = mysql.createConnection(config);

  //Connects to database
  connection.connect(err => {
    if (err) {
      console.log("Error connecting to Db");
    }
  });

  //handles disconnect
  connection.on("error", function(err) {
    if (err.fatal) {
      getConnection();
    }
  });

  return connection;
}