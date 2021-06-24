module.exports = class VacCenterController {
    constructor(countryDataAcces, logger) {
        this.logger = logger;
      this.countryDataAcces = countryDataAcces;
    }

    addVacCenters(body){
        return this.countryDataAcces.addVacCenter({
            zone_id: body.zone_id,
            name: body.name
        })
    }

    getVacCenters(){
        return this.countryDataAcces.getVacCenters()
    }

    getAVacCenter(id){
        return this.countryDataAcces.getAVacCenter(id)
    }

    deleteAVacCenter(id){
        return this.countryDataAcces.deleteAVacCenter(id)
    }

    updateAVacCenter(id, name){
        return this.countryDataAcces.updateAVacCenter(id, name)
    }
}