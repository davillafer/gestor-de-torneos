const AbsRepo = require('./AbsRepo')
module.exports =  class EquipoRepo extends AbsRepo{
    getCollection(){
        return 'Equipos';
    }
}