module.exports = class VaccineController {
    constructor(countryDataAcces) {
      this.countryDataAcces = countryDataAcces;
    }

    addVaccines(body){
        return this.countryDataAcces.addVaccine({
            name: body.name,
            recommendations: body.recommendations
        })
    }

    getVaccines(){
        return this.countryDataAcces.getVaccines()
    }

    getAVaccine(id){
        return this.countryDataAcces.getAVaccine(id)
    }

    deleteAVaccine(id){
        return this.countryDataAcces.deleteAVaccine(id)
    }

    updateAVaccine(id, name){
        return this.countryDataAcces.updateAVaccine(id, name)
    }
}