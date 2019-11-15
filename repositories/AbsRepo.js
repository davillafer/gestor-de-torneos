module.exports = class AbsRepo{

    conexion(){
        var mongo = require("mongodb");
        var db = "mongodb://admin:adoo4ever@clusteradoo-shard-00-00-zdxgm.mongodb.net:27017,clusteradoo-shard-00-01-zdxgm.mongodb.net:27017,clusteradoo-shard-00-02-zdxgm.mongodb.net:27017/adoo_bd?ssl=true&replicaSet=ClusterADOO-shard-0&authSource=admin&retryWrites=true&w=majority";
        var promise = new Promise((resolve, reject) => {
            mongo.MongoClient.connect(db, (err, db) => {
                if (err) {
                    resolve(null)
                } else {
                    resolve(db);
                }
            });
        });
        return promise;
    }

    async saveUser(entity){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
            collection.findOne({ "usuario": entity.usuario }, (err, existsOne) => {
                if (err || existsOne !== null) {
                    resolve(null);
                } else {
                    collection.insertOne(entity, (err, result) => {
                        if (err) {
                            resolve(null);
                        } else {
                            resolve(result.ops[0]._id.toString());
                        }
                        db.close();
                    });
                    db.close();
                }
            });
        });
    }

    async save(entity){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
            collection.insertOne(entity, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(result.ops[0]._id.toString());
                }
                db.close();
            });
        });
    }

    async read(id){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
            collection.find({"_id" :id}).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(result);
                }
                db.close();
            });
        });
    }

    async update(entitie){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
            collection.update({"_id" :entitie.id}, {$set: entitie}, (err, result) => {
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

    async delete(entitie){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
            collection.remove({"_id" :entitie.id}, (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(result);
                }
                db.close();
            });
        });
    }

    async search(criterio){
        let db = await this.conexion();
        return new Promise((resolve, reject) => {
            var collection =  db.collection(this.getCollection());
            collection.find(criterio).toArray( (err, result) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(result);
                }
                db.close();
            });
        });
    }

    async searchPg(pg , criterio){
        let db = await this.conexion();       
        return new Promise((resolve, reject) => {
            var collection = db.collection(this.getCollection());
                collection.count( criterio, (err, count) => {
                    collection.find(criterio).skip( (pg-1)*2 ).limit( 2 )
                        .toArray( (err, result) => {    
                            if (err) {
                                resolve(null);
                            } else {
                                // lista
                                result.total = count;
                                resolve(result);
                            }
                            db.close();
                        });
                })
            });       
    }

    getCollection(){
        throw new Error('Metodo no disponible en clase abstracta');
    }

    getEntity(){
        throw new Error('Metodo no disponible en clase abstracta');
    }

}