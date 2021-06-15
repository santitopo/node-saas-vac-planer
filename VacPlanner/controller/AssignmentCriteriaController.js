const redis = require("redis");

module.exports = class AssignmentCriteriaController {
  constructor() {
    this.init();
    this.client.on("error", () => console.log("abrazo"));
  }
  init = () => {
    try {
      this.client = redis.createClient();
    } catch {
      console.log("Servidor de Redis no responde..");
    }
  };
  clientGet = () => {
    return new Promise((fullfill, reject) => {
      this.client.get("assignmentCriterias", (err, data) => {
        if (err) reject(err);
        else fullfill(data);
      });
    });
  };
  clientSet = (arr) => {
    return new Promise((fullfill, reject) => {
      this.client.set(
        "assignmentCriterias",
        JSON.stringify(arr),
        (err, data) => {
          if (err) reject(err);
          else fullfill(data);
        }
      );
    });
  };
  getCriterias = async () => {
    try {
      const string = await this.clientGet();
      return JSON.parse(string);
    } catch (err) {
      throw new Exception("Error en el parseo trayendo criterios desde redis");
    }
  };

  setCriterias = async (arr) => {
    try {
      await this.clientSet(arr);
      return;
    } catch (err) {
      throw new Exception("Error en el seteo de criterios en redis");
    }
  };

  async addRedis(ctx, id, next) {
    try {
      const newCriteria = {
        function: ctx.request.body.function,
        index: id,
      };
      //Ir a buscar a redis
      const allCriterias = await this.getCriterias();
      //Agregar a redis
      allCriterias.push(newCriteria);
      await this.setCriterias(allCriterias);
      return "success";
    } catch (e) {
      console.log(e);
      return null;
    }
  }
};