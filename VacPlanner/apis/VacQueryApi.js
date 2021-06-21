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
      const res = await queryDataAccess.vaccinesByStateAndTurn(ctx.request.body.params);
      console.log("RESPONSE", res)
      ctx.response.body = res;
    });

    router.get("/query/vaccinesbystatezone", async (ctx, next) => {
      const res = await queryDataAccess.vaccinesByStateAndZone(ctx.request.body.params);
      console.log("RESPONSE", res)
      ctx.response.body = res;
    });

    router.get("/query/pendingreservations", async (ctx, next) => {
      const res = await queryDataAccess.pendingReservaionsByDepartment();
      console.log("RESPONSE", res)
      ctx.response.body = res;
    });

    router.get("/query/givenandremainingvaccines", async (ctx, next) => {
      const res = await queryDataAccess.givenAndRemainingVaccines(ctx.request.body.params);
      console.log("RESPONSE", res)
      ctx.response.body = res;
    });

    router.get("/query/testData", async (ctx, next) => {
      const res = await queryDataAccess.createTestData();
      console.log("RESPONSE", res)
      ctx.response.body = res;
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5009);
  }
};