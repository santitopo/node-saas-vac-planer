fs = require("fs");

module.exports = class ReservationFieldController {
  constructor() {
    //
  }

  async add(ctx, next) {
    const template = `${ctx.request.body.fieldName} = (input, next) => {
        if ((input.${ctx.request.body.fieldName}) && ${ctx.request.body.function}) {
          return next(null, input);
        } else {
          return next("${ctx.request.body.error}", null);
        }
      };
      module.exports = ${ctx.request.body.fieldName};
      `;
    const path = `../ReservationService/pipeline/filters/${ctx.request.body.fieldName}.js`;
    fs.writeFile(path, template, function (err) {
      if (err) {
        console.log(err);
      }
    });

    ctx.body = {
      response: `Agregado Correctamente la validacion para el campo ${ctx.request.body.fieldName}`,
    };
  }
};
