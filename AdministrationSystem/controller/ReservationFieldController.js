fs = require("fs");

module.exports = class ReservationFieldController {
  constructor(logger) {
    this.logger = logger;
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
    const path = `../ReservationSystem/pipeline/filters/${ctx.request.body.fieldName}.js`;
    fs.writeFile(path, template, function (err) {
      if (err) {
        this.logger.logError(err);
      }
    });

    ctx.body = {
      response: `Agregado Correctamente la validacion para el campo ${ctx.request.body.fieldName}`,
    };
  }

  async delete(ctx) {
    const path = `../ReservationSystem/pipeline/filters/${ctx.request.params.fieldname}.js`;
    try {
      fs.unlinkSync(path)
      ctx.response.body = "Borrado satisfactoriamente"
      ctx.response.status = 200
    } catch (err) {
      console.error(`Error borrando el filtro ${ctx.request.params.fieldName}`)
      ctx.response.body = "Ocurrio un error"
      ctx.response.status = 400
    }
  };
}
