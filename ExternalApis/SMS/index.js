const Router = require("koa-router");
const Koa = require("koa");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const config = require("../../config.json")
const SMSPort = config.SMSApiPort

const app = new Koa();
const router = new Router()

app.use(bodyParser());
app.use(logger());

router.post("/sms", (ctx, next) => {
    console.log(ctx.request.body)
    ctx.response.status = 200
    ctx.response.body = "arrived"
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(SMSPort);