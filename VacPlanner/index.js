const CountryDataAccess = require("./dataAccess/DataAccess");
const ConfigApi = require("./apis/ConfigApi");

const countryDataAccess = new CountryDataAccess();
const configApi = new ConfigApi(countryDataAccess);
