turn = (input, next) => {
        if ((input.turn) && input.turn.match(/^[0-9]+$/) && input.turn > 0 && input.turn < 4) {
          return next(null, input);
        } else {
          return next("Se espera un campo turn entre 1 y 3 (1 – todo el día, 2 – Matutino, 3 – Vespertino", null);
        }
      };
      module.exports = turn;
      