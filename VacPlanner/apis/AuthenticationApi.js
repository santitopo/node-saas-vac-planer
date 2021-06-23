const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const AuthenticationController = require("../controller/AuthenticationController");
const UserController = require("../controller/UserController");
const AssignmentCriteriaController = require("../controller/AssignmentCriteriaController");

module.exports = class AuthenticationApi {
  constructor(countryDataAccess) {
    this.authController = new AuthenticationController(countryDataAccess);
    this.userController = new UserController(countryDataAccess);
    this.assignmentCriteria = new AssignmentCriteriaController(
      countryDataAccess
    );
    this.init();
  }

  init() {
    const app = new Koa();
    const router = new Router();

    app.use(bodyParser());
    app.use(logger());

    router.post("/login", async (ctx, next) => {
      const result = await this.authController.login(ctx.request.body);
      ctx.response.body = result.body;
      ctx.response.status = result.status;
    });
    router.post("/testData", async (ctx, next) => {
      await this.assignmentCriteria.setTestData();
      ctx.body = {
        response: "Datos de Prueba agregados",
      };
      ctx.status = 200;
      return;
    });
    router.post("/user", async (ctx, next) => {
      if (ctx.request.headers["authorization"]) {
        const token = ctx.request.headers["authorization"].split("Bearer ")[1];
        const hasPermission = await this.authController.checkPermissions(
          token,
          ["create_users"]
        );
        if (!hasPermission) {
          ctx.response.body = "Unauthorized";
          ctx.response.status = 401;
          return;
        }

        const result = await this.userController.addUser(ctx.request.body);
        ctx.response.body = result.body;
        ctx.response.status = result.status;
      } else {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
      }
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5008);
  }
};
