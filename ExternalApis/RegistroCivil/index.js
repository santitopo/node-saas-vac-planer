var fs = require("fs");
var csv = require("csv");
const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

const population = {};

var readStream = fs.createReadStream("./population.csv");

var parser = csv.parse({ columns: true });

parser.on("readable", function () {
  while ((record = parser.read())) {
    population[record.DocumentId] = record;
  }
});

parser.on("error", function (err) {
  console.log(err.message);
});

parser.on("finish", function () {
  console.log("finish");
  initApi();
});

readStream.pipe(parser);

const initApi = () => {
  const app = new Koa();
  const router = new Router();

  app.use(bodyParser());
  app.use(logger());
  router.get("/people/:id", (ctx, next) => {
    if (population[ctx.params.id]) {
      ctx.status = 200;
      ctx.body = population[ctx.params.id];
    } else {
      ctx.status = 404;
      ctx.body = "La cedula no se encuentra en el registro civil";
    }
  });
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(5006);
};
