const CountryDataAccess = require("./dataAccess/DataAccess");
const ConfigApi = require("./apis/ConfigApi");
const ConfirmReservationService = require("./controller/ConfirmReservationService");
const AuthenticationApi = require("./apis/AuthenticationApi");

const countryDataAccess = new CountryDataAccess();
const confirmReservationService = new ConfirmReservationService();
const configApi = new ConfigApi(countryDataAccess);
const authenticationApi = new AuthenticationApi(countryDataAccess);
