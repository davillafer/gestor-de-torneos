const AbsRepo = require('./AbsRepo')
const Equipo = require('../models/Equipo')
module.exports =  class EquipoRepo extends AbsRepo{
    getCollection(){
        return 'Equipos';
    }

    getEntity(){
        return new Equipo();
    }

    async update(entity){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
            collection.updateOne({"usuario": entity.usuario}, {$set: entity}, (err, result) => {
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

}