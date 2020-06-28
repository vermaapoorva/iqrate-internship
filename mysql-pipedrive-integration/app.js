const express = require('express');
const app = express();
const lib = require('pipedrive');

const PORT = 1800;

lib.Configuration.apiToken = 'da8dbcc3866222ea70cdb7b28f4c278788a04779';

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

input = [];

app.get('/', async (req, res) => {
    const user = await lib.OrganizationsController.getAllOrganizations(input, (error, response, context) => {});

    res.send(user);
});