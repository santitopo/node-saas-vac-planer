const SlotController = require("./SlotController");
const moment = require('moment');
const axios = require('axios')

module.exports = class VaccinationPeriodController {
    constructor(countryDataAcces, slotController) {
        this.countryDataAcces = countryDataAcces;
        this.slotController = slotController;
    }

    template = (predicate) => {
        return `return (
                  ${predicate}
                )`;
    };

    async fetchPerson(personId) {
        try {
            const response = await axios.get(
                "http://localhost:5006/people/" + personId
            );
            return response.data;
        } catch (error) {
            return null;
        }
    }

    parseDate(reservationDate) {
        const newDate = moment(reservationDate);

        if (newDate.isValid()) {
            const year = newDate.year();
            const month = (newDate.month() + 1).toString().length == 1 ? "0" + (newDate.month() + 1) : (newDate.month() + 1)
            const day = newDate.date().toString().length == 1 ? "0" + newDate.date() : newDate.date();

            const parsedDate = year + "-" + month + "-" + day;
            return parsedDate;
        }
    }

    async realocateReservations(date, turn, vp, amountToAdd) {
        let amountToReturn = amountToAdd;
        let id = vp.vac_center_id;
        let vc = await this.countryDataAcces.getAVacCenter(id)
        let zone_id = vc.zone_id
        let state_code = await this.countryDataAcces.getAZone(zone_id)
        state_code = state_code[0].dataValues.state_code
        let parseDate = this.parseDate(date)
        let today = this.parseDate(new Date()) + ' 23:59:59'
        let listReservations = await this.countryDataAcces.getReservations(zone_id, state_code, `${parseDate} 00:00:00`, `${parseDate} 23:59:59`, turn, today)
        listReservations = listReservations.rows
        let criteria = JSON.parse(await this.countryDataAcces.getACriteria(vp.assignment_criteria_id))[0]
        const fun = new Function("person", this.template(criteria.function))
        console.log(listReservations.length)
        for (const element of listReservations) {
            if (amountToReturn > 0) {
                var person = await this.fetchPerson(Number(element.dni));
                if (person) {
                    if (fun(person)) {
                        let reservation = {
                            reservation_code: element.reservation_code,
                            date: parseDate,
                            assigned: true,
                            vaccination_period_id: vp.id,
                            turn: turn,
                            state_code: state_code,
                            zone_id: zone_id
                        }
                        this.countryDataAcces.updateAReservation(reservation)
                        let object = {
                            reservationCode: element.reservation_code,
                            state: state_code,
                            zone: zone_id,
                            vacCenterCode: vp.vacCenterCode,
                            vaccinationDate: parseDate,
                            turn: turn
                        }
                        await axios.post("http://localhost:5007/sms/", object).then().catch((e) => console.log(e))
                        amountToReturn--
                    }
                }
            } else {
                return amountToReturn
            }
        };
        console.log("saliendo", amountToReturn)
        return amountToReturn
    }



    async addVaccinationPeriod(body) {
        let vp = JSON.parse(await this.countryDataAcces.addVaccinationPeriod({
            vaccine_amount: body.vaccine_amount,
            date_from: body.date_from,
            date_to: body.date_to,
            vac_center_id: body.vac_center_id,
            assignment_criteria_id: body.assignment_criteria_id,
            vaccine_id: body.vaccine_id
        }))
        var Difference_In_Time = new Date(body.date_to) - new Date(body.date_from);
        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
        let auxDate = new Date(body.date_from)
        let turns = (Difference_In_Days + 1) * 2
        let amount = Math.floor((body.vaccine_amount) / turns)
        let extras = (body.vaccine_amount % ((Difference_In_Days + 1) * 2))
        let vpId = vp.id;
        for (var i = 0; i < turns; i++) {
            let totalAmountMat = amount
            let newAmountMat = amount
            if (extras > 0) {
                newAmountMat++
                totalAmountMat++
                extras--
            }

            newAmountMat = await this.realocateReservations(auxDate, i % 2 ? 3 : 2, vp, newAmountMat)
            let newSlotMat = {
                assignment_criteria_id: body.assignment_criteria_id,
                available_slots: newAmountMat,
                total_slots: totalAmountMat,
                date: auxDate,
                turn: i % 2 ? 3 : 2,
                vac_center_id: body.vac_center_id,
                vaccination_period_id: vpId,
                state_code: body.state_code,
                zone_id: body.zone_id
            }

            await this.slotController.addSlot(newSlotMat)
            i % 2 ? auxDate.setDate(auxDate.getDate() + 1) : auxDate
        }
        return vp
    }

    getVaccinationPeriods() {
        return this.countryDataAcces.getVaccinationPeriods()
    }

    getAVaccinationPeriod(id) {
        return this.countryDataAcces.getAVaccinationPeriod(id)
    }

    deleteAVaccinationPeriod(id) {
        return this.countryDataAcces.deleteAVaccinationPeriod(id)
    }

    async updateAVaccinationPeriod(id, name) {
        let vpJson = JSON.parse(await this.countryDataAcces.getAVaccinationPeriod(id))[0]
        let oldAmount
        vpJson ? oldAmount = vpJson.vaccine_amount : oldAmount = 0
        let vp = await this.countryDataAcces.updateAVaccinationPeriod(id, name)
        vp = vp[0]
        if (name.vaccine_amount) {
            if (vp) {
                vpJson = JSON.parse(await this.countryDataAcces.getAVaccinationPeriod(id))[0]
                let startDate = new Date()
                startDate = new Date(startDate.getFullYear() + "-" + startDate.getMonth() + "-" + startDate.getDate())
                startDate.setDate(startDate.getDate() + 1)
                if (startDate < new Date(vpJson.date_from)) {
                    startDate = new Date(vpJson.date_from)
                }
                var Difference_In_Time = new Date(vpJson.date_to) - startDate;
                var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
                let turns = (Difference_In_Days + 1) * 2
                let amount = Math.floor((name.vaccine_amount - oldAmount) / turns)
                let extras = ((name.vaccine_amount - oldAmount) % turns)
                for (let i = 0; i < turns; i++) {
                    let amountToAdd = amount
                    let amountToAddTotal = amount
                    if (extras != 0) {
                        amountToAdd++
                        amountToAddTotal++
                        extras--
                    }
                    let slot = JSON.parse(await this.slotController.getASlot({
                        date: new Date(startDate),
                        turn: i % 2 ? 3 : 2,
                        vaccination_period_id: vpJson.id
                    }))[0]
                    if (slot.available_slots == 0 && amountToAddTotal != 0) {
                        amountToAdd = await this.realocateReservations(startDate, i % 2 ? 3 : 2, vpJson, amountToAdd)
                    }
                    if (amountToAddTotal != 0) {
                        this.slotController.updateASlot({
                            available_slots: slot.available_slots + amountToAdd,
                            total_slots: slot.total_slots + amountToAddTotal,
                            date: new Date(slot.date),
                            turn: slot.turn,
                            vaccination_period_id: slot.vaccination_period_id
                        })
                    }
                    i % 2 ? startDate.setDate(startDate.getDate() + 1) : startDate
                }
            }
        }
        return true
    }
}