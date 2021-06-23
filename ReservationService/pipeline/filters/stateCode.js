stateCode = (input, next) => {
  if ((input.stateCode) && input.stateCode > 0 && input.stateCode < 20) {
    return next(null, input);
  } else {
    return next("Se espera un campo stateCode entre 1 y 19", null);
  }
};
module.exports = stateCode;
