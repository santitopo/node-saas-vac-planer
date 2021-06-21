module.exports = class SlotController {
    constructor(countryDataAcces) {
      this.countryDataAcces = countryDataAcces;
    }

    addSlot(body){
        return this.countryDataAcces.addSlot({
            assignment_criteria_id: body.assignment_criteria_id,
            available_slots: body.available_slots,
            total_slots: body.total_slots,
            date: body.date,
            turn: body.turn,
            state_code: body.state_code,
            vac_center_id: body.vac_center_id,
            zone_id: body.zone_id,
            vaccination_period_id: body.vaccination_period_id
        })
    }

    getSlots(){
        return this.countryDataAcces.getSlots()
    }

    getASlot(body){
        return this.countryDataAcces.getASlot(body)
    }

    deleteASlot(body){
        return this.countryDataAcces.deleteASlot(body)
    }

    updateASlot(name){
        return this.countryDataAcces.updateASlot(name)
    }
}