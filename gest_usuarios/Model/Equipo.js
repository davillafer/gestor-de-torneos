module.exports =  class Equipo {
    constructor(){
        this._id = null;
        this.nombre = null;
        this.identificador = null;
        this.contrasena = null;
        this.color = null;
    }

    identificar(ident,pass){
        return this.identificador === ident &&
            this.contrasena === pass;
    }
}