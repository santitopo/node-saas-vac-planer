const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

module.exports = class VacQueryApi {
  constructor(queryDataAccess) {
    this.init(queryDataAccess);
  }

  init(queryDataAccess) {
    const app = new Koa();
    const router = new Router();

    app.use(bodyParser());
    app.use(logger());
    router.get("/query/vaccinesbystateturn", async (ctx, next) => {
      const res = await queryDataAccess.vaccinesByStateAndTurn(
        ctx.request.body.params
      );
      ctx.response.body = res;
    });

    router.get("/query/vaccinesbystatezone", async (ctx, next) => {
      const res = await queryDataAccess.vaccinesByStateAndZone(
        ctx.request.body.params
      );
      ctx.response.body = res;
    });

    router.get("/query/pendingreservationsdepartment", async (ctx, next) => {
      const res = await queryDataAccess.pendingReservaionsByDepartment();
      ctx.response.body = res;
    });

    router.get(
      "/query/pendingreservationsdepartmentzone",
      async (ctx, next) => {
        const res =
          await queryDataAccess.pendingReservaionsByDepartmentAndZone();
        ctx.response.body = res;
      }
    );

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5009);
  }
};
