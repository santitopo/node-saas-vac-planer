const CountryDataAccess = require("./dataAccess/DataAccess");
const ConfigApi = require("./apis/ConfigApi");
const VacQueryApi = require("./apis/VacQueryApi");
const ConfirmReservationService = require("./controller/ConfirmReservationService")
const QueryDataAccess = require("./dataAccess/QueryDataAccess");

const countryDataAccess = new CountryDataAccess();
const queryDataAccess = new QueryDataAccess();
const confirmReservationService = new ConfirmReservationService();
const configApi = new ConfigApi(countryDataAccess);
const vacQueryApi = new VacQueryApi(queryDataAccess);
