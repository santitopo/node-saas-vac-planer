fs = require("fs");

module.exports = class ReservationController {
  constructor() {}

  async add(ctx, next) {
    const template = `${ctx.request.body.fieldName} = (input, next) => {
        if (input.${ctx.request.body.fieldName} && ${ctx.request.body.function}) {
          next(null, input);
        } else {
          next("${ctx.request.body.error}", null);
        }
      };
      module.exports = ${ctx.request.body.fieldName};
      `;

    fs.writeFile(
      `../ReservationService/pipeline/filters/${ctx.request.body.fieldName}.js`,
      template,
      function (err) {
        if (err) return console.log(err);
        console.log("error writing file");
      }
    );

    ctx.body = {
      response: `Agregado Correctamente la validacion para el campo ${ctx.request.body.fieldName}`,
    };
  }
};
