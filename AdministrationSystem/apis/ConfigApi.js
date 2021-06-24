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
const config = require("../../config.json")
const ConfigPort = config.ConfigApiPort

module.exports = class ConfigApi {
  constructor(countryDataAccess, logger) {
    this.logger = logger;
    this.countryDataAccess = countryDataAccess;
    this.init();
  }

  init() {
    const app = new Koa();
    const router = new Router();
    const authController = new AuthenticationController(this.logger);
    const reservationField = new ReservationFieldController(this.logger);
    const assignmentCriteria = new AssignmentCriteriaController(
      this.countryDataAccess, this.logger
    );
    const stateController = new StateController(this.countryDataAccess, this.logger);
    const zoneController = new ZoneController(this.countryDataAccess, this.logger);
    const vacCenterController = new VacCenterController(this.countryDataAccess, this.logger);
    const vaccineController = new VaccineController(this.countryDataAccess, this.logger);
    const slotController = new SlotController(this.countryDataAccess, this.logger);
    const vaccinationPeriodController = new VaccinationPeriodController(
      this.countryDataAccess,
      slotController,
      this.logger
    );

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
        .then((data) => { ctx.response.status = 200, ctx.response.body = data })
        .catch(() => {
          this.logger.logError("Error eliminando el criterio de asignacion")
          { ctx.response.status = 400, ctx.response.body = "Error eliminando el criterio de asignacion" }
        })
    });
    router.post("/vaccine_act", async (ctx, next) => {
      try {
        const token = ctx.request.headers["authorization"].split("Bearer ")[1];
        const hasPermission = await authController.checkPermissions(token, [
          "give_vaccine",
        ]);
        if (!hasPermission) {
          ctx.response.body = "Unauthorized";
          ctx.response.status = 401;
          return;
        }

        const res = await vaccineController.giveVaccine(ctx.request.body);
        ctx.response.body = res.body;
        ctx.response.status = res.status;
      } catch {
        ctx.response.body = "Error del servidor. Intentelo nuevamente";
        ctx.response.status = 500;
      }
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
          this.logger.logInfo(`Creado correctamente el estado ${ctx.request.body.name}`)
      }).catch(() => {
          ctx.response.body = "Ocurrio un error, recuerda que state code debe ser unico",
          ctx.request.status = 400
          this.logger.logError(`Error creando el estado ${ctx.request.body.name}`)
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
            this.logger.logInfo(`Creado correctamente la zona ${ctx.request.body.name}`)
        }).catch((e) => {
          ctx.response.body = "Ocurrio un error, recuerda que un state con el codgio provisto debe existir";
          ctx.response.status = 400;
          this.logger.logError(`Error creando la zona ${ctx.request.body.name}`)
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
            this.logger.logInfo(`Creado correctamente el vacunatorio ${ctx.request.body.name}`)
        }).catch((e) => {
          ctx.response.body = "Ocurrio un error, recuerda que una zone con el codigo provisto debe existir",
            ctx.response.status = 400
            this.logger.logError(`Error creando el vacunatorio ${ctx.request.body.name}`)
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
            this.logger.logInfo(`Creado correctamente la vacuna ${ctx.request.body.name}`)
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
            this.logger.logError(`Error creando la vacuna ${ctx.request.body.name}`)
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
            this.logger.logInfo(`Creado correctamente el periodo de vacunacion para vacunatorio ${ctx.request.body.name}`)
        })
        .catch((e) => {
          ctx.response.body = 'Ocurrio un error, recuerda que un vac center con el codigo provisto debe existir, tambien lo deben hacer assignment criteria, vaccine, zone y state code',
            ctx.response.status = 400
            this.logger.logError(`Error creando el periodo de vacunacion para vacunatorio ${ctx.request.body.vac_center_id}`)
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
      const res = await stateController.deleteAState(ctx.params.code).then((data) => {
        if (data == 0) {
          ctx.response.body = "No existe estado con ese codigo",
            ctx.response.status = 400
        } else {
          ctx.response.body = "Borrado satisfactoriamente",
            ctx.response.status = 200
            this.logger.logInfo(`Estado ${ctx.params.code} borrado correctamente`)
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error borrando el estado",
          ctx.response.status = 400
          this.logger.logError(`Error borrando estado ${ctx.params.code}`)
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
        if (data == 0) {
          ctx.response.body = "Ocurrio un error, recuerda que una zone con el codgio provisto debe existir",
            ctx.response.status = 400
        } else {
          ctx.response.body = "Borrado satisfactoriamente",
            ctx.response.status = 200
            this.logger.logInfo(`Zona ${ctx.params.id} borrada correctamente`)
        }

      }).catch((e) => {
        ctx.response.body = "Ocurrio un error borrando la zona",
          ctx.response.status = 400
          this.logger.logError(`Error borrando zona ${ctx.params.id}`)
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
        if (data == 0) {
          ctx.response.body = "Ocurrio un error, recuerda que un vac center con el codigo provisto debe existir",
            ctx.response.status = 400
        } else {
          ctx.response.body = "Borrado satisfactoriamente",
            ctx.response.status = 200
            this.logger.logInfo(`Vacunatorio ${ctx.params.id} borrado correctamente`)
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error borrando el vacunatorio",
          ctx.response.status = 400
          this.logger.logError(`Error borrando vacunatorio ${ctx.params.id}`)
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
        if (data == 0) {
          ctx.response.body = "Ocurrio un error, recuerda que una vaccine con el codigo provisto debe existir",
            ctx.response.status = 400
        } else {
          ctx.response.body = "Borrado satisfactoriamente",
            ctx.response.status = 200
            this.logger.logInfo(`Vacuna ${ctx.params.id} borrada correctamente`)
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error borrando la vacuna",
          ctx.response.status = 400
          this.logger.logError(`Error borrando vacuna ${ctx.params.id}`)
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
        if (data == 0) {
          ctx.response.body = "Ocurrio un error, recuerda que un vaccination con el codigo provisto debe existir",
            ctx.response.status = 400
        } else {
          ctx.response.body = "Borrado satisfactoriamente",
            ctx.response.status = 200
            this.logger.logInfo(`Periodo de vacunacion borrado correctamente`)
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un vaccination con el codigo provisto debe existir",
          ctx.response.status = 400
          this.logger.logError(`Error borrando periodo de vacunacion`)
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
            this.logger.logInfo(`Estado ${ctx.params.code} modificado correctamente`)
        } else {
          ctx.response.body = "No se actualizo, recuerda que un state con el codigo provisto debe existir",
            ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un state con el codigo provisto debe existir",
          ctx.response.status = 400
          this.logger.logError(`Error modificando estado ${ctx.params.code}`)
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
            this.logger.logInfo(`Zona ${ctx.params.id} modificada correctamente`)
        } else {
          ctx.response.body = "No se actualizo, recuerda que una zone con el codigo provisto debe existir",
            ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que una zone con el codigo provisto debe existir",
          ctx.response.status = 400
          this.logger.logError(`Error modificando zona ${ctx.params.id}`)
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
            this.logger.logInfo(`Vacunatorio ${ctx.params.id} modificada correctamente`)
        } else {
          ctx.response.body = "No se actualizo, recuerda que un vac center con el codigo provisto debe existir",
            ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un vac center con el codigo provisto debe existir",
          ctx.response.status = 400
          this.logger.logError(`Error modificando vacunatorio ${ctx.params.id}`)
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
            this.logger.logInfo(`Vacuna ${ctx.params.id} modificada correctamente`)
        } else {
          ctx.response.body = "No se actualizo, recuerda que una vaccine con el codigo provisto debe existir",
            ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que una vaccine con el codigo provisto debe existir",
          ctx.response.status = 400
          this.logger.logError(`Error modificando vacuna ${ctx.params.id}`)
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
            this.logger.logInfo(`Periodo de vacunacion modificado correctamente`)
        } else {
          ctx.response.body = "No se actualizo, recuerda que un state con el codigo provisto debe existir",
            ctx.response.status = 400
        }
      }).catch((e) => {
        ctx.response.body = "Ocurrio un error, recuerda que un vaccination period con el codigo provisto debe existir",
          ctx.response.status = 400
          this.logger.logError(`Error modificando periodo de vacunacion`)
      });
    });

    router.post("/dnicenter", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "api_crud",
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
            this.logger.logInfo(`Servicio de registro civil ${ctx.request.body.url} agregado correctamente`)
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
            this.logger.logError(`Error agregando servicio de registro civil ${ctx.request.body.url}`)
        });
    });

    //SMS
    router.post("/smsservice", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "api_crud",
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
            this.logger.logInfo(`Servicio mensajeria ${ctx.request.body.url} agregado correctamente`)
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
            this.logger.logError(`Error agregando servicio de mensajeria ${ctx.request.body.url}`)
        });
    });
    router.delete("/smsservice", async (ctx, next) => {
      const token = ctx.request.headers["authorization"].split("Bearer ")[1];
      const hasPermission = await authController.checkPermissions(token, [
        "api_crud",
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
            this.logger.logInfo(`Servicio mensajeria ${ctx.request.body.url} borrado correctamente`)
        })
        .catch((e) => {
          ctx.response.body = "Ocurrio un error",
            ctx.response.status = 400
            this.logger.logError(`Error borrando servicio de mensajeria ${ctx.request.body.url}`)
        });
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    app.listen(ConfigPort);
  }
};
