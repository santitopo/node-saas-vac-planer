var glob = require("glob");
var Pipeline = require("./direct-pipeline");

class Pipes {
  constructor() {
    this.pipeline = new Pipeline();
    this.init();
  }

  filterLoading() {
    console.log("Cargando filtros nuevamente..");
    this.pipeline.reset();
    let module_dict = {};
    let files = glob.sync("./pipeline/filters/*.js");
    files.forEach(function (file) {
      let dash = file.split("/");
      if (dash.length == 4) {
        let dot = dash[3].split(".");
        if (dot.length == 2) {
          let key = dot[0];
          module_dict[key] = require(`./filters/${dot[0]}`);
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
    }, 15000);

    this.pipeline.on("error", (err) => {
      //  console.log(`${err}`);
    });

    this.pipeline.on("end", (result) => {
      // console.log(result);
    });
  };
}
module.exports = Pipes;
