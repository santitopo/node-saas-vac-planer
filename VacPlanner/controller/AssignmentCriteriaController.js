const redis = require("redis");

module.exports = class AssignmentCriteriaController {
  constructor(countryDataAccess) {
    this.countryDataAccess = countryDataAccess;
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
      const allCriterias = (await this.getCriterias()) || [];
      //Agregar a redis
      allCriterias.push(newCriteria);
      await this.setCriterias(allCriterias);
      return "success";
    } catch (e) {
      console.log("Error agreagando criterio a redis");
      return null;
    }
  }
  async deleteRedis(id){
      //Ir a buscar a redis
      var allCriterias = (await this.getCriterias()) || [];
      //Agregar a redis
      if(allCriterias){
        let aux = allCriterias.filter(item => item.index == id)
        if(aux.length==0){
          return "No existse un criterio con ese id"
        }
        allCriterias = allCriterias.filter(item => item.index != id)
        await this.setCriterias(allCriterias);
        console.log(`Borrado correctamente el criterio ${id}`)
        return "Borrado satisfactoriamente"
      }
  }
};
