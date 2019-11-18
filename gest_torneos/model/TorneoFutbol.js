module.exports =  class TorneoFutbol {

    // No hay constructor overloading
    constructor(nombre, numEquipos, finInscripcion, inicioTorneo, partidos, equipos, creador, categoria, visibilidad) {
        // _id da problemas con mongo si no lo genera automáticamnete
        if (typeof nombre !== 'undefined')
            this._nombre = nombre;
        else
            this._nombre = null;

        if (typeof numEquipos !== 'undefined')
            this._numEquipos = numEquipos;
        else
            this._numEquipos = null;

        if (typeof finInscripcion !== 'undefined')
            this._finInscripcion = finInscripcion;
        else
            this._finInscripcion = null;

        if (typeof inicioTorneo !== 'undefined')
            this._inicioTorneo = inicioTorneo;
        else
            this._inicioTorneo = null;

        if (typeof partidos !== 'undefined')
            this._partidos = partidos;
        else
            this._partidos = null;

        if (typeof equipos !== 'undefined')
            this._equipos = equipos;
        else
            this._equipos = null;

        if (typeof creador !== 'undefined')
            this._creador = creador;
        else
            this._creador = null;

        if (typeof categoria !== 'undefined')
            this._categoria = categoria;
        else
            this._categoria = null;

        if (typeof visibilidad !== 'undefined')
            this._visibilidad = visibilidad;
        else
            this._visibilidad = null;
    }

    get nombre() {
        return this._nombre;
    }

    set nombre(value) {
        this._nombre = value;
    }

    get numEquipos() {
        return this._numEquipos;
    }

    set numEquipos(value) {
        this._numEquipos = value;
    }

    get finInscripcion() {
        return this._finInscripcion;
    }

    set finInscripcion(value) {
        this._finInscripcion = value;
    }

    get inicioInscripcion() {
        return this._inicioInscripcion;
    }

    set inicioInscripcion(value) {
        this._inicioInscripcion = value;
    }

    get partidos() {
        return this._partidos;
    }

    set partidos(value) {
        this._partidos = value;
    }

    get equipos() {
        return this._equipos;
    }

    set equipos(value) {
        this._equipos = value;
    }

    get creador() {
        return this._creador;
    }

    set creador(value) {
        this._creador = value;
    }

    get categoria() {
        return this._categoria;
    }

    set categoria(value) {
        this._categoria = value;
    }

    get visibilidad() {
        return this._visibilidad;
    }

    set visibilidad(value) {
        this._visibilidad = value;
    }

    inscribir(equipo_id){
        this._equipos.forEach(id => {
            if(id == equipo_id)
                throw new Error('El equipo ya está inscrito');
        })
        this._equipos.push(equipo_id);            
    }

    desInscribir(equipo){       
        for (let index = 0; index < this._equipos.length; index++) {            
            if (this._equipos[index] == equipo && new Date() < this._finInscripcion )
            {
                this._equipos.splice(index,1);          
                return true;                                                                 
            }
        }
        return false;
    }
    
    siguientePartido(){
        
    }

    generarBracket(){
        
    }

}