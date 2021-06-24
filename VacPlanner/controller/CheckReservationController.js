module.exports = class CheckReservationController {
    constructor(countryDataAcces) {
        this.countryDataAcces = countryDataAcces;
    }

    async checkReservation(dni) {
        try {
            const result = await this.countryDataAcces.checkDniInReservations(dni);
            if(result.length === 0){
                return { body : "No hay reservas para la cedula provista", status: 200}
            }
            return { body: result, status: 200 };
        }
        catch {
            console.log(`Error consulta la reserva para la dni ${dni}`);
            return { body: "Error en la consulta", status: 500 }
        }
    }

    async deleteReservation(dni, reservationCode) {
        try {
            const result = await this.countryDataAcces.deleteReservation(dni, reservationCode);
            if(result === 0){
                return { body : "No hay reservas para la cedula y codigo provistos", status: 200}
            }
            console.log(`Se borro la reserva ${reservationCode} correctamente`)
            return { body: "Se borro la reserva correctamente", status: 200 };
        }
        catch {
            console.log(`Error borrando la reserva para la dni ${dni}`);
            return { body: "Error al borrar la reserva", status: 500 }
        }
    }
}