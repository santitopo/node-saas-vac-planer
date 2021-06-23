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
    router.delete("/reservationfields/:fieldname", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "validation_add",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      reservationField.delete(ctx);
    });

    router.post("/assignmentCriteria", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "assignment_criteria_add",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
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
    router.delete("/assignmentCriteria/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "assignment_criteria_add",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
       return await assignmentCriteria.deleteRedis(ctx.params.id)
      .then((data)=> {ctx.response.status = 200, ctx.response.body = data})
      .catch((e)=> {ctx.response.status = 400, ctx.response.body="Error eliminando el criterio de asignacion"})
    });

    //POSTS
    router.post("/states", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "state_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await stateController.addStates(ctx.request.body).then((data) => {
        ctx.response.body = data,
          ctx.response.status = 200
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que state code debe ser unico",
          ctx.request.status = 400
      });
    });
    router.post("/zones", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "zone_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await zoneController
        .addZones(ctx.request.body)
        .then((data) => {
          ctx.response.body = data,
            ctx.response.status = 200
        }).catch((e) => {
          ctx.response.body = "Ocurrio un error, recuerda que un state con el codgio provisto debe existir";
          ctx.response.status = 400;
        });
    });
    router.post("/vaccenters", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vac_center_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await vacCenterController
        .addVacCenters(ctx.request.body)
        .then((data) => {
          ctx.response.body = data,
            ctx.response.status = 200
        }).catch((e) => {
          ctx.response.body = "Ocurrio un error, recuerda que una zone con el codigo provisto debe existir",
            ctx.response.status = 400
        });
    });
    router.post("/vaccines", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vaccine_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await vaccineController
        .addVaccines(ctx.request.body)
        .then((data) => {
          ctx.response.body = data,
            ctx.response.status = 200
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
        });
    });
    router.post("/vaccinationperiods", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vac_period_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await vaccinationPeriodController
        .addVaccinationPeriod(ctx.request.body)
        .then((data) => {
          ctx.response.body = data,
            ctx.response.status = 200
        })
        .catch((e) => {
          ctx.response.body = 'Ocurrio un error, recuerda que un vac center con el codigo provisto debe existir, tambien lo deben hacer assignment criteria, vaccine, zone y state code',
            ctx.response.status = 400
        });
    });

    //DELETE
    router.delete("/states/:code", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "state_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await stateController.deleteAState(ctx.params.code).then((data) => {
        ctx.response.body = "Borrado satisfactoriamente",
          ctx.response.status = 200
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un state con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.delete("/zones/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "zone_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await zoneController.deleteAZone(ctx.params.id).then((data) => {
        ctx.response.body = "Borrado satisfactoriamente",
          ctx.response.status = 200
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que una zone con el codgio provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.delete("/vaccenters/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vac_center_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await vacCenterController.deleteAVacCenter(ctx.params.id).then((data) => {
        ctx.response.body = "Borrado satisfactoriamente",
          ctx.response.status = 200
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un vac center con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.delete("/vaccines/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vaccine_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await vaccineController.deleteAVaccine(ctx.params.id).then((data) => {
        ctx.response.body = "Borrado satisfactoriamente",
          ctx.response.status = 200
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que una vaccine con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.delete("/vaccinationperiods/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vac_period_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const res = await vaccinationPeriodController.deleteAVaccinationPeriod(ctx.params.id).then((data) => {
        ctx.response.body = "Borrado satisfactoriamente",
          ctx.response.status = 200
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un vaccination con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });

    //UPDATE
    router.put("/states/:code", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "state_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const res = await stateController.updateAState(ctx.params.code, ctx.request.body).then((data) => {
        if (data[0]) {
          ctx.response.body = "Actualizado satisfactoriamente",
          ctx.response.status = 200
        } else {
          ctx.response.body = "No se actualizo, recuerda que un state con el codigo provisto debe existir",
          ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un state con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.put("/zones/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "zone_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const res = await zoneController.updateAZone(ctx.params.id, ctx.request.body).then((data) => {
        if (data[0]) {
          ctx.response.body = "Actualizado satisfactoriamente",
          ctx.response.status = 200
        } else {
          ctx.response.body = "No se actualizo, recuerda que una zone con el codigo provisto debe existir",
          ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que una zone con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.put("/vaccenters/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vac_center_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const res = await vacCenterController.updateAVacCenter(ctx.params.id, ctx.request.body).then((data) => {
        if (data[0]) {
          ctx.response.body = "Actualizado satisfactoriamente",
          ctx.response.status = 200
        } else {
          ctx.response.body = "No se actualizo, recuerda que un vac center con el codigo provisto debe existir",
          ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un vac center con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.put("/vaccines/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vaccine_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const res = await vaccineController.updateAVaccine(ctx.params.id, ctx.request.body).then((data) => {
        if (data[0]) {
          ctx.response.body = "Actualizado satisfactoriamente",
          ctx.response.status = 200
        } else {
          ctx.response.body = "No se actualizo, recuerda que una vaccine con el codigo provisto debe existir",
          ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que una vaccine con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });
    router.put("/vaccinationperiods/:id", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vac_period_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      const res = await vaccinationPeriodController.updateAVaccinationPeriod(ctx.params.id, ctx.request.body).then((data) => {
        if (data) {
          ctx.response.body = "Actualizado satisfactoriamente",
          ctx.response.status = 200
        } else {
          ctx.response.body = "No se actualizo, recuerda que un state con el codigo provisto debe existir",
          ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un vaccination period con el codigo provisto debe existir",
          ctx.response.status = 400
      });
    });

    router.post("/dnicenter", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vaccine_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await this.countryDataAccess
        .addDniCenter(ctx.request.body)
        .then((data) => {
          ctx.response.body = data,
            ctx.response.status = 200
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
        });
    });

    //SMS
    router.post("/smsservice", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vaccine_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await this.countryDataAccess
        .addSMSService(ctx.request.body)
        .then((data) => {
          ctx.response.body = data,
            ctx.response.status = 200
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
        });
    });
    router.delete("/smsservice", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "vaccine_crud",
      ]);
      if (!hasPermission) {
        ctx.response.body = "Unauthorized";
        ctx.response.status = 401;
        return;
      }
      await this.countryDataAccess
        .deleteSMSService(ctx.request.body)
        .then((data) => {
          ctx.response.body = data,
            ctx.response.status = 200
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
        });
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(5005);
  }
};
