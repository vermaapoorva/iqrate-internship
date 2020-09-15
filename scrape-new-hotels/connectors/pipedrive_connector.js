"use strict";
const connector = require("pipedrive");
const config = require("../config/pipedrive.json");
connector.Configuration.apiToken = config.apiToken;

module.exports = connector;