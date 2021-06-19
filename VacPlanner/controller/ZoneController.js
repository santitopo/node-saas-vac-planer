module.exports = class ZoneController {
    constructor(countryDataAcces) {
      this.countryDataAcces = countryDataAcces;
    }

    addZones(body){
        return this.countryDataAcces.addZone({
            code: body.code,
            stateCode: body.stateCode,
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