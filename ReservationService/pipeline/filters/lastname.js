lastname = (input, next) => {
  if (input.lastname && input.lastname.length == 6) {
    return next(null, input);
  } else {
    return next("Se espera un campo lastname, de 6 digitos", null);
  }
};
module.exports = lastname;
