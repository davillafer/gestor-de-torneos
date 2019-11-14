var AbsFactory = require('./AbsFactory');
var PartidoFutbol = require('../models/PartidoFutbol');
var TorneoFutbol  = require('../models/TorneoFutbol');
module.exports = class FutbolFactory extends AbsFactory {

    crearTorneo() {
        return new TorneoFutbol();
    }

    crearPartido() {
       throw new PartidoFutbol();
    }
    
}