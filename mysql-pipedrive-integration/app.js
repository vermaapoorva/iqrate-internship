const { response } = require('express');
// imports DB connector (send queries asynchronously using DB.sendQuery(query, params))
const DB = require('./connectors/db_connector');
// imports pipedrive api connector
const Pipedrive = require('./connectors/pipedrive_connector');

/* Copies all organisations from pipedrive to MYSQL DB*/
const addOrganizations = () => {
  // change any of nulls, to start filtering data
  const input = {
    userId: null,
    filterId: null,
    firstChar: null,
    start: null,
    limit: null,
    sort: null,
  };

  Pipedrive.OrganizationsController.getAllOrganizations(
    input,
    (err, res, context) => {
      if (err) throw err;
      // build up array of data [[id, name, address]] and then insert everything into DB
      values = [];
      res.data.map(({ id, name, address_formatted_address: address }) =>
        values.push([id, name, address])
      );
      DB.sendQuery(
        'INSERT IGNORE INTO organizations(id, name, address) VALUES ?',
        [values]
      )
        .then((res) => console.log('Organizations added'))
        .catch((err) => console.log('Error occured : ' + err.message));
    }
  );
};

// run addOrganizations function
addOrganizations();
