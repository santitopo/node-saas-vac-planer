lastname = (input, next) => {
        if (input.lastname && input.lastname.length == 6 || false) {
          return next(null, input);
        } else {
          return next("Se espera un campo lastname de 6 Digitos", null);
        }
      };
      module.exports = lastname;
      