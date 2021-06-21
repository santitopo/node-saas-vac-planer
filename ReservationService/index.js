const CountryDataAccess = require("./dataAccess/DataAccess");
const ReservationApi = require("./apis/ReservationApi");
const AuthenticationApi = require("./apis/AuthenticationApi");

const countryDataAccess = new CountryDataAccess();
const reservationApi = new ReservationApi(countryDataAccess);
