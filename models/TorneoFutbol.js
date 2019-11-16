module.exports =  class TorneoFutbol {

    constructor() {
        //this._id = null;
        this._nombre = null;
        this._numEquipos = null;
        this._finInscripcion = null;
        this._inicioInscripcion = null;
        this._partidos = [];
        this._equipos = [];
        this._creador = null;
        this._categoria = null;
        this._visibilidad = null;
    }

    /*id() {
        return this._id;
    }

    id(value) {
        this._id = value;
    }*/

    nombre() {
        return this._nombre;
    }

    nombre(value) {
        this._nombre = value;
    }

    numEquipos() {
        return this._numEquipos;
    }

    numEquipos(value) {
        this._numEquipos = value;
    }

    finInscripcion() {
        return this._finInscripcion;
    }

    finInscripcion(value) {
        this._finInscripcion = value;
    }

    inicioInscripcion() {
        return this._inicioInscripcion;
    }

    inicioInscripcion(value) {
        this._inicioInscripcion = value;
    }

    partidos() {
        return this._partidos;
    }

    partidos(value) {
        this._partidos = value;
    }

    equipos() {
        return this._equipos;
    }

    equipos(value) {
        this._equipos = value;
    }

    creador() {
        return this._creador;
    }

    creador(value) {
        this._creador = value;
    }

    categoria() {
        return this._categoria;
    }

    categoria(value) {
        this._categoria = value;
    }

    visibilidad() {
        return this._visibilidad;
    }

    visibilidad(value) {
        this._visibilidad = value;
    }

    inscribir(equipo_id){
        this._equipos.forEach(id => {
            if(id = equipo_id)
                throw new Error('El equipo ya está inscrito');
        })
        equipos.push(equipo_id);            
    }

    desInscribir(equipo){
        
    }
    
    siguientePartido(){
        
    }

    generarBracket(){
        
    }

}