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
    this.authenticationController = new AuthenticationController(
      countryDataAccess
    );
    this.userController = new UserController(countryDataAccess);
    this.init();
  }

  init() {
    const app = new Koa();
    const router = new Router();
    app.use(bodyParser());
    app.use(logger());
    app.use(jwt({ secret: publicKey, algorithms: ["RS256"] }));

    router.post("/login", async (ctx, next) => {
      const result = await this.authenticationController.login(
        ctx.request.body
      );
      ctx.response.body = result.body;
      ctx.response.status = result.status;
    });
    router.post("/user", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[0];
      if (
        !this.authenticationController.checkPermissions(token, ["create_users"])
      ) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const result = await this.userController.addUser(ctx.request.body);
      ctx.response.body = result.body;
      ctx.response.status = result.status;
    });
    // router.post("/test", async (ctx, next) => {
    //   const result = await this.authenticationController.testDecoding(
    //     ctx.request.body.token
    //   );
    //   ctx.response.body = { resultado: result };
    //   ctx.response.status = 200;
    // });

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5008);
  }
};
