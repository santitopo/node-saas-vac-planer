reservationDate = (input, next) => {
  if ((input.reservationDate) && input.reservationDate.getFullYear() >= new Date().getFullYear() && input.reservationDate.getDate() >= new Date().getDate()) {
    return next(null, input);
  } else {
    return next("Se espera un campo reservationDate que sea mayor a la fecha actual", null);
  }
};
module.exports = reservationDate;
