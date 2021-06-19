const Router = require("koa-router");
const Koa = require("koa");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");


const app = new Koa();
const router = new Router()

app.use(bodyParser());
app.use(logger());

router.post("/sms", (ctx, next) => {
    console.log(ctx.request.body)
    ctx.request.status = 200
    ctx.request.body = 
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(5007);