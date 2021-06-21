const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const jwt = require("koa-jwt");
const publicKey = fs.readFileSync("services/config/public.key", "utf8");
const ReservationFieldController = require("../controller/ReservationFieldController");
const AssignmentCriteriaController = require("../controller/AssignmentCriteriaController");
const StateController = require("../controller/StateController");
const ZoneController = require("../controller/ZoneController");
const VacCenterController = require("../controller/VacCenterController");
const VaccineController = require("../controller/VaccineController");
const VaccinationPeriodController = require("../controller/VaccinationPeriodController");
const SlotController = require("../controller/SlotController");
const AuthenticationController = require("../controller/AuthenticationController");

module.exports = class ConfigApi {
  constructor(countryDataAccess) {
    this.countryDataAccess = countryDataAccess;
    this.init();
  }

  init() {
    const app = new Koa();
    const router = new Router();
    const authController = new AuthenticationController();
    const reservationField = new ReservationFieldController();
    const assignmentCriteria = new AssignmentCriteriaController(
      this.countryDataAccess
    );
    const stateController = new StateController(this.countryDataAccess);
    const zoneController = new ZoneController(this.countryDataAccess);
    const vacCenterController = new VacCenterController(this.countryDataAccess);
    const vaccineController = new VaccineController(this.countryDataAccess);
    const slotController = new SlotController(this.countryDataAccess);
    const vaccinationPeriodController = new VaccinationPeriodController(
      this.countryDataAccess,
      slotController
    );

    app.use(jwt({ secret: publicKey, algorithms: ["RS256"] }));
    app.use(bodyParser());
    app.use(logger());
    app.use(jwt({ secret: publicKey, algorithms: ["RS256"] }));

    router.post("/reservationfields", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "validation_add",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      reservationField.add(ctx, next);
    });
    router.post("/assignmentCriteria", async (ctx, next) => {
      //Step 1 - Agregar a la bd y recuperar el id
      const id = await this.countryDataAccess.addCriteria(
        ctx.request.body.function
      );
      let success = null;
      if (id) {
        //Step 2 - Agregar a Redis para mantener sincronizado
        success = await assignmentCriteria.addRedis(ctx, id, next);
      }
      if (!success) {
        ctx.body = {
          response: "Error agregando el criterio de asignacion",
        };
        ctx.status = 400;
        return;
      }
      ctx.body = {
        response: "Agregado correctamente el criterio de asignacion",
      };
      ctx.status = 200;
    });

    //POSTS
    router.post("/testData", async (ctx, next) => {
      await assignmentCriteria.setTestData();
      ctx.body = {
        response: "Datos de Prueba agregados",
      };
      ctx.status = 200;
      return;
    });

    router.post("/states", async (ctx, next) => {
      ctx.response.body = await stateController.addStates(ctx.request.body);
    });
    router.post("/zones", async (ctx, next) => {
      await zoneController
        .addZones(ctx.request.body)
        .then((data) => (ctx.response.body = data))
        .catch((e) => (ctx.response.body = "stateCode no existe"));
    });
    router.post("/vaccenters", async (ctx, next) => {
      await vacCenterController
        .addVacCenters(ctx.request.body)
        .then((data) => (ctx.response.body = data))
        .catch((e) => (ctx.response.body = "zoneId no existe"));
    });
    router.post("/vaccines", async (ctx, next) => {
      await vaccineController
        .addVaccines(ctx.request.body)
        .then((data) => (ctx.response.body = data))
        .catch((e) => (ctx.response.body = "zoneId no existe"));
    });
    router.post("/vaccinationperiods", async (ctx, next) => {
      await vaccinationPeriodController
        .addVaccinationPeriod(ctx.request.body)
        .then((data) => (ctx.response.body = data))
        .catch((e) => (ctx.response.body = e));
    });
    router.post("/slots", async (ctx, next) => {
      await slotController
        .addSlot(ctx.request.body)
        .then((data) => (ctx.response.body = data))
        .catch((e) => (ctx.response.body = e));
    });

    //GET ALL
    router.get("/states", async (ctx, next) => {
      const res = await stateController.getStates();
      ctx.response.body = res;
    });
    router.get("/zones", async (ctx, next) => {
      const res = await zoneController.getZones();
      ctx.response.body = res;
    });
    router.get("/vaccenters", async (ctx, next) => {
      const res = await vacCenterController.getVacCenters();
      ctx.response.body = res;
    });
    router.get("/vaccines", async (ctx, next) => {
      const res = await vaccineController.getVaccines();
      ctx.response.body = res;
    });
    router.get("/vaccinationperiods", async (ctx, next) => {
      const res = await vaccinationPeriodController.getVaccinationPeriods();
      ctx.response.body = res;
    });
    router.get("/slots/0", async (ctx, next) => {
      console.log("here");
      const res = await slotController.getSlots();
      ctx.response.body = res;
    });

    //GET
    router.get("/states/:code", async (ctx, next) => {
      const res = await stateController.getAState(ctx.params.code);
      ctx.response.body = res;
    });
    router.get("/zones/:id", async (ctx, next) => {
      const res = await zoneController.getAZone(ctx.params.id);
      ctx.response.body = res;
    });
    router.get("/vaccenters/:id", async (ctx, next) => {
      const res = await vacCenterController.getAVacCenter(ctx.params.id);
      ctx.response.body = res;
    });
    router.get("/vaccines/:id", async (ctx, next) => {
      const res = await vaccineController.getAVaccine(ctx.params.id);
      ctx.response.body = res;
    });
    router.get("/vaccinationperiods/:id", async (ctx, next) => {
      const res = await vaccinationPeriodController.getAVaccinationPeriod(
        ctx.params.id
      );
      ctx.response.body = res;
    });
    router.get("/slots", async (ctx, next) => {
      const res = await slotController.getASlot(ctx.request.body);
      ctx.response.body = res;
    });

    //DELETE
    router.delete("/states/:code", async (ctx, next) => {
      const res = await stateController.deleteAState(ctx.params.code);
      if (res) {
        ctx.response.body = "Eliminada satisfactoriamente";
      } else {
        ctx.response.body = "No se pudo eliminar, el codigo no existe";
      }
    });
    router.delete("/zones/:id", async (ctx, next) => {
      const res = await zoneController.deleteAZone(ctx.params.id);
      if (res) {
        ctx.response.body = "Eliminada satisfactoriamente";
      } else {
        ctx.response.body = "No se pudo eliminar, el codigo no existe";
      }
    });
    router.delete("/vaccenters/:id", async (ctx, next) => {
      const res = await vacCenterController.deleteAVacCenter(ctx.params.id);
      if (res) {
        ctx.response.body = "Eliminada satisfactoriamente";
      } else {
        ctx.response.body = "No se pudo eliminar, el codigo no existe";
      }
    });
    router.delete("/vaccines/:id", async (ctx, next) => {
      const res = await vaccineController.deleteAVaccine(ctx.params.id);
      if (res) {
        ctx.response.body = "Eliminada satisfactoriamente";
      } else {
        ctx.response.body = "No se pudo eliminar, el codigo no existe";
      }
    });
    router.delete("/vaccinationperiods/:id", async (ctx, next) => {
      const res = await vaccinationPeriodController.deleteAVaccinationPeriod(
        ctx.params.id
      );
      if (res) {
        ctx.response.body = "Eliminada satisfactoriamente";
      } else {
        ctx.response.body = "No se pudo eliminar, el codigo no existe";
      }
    });
    router.delete("/slots", async (ctx, next) => {
      const res = await slotController.deleteASlot(ctx.request.body);
      if (res) {
        ctx.response.body = "Eliminada satisfactoriamente";
      } else {
        ctx.response.body = "No se pudo eliminar, el codigo no existe";
      }
    });

    //UPDATE
    router.put("/states/:code", async (ctx, next) => {
      const res = await stateController.updateAState(
        ctx.params.code,
        ctx.request.body
      );
      if (res) {
        ctx.response.body = "Nombre modificado correctamente";
      } else {
        ctx.response.body = "No se pudo modificar, el codigo no existe";
      }
    });
    router.put("/zones/:id", async (ctx, next) => {
      const res = await zoneController.updateAZone(
        ctx.params.id,
        ctx.request.body
      );
      if (res) {
        ctx.response.body = "Nombre modificado correctamente";
      } else {
        ctx.response.body = "No se pudo modificar, el codigo no existe";
      }
    });
    router.put("/vaccenters/:id", async (ctx, next) => {
      const res = await vacCenterController.updateAVacCenter(
        ctx.params.id,
        ctx.request.body
      );
      if (res) {
        ctx.response.body = "Nombre modificado correctamente";
      } else {
        ctx.response.body = "No se pudo modificar, el codigo no existe";
      }
    });
    router.put("/vaccines/:id", async (ctx, next) => {
      const res = await vaccineController.updateAVaccine(
        ctx.params.id,
        ctx.request.body
      );
      if (res) {
        ctx.response.body = "Modificado correctamente";
      } else {
        ctx.response.body = "No se pudo modificar, el codigo no existe";
      }
    });
    router.put("/vaccinationperiods/:id", async (ctx, next) => {
      const res = await vaccinationPeriodController.updateAVaccinationPeriod(
        ctx.params.id,
        ctx.request.body
      );
      if (res) {
        ctx.response.body = "Modificado correctamente";
      } else {
        ctx.response.body = "No se pudo modificar, el codigo no existe";
      }
    });
    router.put("/slots", async (ctx, next) => {
      const res = await slotController.updateASlot(ctx.request.body);
      if (res) {
        ctx.response.body = "Modificado correctamente";
      } else {
        ctx.response.body = "No se pudo modificar, el codigo no existe";
      }
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5005);
  }
};
