zoneCode = (input, next) => {
        if ((input.zoneCode) && input.zoneCode.match(/^[0-9]+$/) && input.zoneCode.length <= 2 && input.zoneCode >= 1 && input.zoneCode <= 99 ) {
          return next(null, input);
        } else {
          return next("Se espera un campo zoneCode entre 1 y 99", null);
        }
      };
      module.exports = zoneCode;
      