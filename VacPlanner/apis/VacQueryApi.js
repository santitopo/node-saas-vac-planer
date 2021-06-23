const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const AuthenticationController = require("../controller/AuthenticationController");

module.exports = class VacQueryApi {
  constructor(queryDataAccess) {
    this.init(queryDataAccess);
  }

  init(queryDataAccess) {
    const app = new Koa();
    const router = new Router();
    const authController = new AuthenticationController();

    app.use(bodyParser());
    app.use(logger());

    //VacQueryTool queries
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
      const res = await queryDataAccess.pendingReservationsByDepartment();
      ctx.response.body = res;
    });
    //Admin Internal Queries
    router.get(
      "/query/pendingreservationsdepartmentzone",
      async (ctx, next) => {
        if (ctx.request.headers["authorization"]) {
          const token =
            ctx.request.headers["authorization"].split("Bearer ")[1];
          const hasPermission = await authController.checkPermissions(token, [
            "query",
          ]);
          if (!hasPermission) {
            ctx.response.body = "Unauthorized";
            ctx.response.status = 401;
            return;
          }
          const res =
            await queryDataAccess.pendingReservationsByDepartmentAndZone();
          ctx.response.body = res;
        } else {
          ctx.response.body = "Unauthorized";
          ctx.response.status = 401;
        }
      }
    );

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5009);
  }
};
