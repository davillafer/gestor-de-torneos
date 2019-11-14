const AbsRepo = require('./AbsRepo')
module.exports =  class TorneoRepo extends AbsRepo{
    getCollection(){
        return 'Torneos';
    }
}