const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const ReservationController = require("../controller/ReservationController");

module.exports = class ReservationApi {
  constructor(countryDataAccess, logger) {
    this.logger = logger;
    this.reservationController = new ReservationController(countryDataAccess, logger);
    this.init();
  }

  init() {
    const app = new Koa();
    const router = new Router();
    app.use(bodyParser());
    app.use(logger());
    router.post("/reservations", async (ctx, next) => {
      const result = await this.reservationController.addReservation(
        ctx.request.body
      );
      ctx.response.body = result.body;
      ctx.response.status = result.status;
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5004);
  }
};
