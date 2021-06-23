phone = (input, next) => {
        if ((input.phone) && input.phone.match(/^[0-9]+$/) && input.phone.length === 9 && input.phone[0] == 0 && input.phone[1] == 9) {
          return next(null, input);
        } else {
          return next("Se espera un campo phone de nueve digitos con el prefijo 09", null);
        }
      };
      module.exports = phone;
      