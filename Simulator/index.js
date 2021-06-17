var fs = require("fs");
var csv = require("csv");
var axios = require("axios");

const dataset = [];
var counter = 0;
async function reservationRequest(reservation, counter) {
    try {
      const response =await axios.post(
        "http://localhost:5004/reservations", reservation
      );
      //console.log(response)
      return response.data;
    } catch (error) {
      console.log(error.response.data, counter)
      return null;
    }
}

var readStream1 = fs.createReadStream("./firstDataset.csv");
var readStream2 = fs.createReadStream("./secondDataset.csv");
var readStream3 = fs.createReadStream("./thirdDataset.csv");

var parser = csv.parse({ columns: true, delimiter: "|"});

parser.on("readable", function () {
    while (record = parser.read()) {
      if(record.DocumentId && record.Cellphone && record.ReservationDate && record.Schedule && record.State && record.Zone){
        const reservationObject = {
            "id": record.DocumentId,
            "cellphone": record.Cellphone,
            "date": record.ReservationDate,
            "turno": record.Schedule,
            "estado": record.State,
            "zone": record.Zone,
            "lastname": "aaabbb",
            "pin":"123",
            "timestampI": Date.now()
        }
        dataset.push(reservationObject)
      }
    }
});

parser.on("error", function (err) {
  console.log(err.data);
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

  dataset.forEach(r => {
    if(counter<500){
      counter++
      reservationRequest(r, counter)
    }
  })
  

};
