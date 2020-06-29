const express = require("express");
const app = express();
const lib = require("pipedrive");
var mysql = require("mysql");
lib.Configuration.apiToken = "da8dbcc3866222ea70cdb7b28f4c278788a04779";

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "iqrate",
});

const sqlConnect = () => {
  con.connect(function (error) {
    if (error) throw error;
    console.log("Connected!");
  });
}

const closeConnection = function () {
  con.end(function(error) {
  if (error) throw error;
  console.log('Closed the database connection.');
})};

async function addOrganizations(){
  try {
      sqlConnect();
      const user = await lib.OrganizationsController.getAllOrganizations([], (error, response, context) => {
      if (error) throw error;
      response.data.forEach(addToDatabase);
    });
  }
  finally{
    closeConnection();
  }
};

const addToDatabase = ({ id, name, address_formatted_address: address }) => {
  var sql = "INSERT INTO organizations (id, name, address) VALUES (?, ?, ?)";
  con.query(sql, [ id, name, address ], function (error, result) {
    if (error) throw error;
  });
};

addOrganizations();