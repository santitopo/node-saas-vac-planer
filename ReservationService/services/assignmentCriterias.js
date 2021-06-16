const redis = require("redis");

module.exports = class AssignmentCriterias {
  constructor() {
    this.client = redis.createClient();
    this.client.on("error", function (err) {
      console.log("CRITICAL ERROR: LOST CONNECTION TO REDIS ");
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
  clientGet = (message) => {
    return new Promise((fullfill, reject) => {
      this.client.get(message, (err, data) => {
        if (err) reject(err);
        else fullfill(data);
      });
    });
  };
  getCriterias = () => {
    this.clientGet("assignmentCriterias")
      .then((arr) => {
        console.log("Trayendo ultimos criterios de asignación...");
        this.loadFunctions(JSON.parse(arr));
      })
      .catch((err) => {
        console.log("HOLA");
        console.log(err);
      });
  };
  init() {
    this.getCriterias();
    setInterval(() => {
      this.getCriterias();
    }, 5000);
  }
};
