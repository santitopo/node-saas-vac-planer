pin = (input, next) => {
  console.log(input);
  if (input.pin && input.pin.toString().length == 3) {
    return next(null, input);
  } else {
    return next("Se espera un campo pin, de 3 digitos", null);
  }
};
module.exports = pin;
