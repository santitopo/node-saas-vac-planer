var fs = require("fs");
var csv = require("csv");
var axios = require("axios").default;

const dataset = [];
let counter = 0;
async function reservationRequest(reservation, counter) {
  try {
    return axios.post("http://localhost:5004/reservations", reservation)
  } catch (error) {
    console.log(error, counter)
  }
}

var readStream1 = fs.createReadStream("./firstDataset.csv");
var readStream2 = fs.createReadStream("./secondDataset.csv");
var readStream3 = fs.createReadStream("./thirdDataset.csv");

var parser = csv.parse({ columns: true, delimiter: "|" });

parser.on("readable", function () {
  while ((record = parser.read())) {
    const reservationObject = {
      id: record.DocumentId,
      phone: record.Cellphone,
      reservationDate: record.ReservationDate,
      turn: record.Schedule,
      stateCode: record.State,
      zoneCode: record.Zone,
      lastname: "aaabbb",
      pin: "123",
    };
    dataset.push(reservationObject);
  }
});

parser.on("error", function (err) { });

parser.on("finish", function () {
  initApi();
});

readStream1.pipe(parser);
//readStream2.pipe(parser);
//readStream3.pipe(parser);

const initApi = () => {
  console.log("finish init");
  const loop = () => {
    const reservation = dataset[counter];
    reservation.timestampI = Date.now();
    reservationRequest(reservation, counter).then((res) => {
      console.log(res.data, counter);
      counter++;
      loop();
    }).catch((error) => {
      console.log(error.response.data, counter)
      counter++;
      loop();
    })
  }

  loop();
  // dataset.forEach((r) => {
  //   if(counter < 4000) {
  //     counter++;
  //     reservationRequest(r, counter);
  //   }
  // });
};
