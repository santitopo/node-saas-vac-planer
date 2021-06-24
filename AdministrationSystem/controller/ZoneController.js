module.exports = class ZoneController {
    constructor(countryDataAcces, logger) {
      this.logger = logger;
      this.countryDataAcces = countryDataAcces;
    }

    addZones(body){
        return this.countryDataAcces.addZone({
            code: body.code,
            state_code: body.state_code,
            name: body.name
        })
    }

    getZones(){
        return this.countryDataAcces.getZones()
    }

    getAZone(id){
        return this.countryDataAcces.getAZone(id)
    }

    deleteAZone(id){
        return this.countryDataAcces.deleteAZone(id)
    }

    updateAZone(id, name){
        return this.countryDataAcces.updateAZone(id, name)
    }
}