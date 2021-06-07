// Este servicio permite cargar nuevos filtros a redis. Debería sustituirse por un servicio que levante
// los filtros de la base de datos cada cierto tiempo y los impacte en Redis
const redis = require("redis");
const client = redis.createClient();
client.set(
  "assignmentCriterias",
  JSON.stringify([
    {
      function:
        "new Date().getFullYear() - new Date(person.DateOfBirth).getFullYear() > 50",
      index: 28,
    },
    { function: "person.Priority == 1", index: 33 },
    { function: "person.DocumentId[0] == 1", index: 39 },
  ]),
  () => console.log("nuevos criterios de asignacion cargados")
);
