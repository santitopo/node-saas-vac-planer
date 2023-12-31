const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const CheckReservationController = require("../controller/CheckReservationController");
const config = require("../../config.json")
const CheckReservationPort = config.CheckReservationApiPort

module.exports = class CheckReservationApi {
    constructor(countryDataAccess, logger) {
        this.logger = logger;
        this.checkReservations = new CheckReservationController(countryDataAccess, logger);
        this.init();
    }

    init() {
        const app = new Koa();
        const router = new Router();

        app.use(bodyParser());
        app.use(logger());

        router.get("/reservation", async (ctx, next) => {
            const result = await this.checkReservations.checkReservation(ctx.request.body.dni);
            ctx.response.body = result.body;
            ctx.response.status=result.status;
        });

        router.delete("/reservation", async (ctx, next) => {
            const result = await this.checkReservations.deleteReservation(ctx.request.body.dni, ctx.request.body.reservationCode);
            ctx.response.body = result.body;
            ctx.response.status=result.status;
        });
        app.use(router.routes());
        app.use(router.allowedMethods());

        app.listen(CheckReservationPort);
    }
};