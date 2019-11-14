const AbsRepo = require('./AbsRepo')
const Equipo = require('../models/Equipo')
module.exports =  class EquipoRepo extends AbsRepo{
    getCollection(){
        return 'Equipos';
    }

    getEntity(){
        return new Equipo();
    }
}