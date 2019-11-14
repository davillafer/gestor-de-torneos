import AbsFactory from './AbsFactory';
import { PartidoFutbol } from '../models/PartidoFutbol';
import { TorneoFutbol } from '../models/TorneoFutbol';
export class FutbolFactory extends AbsFactory {

    crearTorneo() {
        return new TorneoFutbol();
    }

    crearPartido() {
       throw new PartidoFutbol();
    }
    
}