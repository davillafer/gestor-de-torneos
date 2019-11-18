var AbsFactory = require('./AbsFactory');
var PartidoFutbol = require('../PartidoFutbol');
var TorneoFutbol  = require('../TorneoFutbol');

module.exports = class FutbolFactory extends AbsFactory {

    crearTorneo() {
        return new TorneoFutbol();
    }

    crearPartido() {
       throw new PartidoFutbol();
    }
}