const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const Pipes = require("../pipeline/pipes");
const axios = require("axios");
const AssignmentCriterias = require("../services/assignmentCriterias");
const mqReservations = require("../communication/mqReservations");
const MQReservations = require("../communication/mqReservations");

module.exports = class ReservationApi {
  constructor() {
    this.init();
  }

  async fetchPerson(personId) {
    try {
      const response = await axios.get(
        "http://localhost:5006/people/" + personId
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  init() {
    const pipes = new Pipes();
    const app = new Koa();
    const router = new Router();
    const assignmentCriterias = new AssignmentCriterias();
    const mq = new MQReservations();
    
    app.use(bodyParser());
    app.use(logger());
    router.post("/reservations", async (ctx, next) => {
      //Step 1 - Validators
      // const validationError = pipes.pipeline.run(ctx.request.body);
      // if (validationError) {
      //   ctx.status = validationError.code;
      //   ctx.body = validationError.message;
      //   return;
      // }
      //Step 2 - Request a Registro Civil (Deberian ser apis dinamicamente cargadas)
      const person = await this.fetchPerson(ctx.request.body.id);
      if (!person) {
        ctx.body = "No se encontró la cédula provista";
        ctx.status = 400;
        return;
      }
      ctx.body = person;
      ctx.status = 200;
      //Step 3 (Redis) - Aplicar todos los criterios de asignacion para obtener array con ids de criterios aplicables
      const updatedCriterias = assignmentCriterias.getUpdatedCriterias();

      const resulArray = updatedCriterias.map((f) => {
        if (f.function(person)) {
          return f.index;
        } else {
          return -1;
        }
      });
      const validCriterias = resulArray.filter((e) => e != -1);
      console.log(validCriterias);
      //Step 4 (SQL) - Update de cupo libre

      // Step 5
      //person es ejemplo, aca se mandaria el tipo de objeto que queremos mandar en JSON a la MQ
      //Sera tiene proyecto test con consumidor
      mq.add(person);

      // If pudo reservar ->  Dejo la reserva con cupo en la MQ
      // If no pudo reservar ->  Dejo la reserva pendiente en la MQ
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5004);
  }
};
