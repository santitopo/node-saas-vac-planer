const Queue = require('bull');
const http = require('http');
const axios = require('axios');
const reservations = new Queue('Reservations');

module.exports = class ConfirmReservationService {
    constructor() {
        this.init();
    }

    async sendReservation(reservation) {
        try {
          const response = await axios.post(
            "http://localhost:5007/sms"
          , reservation
          );
          return response.data;
        } catch (error) {
          return null;
        }
      }

    init(){
        console.log("toy aca init")
        reservations.process(async (job) => {
            //pego a la base

            //pego a la sms api
            this.sendReservation(job.data)

            /*try {
                console.log("toy aca ")
                const postReq = await http.request({
                  host: 'localhost',port: "5007",path: '/sms',headers: {'Content-Type': 'application/json'},method: "POST"}
                  , function(response) {
                  var str = '';
                  response.on('data', function (chunk) {
                    str += chunk;
                  });
                  response.on('end', function () {
                    return str
                  });
                  
                })
                  reservation.timestampI = Date.now()
                  postReq.write(JSON.stringify(job.data))
                  postReq.end()
              } catch (error) {
                console.log(error, counter)
              }*/
        });
    }
}