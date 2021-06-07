const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const ReservationFieldController = require("../controller/ReservationFieldController");

module.exports = class ConfigApi {
  constructor() {
    this.init();
  }

  init() {
    console.log("holahola");
    const app = new Koa();
    const router = new Router();

    const reservationField = new ReservationFieldController();

    app.use(bodyParser());
    app.use(logger());
    router.post("/reservationfields", (ctx, next) => {
      //Step 1 - Chequear que no exista el field en el fs
      //Step 2 - Agregar al fs el validator
      reservationField.add(ctx, next);
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5005);
  }
};
