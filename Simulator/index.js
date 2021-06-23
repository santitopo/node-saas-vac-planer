var fs = require("fs");
var csv = require("csv");
var axios = require("axios").default;
var Bottleneck = require("bottleneck");


const limiter = new Bottleneck({
  maxConcurrent: null,
  minTime: 1
});

const dataset = [];
let counter = 0;
async function reservationRequest(reservation, counter) {
  try {
    const res = await limiter.schedule(() => {
      reservation.timestampI = Date.now();
      return axios.post("http://localhost:5004/reservations", reservation)}
      )
    console.log(res.data.timestampD, counter);
  } catch (error) {
    console.log(error.response.data)
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

  dataset.forEach((r)=> {
    const reservation = r;
      reservationRequest(reservation, counter);
      counter++;
  })
};
