const AbsRepo = require('./AbsRepo')
const FutbolFactory = require('../factory/FutbolFactory')
module.exports =  class TorneoRepo extends AbsRepo{
    getCollection(){
        return 'Torneos';
    }

    getEntity(){
        return FutbolFactory().crearTorneo();
    }

    

}