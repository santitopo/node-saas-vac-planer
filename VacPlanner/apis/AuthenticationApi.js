const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const jwt = require("koa-jwt");
const publicKey = fs.readFileSync("services/config/public.key", "utf8");
const AuthenticationController = require("../controller/AuthenticationController");
const UserController = require("../controller/UserController");

module.exports = class AuthenticationApi {
  constructor(countryDataAccess) {
    this.authController = new AuthenticationController(countryDataAccess);
    this.userController = new UserController(countryDataAccess);
    this.init();
  }

  init() {
    const app = new Koa();
    const router = new Router();
    app.use(bodyParser());
    app.use(logger());
    // app.use(jwt({ secret: publicKey, algorithms: ["RS256"] }));

    router.post("/login", async (ctx, next) => {
      const result = await this.authController.login(ctx.request.body);
      ctx.response.body = result.body;
      ctx.response.status = result.status;
    });
    router.post("/user", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await this.authController.checkPermissions(token, [
        "create_users",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const result = await this.userController.addUser(ctx.request.body);
      ctx.response.body = result.body;
      ctx.response.status = result.status;
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5008);
  }
};
