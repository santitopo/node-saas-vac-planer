const CountryDataAccess = require("./dataAccess/DataAccess");
const ConfigApi = require("./apis/ConfigApi");
const AuthenticationApi = require("./apis/AuthenticationApi");
const VacQueryApi = require("./apis/VacQueryApi");
const ConfirmReservationService = require("./controller/ConfirmReservationService");
const QueryDataAccess = require("./dataAccess/QueryDataAccess");
const CheckReservationApi = require("./apis/CheckReservationApi");

const countryDataAccess = new CountryDataAccess();
const queryDataAccess = new QueryDataAccess();
const confirmReservationService = new ConfirmReservationService();
const configApi = new ConfigApi(countryDataAccess);
const authenticationApi = new AuthenticationApi(countryDataAccess);
const vacQueryApi = new VacQueryApi(queryDataAccess);
const checkReservationApi = new CheckReservationApi(countryDataAccess);
