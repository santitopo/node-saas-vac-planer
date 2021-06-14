const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const Pipes = require("../pipeline/pipes");
const axios = require("axios");
const AssignmentCriterias = require("../services/assignmentCriterias");
const mqReservations = require("../communication/mqReservations");
const MQReservations = require("../communication/mqReservations");
const uniqid = require("uniqid");

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
      const cupo ={
        fk_periodo_vacunacion: 5,
        fk_tabla_cupo: 8,
        turno: 1, //si no se pudo asignar esto viene null
        departamento: "app",
        zona: "hh",
        barrio : "dd"
      }
      // Step 5     
      //Objeto MQ
      let codigo_reserva = uniqid()
      const mq_reservation =
      {
        dni: person.DocumentId,
        codigo_reserva: codigo_reserva,
        concretada: cupo?true : false,
        fk_periodo_vacunacion: cupo?cupo.fk_periodo_vacunacion:null,
        fk_tabla_cupo: cupo?cupo.fk_tabla_cupo:null, 
        date: ctx.request.body.reservation_date,
        turno: cupo?cupo.turno:ctx.request.body.turno
      }

      
      mq.add(mq_reservation);

      // If pudo reservar ->  Dejo la reserva con cupo en la MQ
      if(true){
        ctx.response.body = 
        {
          dni : person.id,
          codigo_reserva: codigo_reserva,
          departamento: 0,
          zona: 0, 
          codigo_vacunatorio: 0, 
          date: ctx.request.body.reservation_date,
          turno: 1, 
          TimestampI : ctx.request.body.TimestampI,
          TimestampR : Date.now(),
          TimestampD : Date.now()-new Date(ctx.request.body.TimestampI)
        }
      }else{
        ctx.response.body = 
        {
          codigo_reserva: codigo_reserva,
          mensaje: "La solicitud se asignara cuando se asignen nuevo cupos.", //sacar del config
          TimestampI : ctx.request.body.TimestampI,
          TimestampR : Date.now(),
          TimestampD : Date.now()-TimestampI
        }
      }      
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5004);
  }
};
