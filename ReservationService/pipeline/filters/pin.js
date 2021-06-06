pin = (input, next) => {
        if (input.pin && input.pin.length == 3) {
          next(null, input);
        } else {
          next("Se espera un campo pin, de 3 digitos", null);
        }
      };
      module.exports = pin;
      