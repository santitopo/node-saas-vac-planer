const CountryDataAccess = require("./dataAccess/DataAccess");
const ConfigApi = require("./apis/ConfigApi");
const AuthenticationApi = require("./apis/AuthenticationApi");
const VacQueryApi = require("./apis/VacQueryApi");
const ConfirmReservationService = require("./services/ConfirmReservationService");
const QueryDataAccess = require("./dataAccess/QueryDataAccess");
const CheckReservationApi = require("./apis/CheckReservationApi");
const Logger = require("./Logger")

const logger = new Logger();
const countryDataAccess = new CountryDataAccess(logger);
const queryDataAccess = new QueryDataAccess(logger);
const confirmReservationService = new ConfirmReservationService(countryDataAccess, logger);
const configApi = new ConfigApi(countryDataAccess, logger);
const authenticationApi = new AuthenticationApi(countryDataAccess, logger);
const vacQueryApi = new VacQueryApi(queryDataAccess, logger);
const checkReservationApi = new CheckReservationApi(countryDataAccess, logger);
