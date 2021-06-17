var fs = require("fs");
var csv = require("csv");
var http = require("http")

const dataset = [];
var counter = 0;
async function reservationRequest(reservation, counter) {
    try {
      const postReq =  http.request({
        host: 'localhost',
        port: "5004",
        path: '/reservations',
        headers: {
          'Content-Type': 'application/json'
      },
        method: "POST"
      }, function(response) {
        var str = '';
        response.on('data', function (chunk) {
          str += chunk;
        });
        response.on('end', function () {
          return str
        });
        
      })
        reservation.timestampI = Date.now()
        postReq.write(JSON.stringify(reservation))
        postReq.end()
    } catch (error) {
      console.log(error, counter)
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
          "zone": record.Zone,
          "lastname": "aaabbb",
          "pin":"123"
      }
      dataset.push(reservationObject)
    }
});

parser.on("error", function (err) {
});

parser.on("finish", function () {
  initApi();
});

readStream1.pipe(parser);
//readStream2.pipe(parser);
//readStream3.pipe(parser);

const initApi = () => {
  console.log("finish init")
  
  dataset.forEach(r => {
    if(counter<100){
      counter++
      reservationRequest(r, counter)
    }
  })
};
