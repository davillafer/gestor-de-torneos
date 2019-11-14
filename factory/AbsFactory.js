module.exports =  class AbsFactory{
    crearTorneo() {
        throw new Error('Metodo no disponible en clase abstracta');
    }

    crearPartido() {
       throw new Error('Metodo no disponible en clase abstracta');
    }
}