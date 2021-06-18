const CountryDataAccess = require("./dataAccess/DataAccess");
const ConfigApi = require("./apis/ConfigApi");
const ConfirmReservationService = require("./controller/ConfirmReservationService")

const countryDataAccess = new CountryDataAccess();
const confirmReservationService = new ConfirmReservationService();
const configApi = new ConfigApi(countryDataAccess);

