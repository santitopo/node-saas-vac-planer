const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const AssignmentCriterias = require("../services/assignmentCriterias");
const MQReservations = require("../communication/mqReservations");
const uniqid = require("uniqid");
const ReservationController = require("../controller/ReservationController");

module.exports = class ReservationApi {
  constructor() {
    this.init();
  }

  init() {
    const app = new Koa();
    const router = new Router();
    const assignmentCriterias = new AssignmentCriterias();
    const mq = new MQReservations();
    const reservationController = new ReservationController();

    app.use(bodyParser());
    app.use(logger());
    router.post("/reservations", async (ctx, next) => {
      //Step 1 - Validators
      let err;
      err = reservationController.runValidations(ctx.request.body);
      if (err) {
        ctx.status = err.status;
        ctx.body = err.body;
        return;
      }
      //Step 2 - Request a Registro Civil (Deberian ser apis dinamicamente cargadas)
      const person = await reservationController.fetchPerson(
        ctx.request.body.id
      );
      if (!person) {
        ctx.body = "No se encontró la cédula provista";
        ctx.status = 400;
        return;
      }
      //Step 3 (Redis) - Aplicar todos los criterios de asignacion para obtener array con ids de criterios aplicables
      const updatedCriterias = assignmentCriterias.getUpdatedCriterias();

      const resultArray = updatedCriterias.map((f) => {
        if (f.function(person)) {
          return f.index;
        } else {
          return -1;
        }
      });
      const validCriterias = resultArray.filter((e) => e != -1);
      console.log("the criterias are ", validCriterias);
      //Step 4 (SQL) - Update de cupo libre
      const cupo = {
        fk_periodo_vacunacion: 5,
        fk_tabla_cupo: 8,
        turno: 1, //si no se pudo asignar esto viene null
        departamento: "app",
        zona: "hh",
        barrio: "dd",
      };
      // Step 5
      //Objeto MQ
      let codigo_reserva = uniqid();
      const mq_reservation = {
        dni: person.DocumentId,
        codigo_reserva: codigo_reserva,
        concretada: cupo ? true : false,
        fk_periodo_vacunacion: cupo ? cupo.fk_periodo_vacunacion : null,
        fk_tabla_cupo: cupo ? cupo.fk_tabla_cupo : null,
        date: ctx.request.body.reservation_date,
        turno: cupo ? cupo.turno : ctx.request.body.turno,
      };

      mq.add(mq_reservation);

      // If pudo reservar ->  Dejo la reserva con cupo en la MQ
      if (true) {
        ctx.response.body = {
          dni: person.id,
          codigo_reserva: codigo_reserva,
          departamento: 0,
          zona: 0,
          codigo_vacunatorio: 0,
          date: ctx.request.body.reservation_date,
          turno: 1,
          timestampI: new Date(ctx.request.body.timestampI).toISOString(),
          timestampR: new Date(Date.now()).toISOString(),
          timestampD:
            Date.now() - new Date(ctx.request.body.timestampI) + " ms",
        };
        ctx.status = 200;
      } else {
        ctx.response.body = {
          codigo_reserva: codigo_reserva,
          mensaje: "La solicitud se asignara cuando se asignen nuevo cupos.", //sacar del config
          timestampI: ctx.request.body.timestampI,
          timestampR: Date.now(),
          timestampD: Date.now() - timestampI,
        };
        ctx.status = 200;
      }
    });
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5004);
  }
};
