const Queue = require("bull");
const axios = require("axios");

module.exports = class ConfirmReservationService {
    constructor(countryDataAccess) {
        this.countryDataAccess = countryDataAccess
        this.reservations = new Queue("Reservations");
        this.init();
    }

    init() {
        this.reservations.process(async (job, done) => {
            //pego a la base
            var reservation =
            {
                dni: job.data.dni,
                phone: job.data.phone,
                reservation_code: job.data.reservationCode,
                date: job.data.date,
                assigned: job.data.assigned,
                turn: job.data.turn,
                state_code: job.data.state_code,
                zone_id: job.data.zone_id,
                vaccination_period_id: job.data.vaccinationPeriodId
            }
            var res = await this.countryDataAccess.getAReservation(reservation.dni).then((data) => data).catch((e) => e)
            if (!res) {
                let reservation = await this.countryDataAccess.addReservation(job.data).then(data => data).catch((e) => e)
                console.log(reservation.dataValues)
            } else {
                console.log("Ya existe una reserva con esta dni")
            }
            done()
        });
    }
};
