const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let campo1 = {};
let campo2 = {};
let Reservation = {};
rl.question("Campo Validador? ", function (func) {
  rl.question("Campo Validador 2? ", function (func2) {
    rl.question("Reservation? ", function (res) {
      campo1.func = func;
      campo2.func = func2;
      Reservation = JSON.parse(res);
    });
  });
});

setTimeout(() => {
  // 1. Guardar campos cuando el tecnico crea el plan de vacunacion (Limitar exposición)

  // let campo1 = { name: "pin", func: "return res.pin.length==4" };
  // let campo2 = { name: "age", tipo: "Integer", func: "return res.age>=18" };
  const campos = [campo1, campo3];

  // 2. Cuando entra una reserva, primero valido cosas de todos los paises
  // const Reservation = {"age":"18","pin":"1234"};

  // 3. Luego iteramos sobre todos los campos del pais ejecutando todas las validaciones
  const resultados = campos.map((campo) => {
    let funcion = new Function("res", campo.func);
    return funcion(Reservation);
  });

  console.log(resultados);
  ////
}, 30000);

rl.on("close", function () {
  console.log("\nBYE BYE !!!");
  process.exit(0);
});
