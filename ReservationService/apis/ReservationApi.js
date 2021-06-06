const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const Pipes = require("../pipeline/pipes");
const axios = require("axios");

const olderthan50 = (person) => {
  return (
    new Date().getFullYear() - new Date(person.DateOfBirth).getFullYear() > 50
  );
};

const priority1Group = (person) => {
  return person.Priority == 1;
};

module.exports = class ReservationApi {
  constructor() {
    this.init();
  }

  async fetchPerson(personId) {
    try {
      const response = await axios.get(
        `https://d9aa800a527a.ngrok.io/people/${personId}`
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
    const assignmentCriterias = [
      { function: olderthan50, index: 28 },
      { function: priority1Group, index: 33 },
    ];
    app.use(bodyParser());
    app.use(logger());
    router.post("/reservations", async (ctx, next) => {
      //Step 1 - Validators
      const validationError = pipes.pipeline.run(ctx.request.body);
      if (validationError) {
        ctx.status = validationError.code;
        ctx.body = validationError.message;
        return;
      }
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
      const assResult = assignmentCriterias.map((f) => {
        if (f.function(person)) {
          return f.index;
        } else {
          return -1;
        }
      });
      const validCriterias = assResult.filter((e) => e != -1);
      console.log(validCriterias);
      //Step 4 (SQL) - Update de cupo libre
      //Step 5 (Bull) - Llamada a MQ
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5004);
  }
};
