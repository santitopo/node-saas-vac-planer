const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const Pipes = require("../pipeline/pipes");

module.exports = class ReservationApi {
  constructor() {
    this.init();
  }

  init() {
    const pipes = new Pipes();
    const app = new Koa();
    const router = new Router();

    app.use(bodyParser());
    app.use(logger());
    router.post("/reservations", (ctx, next) => {
      //Step 1 - Validators
      pipes.pipeline.run(ctx.request.body);
      //Step 2 - Request a Registro Civil
      //Step 3 - Update de cupo libre
      //Step 4 - Llamada a MQ
      ctx.body = "Response";
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5004);
  }
};
