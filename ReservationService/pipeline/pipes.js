var glob = require("glob");
var Pipeline = require("./direct-pipeline");

class Pipes {
  constructor(logger) {
    this.logger = logger;
    this.pipeline = new Pipeline();
    this.init();
  }

  filterLoading() {
    this.logger.logInfo("Actualizando Filtros de Reserva...");
    this.pipeline.reset();
    let module_dict = {};
    let files = glob.sync("./pipeline/filters/*.js");
    files.forEach(function (file) {
      let dash = file.split("/");
      if (dash.length == 4) {
        let dot = dash[3].split(".");
        if (dot.length == 2) {
          let key = dot[0];
          const path = `./filters/${dot[0]}`;
          module_dict[key] = require(path);
          delete require.cache[require.resolve(path)];
          module_dict[key] = require(path);
        }
      }
    });
    for (var key in module_dict) {
      if (module_dict.hasOwnProperty(key)) {
        if (this.pipeline.filters.indexOf(module_dict[key]) < 0) {
          this.pipeline.use(module_dict[key]);
        }
      }
    }
  }

  init = () => {
    this.filterLoading();
    setInterval(() => {
      this.filterLoading();
    }, 60000);
  };
}
module.exports = Pipes;
