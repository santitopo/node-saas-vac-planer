var fs = require("fs");
var csv = require("csv");
var axios = require("axios")

const dataset = [];

async function reservationRequest(reservation) {
    try {
      const response = await axios.post(
        "http://localhost:5004/reservations", reservation
      );
      console.log(response.data)
      return response.data;
    } catch (error) {
      console.log(error)
      return null;
    }
}

var readStream1 = fs.createReadStream("./firstDataset.csv");
var readStream2 = fs.createReadStream("./secondDataset.csv");
var readStream3 = fs.createReadStream("./thirdDataset.csv");

var parser = csv.parse({ columns: true, delimiter: "|"});

parser.on("readable", function () {
    while (record = parser.read()) {
        const reservationObject = {
            "id": record.DocumentId,
            "cellphone": record.Cellphone,
            "date": record.ReservationDate,
            "turno": record.Schedule,
            "estado": record.State,
            "zone": record.Zone
        }
        dataset.push(reservationObject)
    }
});

parser.on("error", function (err) {
  console.log(err.message);
});

parser.on("finish", function () {
  console.log("finish");
  console.log(dataset.length)
  initApi();
});

readStream1.pipe(parser);
//readStream2.pipe(parser);
//readStream3.pipe(parser);

const initApi = () => {
  console.log("finish init")
  dataset.forEach(r => reservationRequest(r))
};
