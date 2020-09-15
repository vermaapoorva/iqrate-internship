"use strict";
const connector = require('@sendgrid/mail');
const config = require("../config/sendgrid.json");
connector.setApiKey(config.apiToken);

module.exports = connector;