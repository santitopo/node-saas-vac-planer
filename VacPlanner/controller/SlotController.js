module.exports = class SlotController {
    constructor(countryDataAcces) {
      this.countryDataAcces = countryDataAcces;
    }

    addSlot(body){
        return this.countryDataAcces.addSlot({
            assignmentCriteriaId: body.assignmentCriteriaId,
            availableSlots: body.availableSlots,
            totalSlots: body.totalSlots,
            date: body.date,
            turn: body.turn,
            stateCode: body.stateCode,
            vacCenterId: body.vacCenterId,
            zoneId: body.zoneId,
            vaccinationPeriodId: body.vaccinationPeriodId,
            zoneName:body.zoneName,
            stateName:body.stateName
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