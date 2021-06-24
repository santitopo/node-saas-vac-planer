const redis = require("redis");

module.exports = class AssignmentCriterias {
  constructor(logger) {
    this.logger = logger;
    this.client = redis.createClient();
    this.client.on("error", function (err) {
      this.logger.logError("Error, se perdio la conexion con redis");
    });
    this.updatedCriterias = [];
    this.init();
  }
  getUpdatedCriterias = () => {
    return this.updatedCriterias;
  };
  template = (predicate) => {
    return `return (
              ${predicate}
            )`;
  };

  loadFunctions = (functionsArr) => {
    this.updatedCriterias = functionsArr.map((obj) => ({
      function: new Function("person", this.template(obj.function)),
      index: obj.index,
    }));
  };
  clientGet = (key) => {
    return new Promise((fullfill, reject) => {
      this.client.get(key, (err, data) => {
        if (err) reject(err);
        else fullfill(data);
      });
    });
  };
  getCriterias = () => {
    this.clientGet("assignmentCriterias")
      .then((arr) => {
        this.logger.logInfo("Trayendo ultimos criterios de asignación...");
        this.loadFunctions(JSON.parse(arr) || []);
      })
      .catch(() => {
        this.logger.logError("Error trayendo criterios de asignacion");
      });
  };
  init() {
    this.getCriterias();
    setInterval(() => {
      this.getCriterias();
    }, 5000);
  }
};
