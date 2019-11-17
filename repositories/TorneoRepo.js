const AbsRepo = require('./AbsRepo')
const FutbolFactory = require('../factory/FutbolFactory')
module.exports =  class TorneoRepo extends AbsRepo{
    getCollection(){
        return 'Torneos';
    }

    getEntity(){
        return FutbolFactory().crearTorneo();
    }

    async update(entity){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
            collection.updateOne({"torneo": entity.torneo}, {$set: entity}, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    // modificado
                    resolve(result);
                }
                db.close();
            });
        });
    }
    

};
