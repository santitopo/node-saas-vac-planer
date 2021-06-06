const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(logger());
router.post("/reservationfields", (ctx, next) => {
  //Step 1 - Chequear que no exista el field en el fs
  //Step 2 - Agregar al fs el validator
  ctx.body = "Response";
});
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(5005);
