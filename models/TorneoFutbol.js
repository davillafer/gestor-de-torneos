

module.exports =  class TorneoFutbol{
    constructor(){
        this._id = null;
        this.nombre = null;
        this.numEquipos = null;
        this.finInscripcion = null;
        this.inicioInscripcion = null;
        this.partidos = [];
        this.equipos = [];
        this.creador = null;
        this.categoria = null;
    }


    inscribir(equipo_id){
        this.equipos.forEach(id => {
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