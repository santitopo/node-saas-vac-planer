const CountryDataAccess = require("./dataAccess/DataAccess");
const ReservationApi = require("./apis/ReservationApi");
const Logger = require("./Logger")

const logger = new Logger();
const countryDataAccess = new CountryDataAccess(logger);
const reservationApi = new ReservationApi(countryDataAccess, logger);
