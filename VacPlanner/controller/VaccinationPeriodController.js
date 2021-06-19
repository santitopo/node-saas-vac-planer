const SlotController = require("./SlotController");

module.exports = class VaccinationPeriodController {
    constructor(countryDataAcces, slotController) {
      this.countryDataAcces = countryDataAcces;
      this.slotController = slotController;
    }
    
    async addVaccinationPeriod(body){
        let vp = JSON.parse(await this.countryDataAcces.addVaccinationPeriod({
            vaccineAmount: body.vaccineAmount,
            dateFrom: body.dateFrom,
            dateTo: body.dateTo,
            vacCenterId: body.vacCenterId,
            assignmentCriteriaId: body.assignmentCriteriaId,
            vaccineId: body.vaccineId
        }))
        var Difference_In_Time = new Date(body.dateTo) - new Date(body.dateFrom); 
        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
        let auxDate = new Date(body.dateFrom)
        console.log(Difference_In_Days)
        let amount = Math.floor(body.vaccineAmount/(Difference_In_Days * 2))
        let extras = (body.vaccineAmount%((Difference_In_Days+1) * 2))
        console.log(amount)
        console.log()
        console.log()
        console.log(extras)
        let vpId =vp.id;
        for(let i = 0; i<=Difference_In_Days; i++){
            let totalAmountMat = amount
            let totalAmountNoc = amount
            let newAmountMat = amount /*-reagendendados*/
            let newAmountNoc = amount /*-reagendendados*/
            if(extras>0){
                newAmountMat++
                totalAmountMat++
                extras--
            }
            if(extras>0){
                newAmountNoc++
                totalAmountNoc++
                extras--
            }
            //amount - gente que agendo antes de publicarlo
            //addAwaitingPeople (returns int de cuanta gente voy a poder agendar ese dia y ya los manda a la MQ)
            let newSlotMat = {
                assignmentCriteriaId: body.assignmentCriteriaId,
                availableSlots: newAmountMat,
                totalSlots: totalAmountMat,
                date: auxDate,
                turn: 1,
                vacCenterId: body.vacCenterId,
                vaccinationPeriodId: vpId,
                stateCode: body.stateCode,
                zoneId: body.zoneId
            }

            let newSlotNoc = {
                assignmentCriteriaId: body.assignmentCriteriaId,
                availableSlots: newAmountNoc,
                totalSlots: totalAmountNoc,
                date: auxDate,
                turn: 2,
                vacCenterId: body.vacCenterId,
                vaccinationPeriodId: vpId,
                stateCode: body.stateCode,
                zoneId: body.zoneId
            }
            await this.slotController.addSlot(newSlotMat)
            await this.slotController.addSlot(newSlotNoc)

            auxDate.setDate(auxDate.getDate() + 1);
        }
        return vp
    }

    getVaccinationPeriods(){
        return this.countryDataAcces.getVaccinationPeriods()
    }

    getAVaccinationPeriod(id){
        return this.countryDataAcces.getAVaccinationPeriod(id)
    }

    deleteAVaccinationPeriod(id){
        return this.countryDataAcces.deleteAVaccinationPeriod(id)
    }

    updateAVaccinationPeriod(id, name){
        let vp = this.countryDataAcces.updateAVaccinationPeriod(id, name)
        if(name.vaccineAmount){
            if(vp){
                let vpJson = JSON.parse(this.countryDataAcces.getAVaccinationPeriod(id))
                let startDate = new Date().setDate(auxDate.getDate() + 1)
                var Difference_In_Time = new Date(vpJson.dateTo) - startDate; 
                var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
                let vaccinesToAddPerDay = name.vaccineAmount/(Difference_In_Days * 2)
            }
        }
        
        startDate.setDate(startDate.getDate() + 1);
        
        let amount 
    }
}