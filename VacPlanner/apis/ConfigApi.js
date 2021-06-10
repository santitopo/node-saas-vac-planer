const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const ReservationFieldController = require("../controller/ReservationFieldController");
const AssignmentCriteriaController = require("../controller/AssignmentCriteriaController");

module.exports = class ConfigApi {
  constructor(countryDataAccess) {
    this.init(countryDataAccess);
  }

  init(countryDataAccess) {
    const app = new Koa();
    const router = new Router();

    const reservationField = new ReservationFieldController();
    const assignmentCriteria = new AssignmentCriteriaController();

    app.use(bodyParser());
    app.use(logger());
    router.post("/reservationfields", (ctx, next) => {
      reservationField.add(ctx, next);
    });
    router.post("/assignmentCriteria", async (ctx, next) => {
      //Step 1 - Agregar a la bd y recuperar el id
      countryDataAccess.addCriteria(ctx.request.body.function);
      const id = 99;
      //Step 2 - Agregar a Redis para mantener sincronizado
      const success = await assignmentCriteria.addRedis(ctx, id, next);
      if (!success) {
        ctx.body = {
          response: "Error agregando el criterio de asignacion",
        };
        ctx.status = 400;
        return;
      }
      ctx.body = {
        response: "Agregado correctamente el criterio de asignacion",
      };
      ctx.status = 200;
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5005);
  }
};
