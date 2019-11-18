const categorias = require('../gest_torneos/model/Categoria');
const ObjectID = require("mongodb").ObjectID;
const FutbolFactory = require('../gest_torneos/model/factory/FutbolFactory');
const futbolFactory = new FutbolFactory();
const TorneoFutbol = require('../gest_torneos/model/TorneoFutbol');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'MiRouter',
    getFechaBonita(fecha){
        if(!fecha instanceof Date){
            return fecha;
        }
        let date = new Date();
        if(date.getFullYear() === fecha.getFullYear() &&
        date.getMonth() === fecha.getMonth() &&
        date.getDate() === fecha.getDate()){
            return "Hoy";
        }       
        else{
            // 1/10/2019 - 18:53h 
            return `${fecha.getDate()}/${fecha.getMonth()+1}/${fecha.getFullYear()}`;
        }
    },
    getFechaHoraBonita(fecha){
        if(!fecha instanceof Date){
            return fecha;
        }
        return `${fecha.getDate()}/${fecha.getMonth()+1}/${fecha.getFullYear()}-${fecha.getHours()}:${fecha.getMinutes()}`;
    },
    getTorneos(list) {
        let aux = [];
        list.forEach(t => {
           aux.push(module.exports.getTorneo(t));
        });
        return aux;
    },
    getTorneo(t) {
        let aux = new TorneoFutbol(t._nombre, t._numEquipos, t._finInscripcion, t._inicioInscripcion, t._partidos, t._equipos, t._creador, t._categoria, t._visibilidad);
        if (t._id)
            aux._id = t._id;
        return aux;
    },
    getUsuarioIdentificado(req){
        if(req.auth.credentials !== null){
            return req.auth.credentials;
        }else if(req.state['session-id'] != null && req.state['session-id'].usuario !=""){
            return req.state['session-id'].usuario;
        }else{
            return null;
        }
    },
    register: async (server, options) => {
        miserver = server;        
        equipoRepo = server.methods.getEquipoRepo();
        torneoRepo = server.methods.getTorneoRepo();

        server.route([
            /* DESAPUNTARSE DE UN TORNEO */
            {
                method: 'GET',
                path: '/torneos/{id}/abandonar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                  
                    let criterio = { "_id": ObjectID(req.params.id)};
                    let torneoObjetivo = null;       
                    let result =  null; 
                    await torneoRepo.search(criterio).then((torneos) => {
                        if (torneos) {
                            torneoObjetivo =module.exports.getTorneo(torneos[0])
                        } else {
                            result = h.redirect('/torneos/inscrito?mensaje=El torneo no existe&tipoMensaje=danger');
                        }
                    });
                   
                   //desapuntarse
                    let done = torneoObjetivo.desInscribir(req.auth.credentials);
                   //
                   result = done ? h.redirect('/torneos?mensaje=Se te ha desapuntado del torneo&tipoMensaje=success') :h.redirect('/torneos?mensaje=No se te ha podido desapuntar&tipoMensaje=danger');

                    await torneoRepo.update(torneoObjetivo).then((res) => {                                                       
                        if(!res) // si fue mal
                            result = h.redirect('/torneos?mensaje=No se ha podido desapuntarse&tipoMensaje=danger');
                        // si salió bien devolverá lo que ya viene de la 'lógica';
                    });
                    return result;

                }
            },
            /* CANCELAR TORNEOS */
            {
                method: 'GET',
                path: '/torneos/{id}/eliminar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Criterio de búsqueda
                    let id = ObjectID(req.params.id);
                    let criteria = { "_id" :  id};
                    // Eliminar el torneo
                    let result = null;
                    await torneoRepo.delete(criteria).then((res) => {
                        if (res) {
                            result = h.redirect('/torneos/creados?mensaje=Torneo Eliminado');
                        } else {
                            result = h.redirect('/torneos/creados?mensaje=Error al eliminar');
                        }
                    });
                    return result;
                }
            },
            /* TORNEOS EN LOS QUE EL USUARIO ESTÁ INCRITO */
            {
                method: 'GET',
                path: '/torneos/inscrito',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Obtener todos los torneos
                    let totalTorneos = await torneoRepo.search({}).then((torneos) => {
                         return torneos;
                    });
                    // Transformar a objetos de nuestro modelo
                    totalTorneos = module.exports.getTorneos(totalTorneos);
                    // Torneos en los que el usuario está inscrito
                    let torneos = [];
                    await totalTorneos.forEach(torneo => {
                        torneo.inicioInscripcion = module.exports.getFechaBonita(torneo.inicioInscripcion);
                        torneo.finInscripcion = module.exports.getFechaBonita(torneo.finInscripcion);
                        torneo.equipos.forEach(equipo => {
                            if (equipo === req.state["session-id"].usuario)
                                torneos.push(torneo);
                        });
                    });
                    // Devolver vista
                    return h.view('torneos/inscrito',
                        {
                            torneos,
                            usuarioAutenticado: req.auth.credentials                            
                        },
                        { layout: 'base'} );
                }
            },
            /* UNIRSE A UN TORNEO */
            {
                method: 'GET',
                path: '/torneos/{id}/unirse',
                options:
                {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Criterio de búsqueda
                    let criteria = {"_id": require("mongodb").ObjectID(req.params.id)};
                    // Buscar el torneo
                    let torneo = await torneoRepo.search(criteria).then((torneos) => {
                        return torneos[0];
                    });
                    // Transformar a objetos de nuestro modelo
                    torneo = module.exports.getTorneo(torneo);
                    // Comprobar si ya se está inscrito
                    torneo.equipos.forEach(equipo => {
                        if (equipo === req.state["session-id"].usuario)
                            return h.redirect('/torneos?mensaje=Ya se ha unido al torneo&tipoMensaje=danger');
                    });
                    
                    torneo.inscribir(req.auth.credentials)

                    // Actualizar bd
                    let result = null;
                    await torneoRepo.update(torneo).then((res) => {
                        if(res)
                            result = h.redirect('/torneos?mensaje=Se ha unido al torneo&tipoMensaje=success');
                        else
                            result = h.redirect('/torneos?mensaje=No se ha podido unirse&tipoMensaje=danger');
                    });
                    return result;
                }
            },
            /* VER UN TORNEO */
            {
                method: 'GET',
                path:
                    '/torneos/{id}/ver',
                options:
                {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    // Criterio de búsqueda
                    let criteria = {"_id": require("mongodb").ObjectID(req.params.id)};
                    // Obtener el torneo
                    let torneo = await torneoRepo.search(criteria).then((torneos) => {
                            return torneos[0];
                    });
                    // Transformar a objetos de nuestro modelo
                    torneo = module.exports.getTorneo(torneo);
                    // Partidos del torneo
                    let partidos = [];
                    if (torneo.partidos.length === 0){
                        let currentDate = new Date();
                        fechaDeInicioSuperada = currentDate.getTime() > torneo.inicioInscripcion.getTime();
                        if (fechaDeInicioSuperada) {
                            if (torneo.equipos.length != 0){
                                let equipos = torneo.equipos.slice();
                                let equiposLength = equipos.length;
                                let equipoAnterior = undefined;
                                fecha = torneo.inicioInscripcion;
                                fecha.setHours(12);
                                for (let i = 0; i < equiposLength; i++) {
                                    let number = Math.floor(Math.random() * equipos.length);
                                    if (equipoAnterior === undefined) {
                                        equipoAnterior = equipos[number];
                                        equipos.splice(number, 1);
                                    } else {
                                        let resultado = {
                                            golesEquipoLocal : "-",
                                            golesEquipoVisitante : "-"
                                        };
                                        let partido = {
                                            equipoLocal: equipoAnterior,
                                            equipoVisitante: equipos[number],
                                            resultado : resultado,
                                            fechaHora : module.exports.getFechaHoraBonita(fecha),
                                        };
                                        equipoAnterior = undefined;
                                        equipos.splice(number, 1);
                                        torneo.partidos.push(partido)
                                    }
                                }
                                if (equipoAnterior != undefined){
                                    let resultado = {
                                        golesEquipoLocal : "-",
                                        golesEquipoVisitante : "-"
                                    };
                                    let partido = {
                                        equipoLocal: equipoAnterior,
                                        equipoVisitante: "-",
                                        resultado : resultado,
                                        fechaHora : module.exports.getFechaHoraBonita(fecha),
                                    };
                                    torneo.partidos.push(partido)
                                }
                                let columna = torneo.partidos.length;
                                while (columna > 1) {
                                    fecha.setDate(fecha.getDate() +1 );
                                    let  elementosColumna = columna;
                                    columna = 0;
                                    for (let i = 0; i < elementosColumna; i+=2) {
                                        let resultado = {
                                            golesEquipoLocal : "-",
                                            golesEquipoVisitante : "-"
                                        };
                                        let partido = {
                                            equipoLocal: "Por Determinar",
                                            equipoVisitante: "Por Determinar",
                                            resultado : resultado,
                                            fechaHora : module.exports.getFechaHoraBonita(fecha),
                                        };

                                        columna++;
                                        torneo.partidos.push(partido)
                                    }
                                }

                                await torneoRepo.update(torneo).then((id) => {
                                    if(id){

                                    } else {

                                    }
                                });

                                let auxTorneos = [];
                                if (torneo.partidos.length == 1) {
                                    partidos.push(torneo.partidos);
                                } else {
                                    while (true) {
                                        if (auxTorneos.length == 0) {
                                            let half;
                                            if (torneo.partidos.length % 2 != 0) {
                                                half = Math.floor(torneo.partidos.length / 2) + 1;
                                            } else {
                                                half = Math.floor(torneo.partidos.length / 2);
                                            }
                                            partidos.push(torneo.partidos.slice(0, half));
                                            auxTorneos = torneo.partidos.slice(half, torneo.partidos.length);
                                        } else {
                                            let half;
                                            if (auxTorneos.length % 2 != 0) {
                                                half = Math.floor(auxTorneos.length / 2) + 1;
                                            } else {
                                                half = Math.floor(auxTorneos.length / 2);
                                            }
                                            partidos.push(auxTorneos.slice(0, half));
                                            auxTorneos = auxTorneos.slice(half, auxTorneos.length);
                                        }
                                        if (auxTorneos.length == 1) {
                                            partidos.push(auxTorneos);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        let auxTorneos = [];
                        if (torneo.partidos.length == 1){
                            partidos.push(torneo.partidos);
                        } else {
                            while(true){
                                if (auxTorneos.length == 0) {
                                    let half;
                                    if (torneo.partidos.length % 2 != 0) {
                                        half = Math.floor(torneo.partidos.length / 2) + 1;
                                    } else {
                                        half = Math.floor(torneo.partidos.length / 2);
                                    }
                                    partidos.push(torneo.partidos.slice(0, half));
                                    auxTorneos = torneo.partidos.slice(half, torneo.partidos.length);
                                } else {
                                    let half;
                                    if (auxTorneos.length % 2 != 0) {
                                        half = Math.floor(auxTorneos.length / 2) + 1;
                                    } else {
                                        half = Math.floor(auxTorneos.length / 2);
                                    }
                                    partidos.push(auxTorneos.slice(0, half));
                                    auxTorneos = auxTorneos.slice(half, auxTorneos.length);
                                }
                                if (auxTorneos.length == 1) {
                                    partidos.push(auxTorneos);
                                    break;
                                }
                            }
                        }
                    }
                    torneo.inicioInscripcion = module.exports.getFechaHoraBonita(torneo.inicioInscripcion)
                    return h.view('torneos/ver',
                        {
                            torneo: torneo,
                            partidos: partidos,
                            usuarioAutenticado: req.state["session-id"].usuario,
                            isOwner: torneo.creador === req.state["session-id"].usuario ? 'true':'false'
                        },
                        {layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/base',
                handler: {
                    view: 'layout/base'
                }
            },
            /* REGISTRO DEL USUARIO */
            {
                method: 'GET',
                path: '/registro',
                handler: async (req, h) => {
                    // Obtener vista
                    return h.view('registro',
                        { },
                        { layout: 'base'});
                }
            },
            /* LOGIN DEL USUARIO */
            {
                method: 'GET',
                path: '/login',
                handler: async (req, h) => {
                    // Obtener vista
                    return h.view('login',
                        { },
                        { layout: 'base'});
                }
            },
            /* CERRAR SESIÓN DEL USUARIO */
            {
                method: 'GET',
                path: '/desconectarse',
                handler: async (req, h) => {
                    // Quitamos la cookie de la sesión
                    req.cookieAuth.set({ usuario: "", secreto: "" });
                    // Obtenemos la vista
                    return h.view('login',
                        { },
                        { layout: 'base'});
                }
            },
            /* LOGIN DEL USUARIO */
            {
                method: 'POST',
                path: '/login',
                handler: async (req, h) => {
                    // Transformamos la contraseña del usuario
                    let password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');
                    // Criterio de búsqueda
                    let criteria = {
                        usuario: req.payload.usuario,
                        password: password,
                    };
                    // Obtenemos el usuario
                    let respuesta = null;
                    await equipoRepo.search(criteria).then((usuarios) => {
                        respuesta = "";
                        if (usuarios === null || usuarios.length === 0 ) {
                            respuesta =  h.redirect('/login?mensaje=Usuario o password incorrecto&tipoMensaje=danger');
                        } else {
                            req.cookieAuth.set({
                                usuario: usuarios[0].usuario,
                                secreto : "secreto"
                            });
                            respuesta = h.redirect('/');

                        }
                    });
                    return respuesta;
                }
            },
            /* REGISTRO DEL USUARIO */
            {
                method: 'POST',
                path: '/registro',
                handler: async (req, h) => {
                    // Comprobar que la contraseña es mayor de X caracteres
                    if (req.payload.password.length < process.env.NUM_CHAR)
                        return h.redirect('/registro?mensaje="Passwords demasiado corta&tipoMensaje=danger"');
                    // Comprobar que ambas contraseñas son iguales
                    if (req.payload.password !== req.payload.repassword)
                        return h.redirect('/registro?mensaje="Passwords distintas&tipoMensaje=danger"'); // Contraseña no salta, debe ser por la 'ñ'
                    // Transformamos la contraseña del usuario
                    let password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');
                    // Usuario
                    let usuario = {
                        usuario: req.payload.usuario,
                        nombre: req.payload.nombre,
                        color: req.payload.color,
                        password: password
                    };
                    // Buscamos al usuario para comprobar si ya existe
                    await equipoRepo.search({'usuario': usuario.usuario}).then( async (result) => {
                       if (result.length !== 0) {
                           respuesta =  h.redirect('/registro?mensaje="Usuario no disponible"');
                       } else {
                           // Guardamos al usuario en la bd
                           await equipoRepo.save(usuario).then((id) => {
                               respuesta = "";
                               if (id == null) {
                                   respuesta =  h.redirect('/registro?mensaje=Error al crear cuenta')
                               } else {
                                   respuesta = h.redirect('/login?mensaje=Usuario Creado');
                               }
                           });
                       }
                    });
                    return respuesta;
                }
            },
            /* VER PERfil DEL USUARIO */
            {
                method: 'GET',
                path: '/perfil',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Obtenemos la información del usuario
                    let user = await equipoRepo.search({ 'usuario': req.auth.credentials }).then( async result => {
                        if (result) {
                            return result[0];
                        } else {
                            return null;
                        }
                    });
                    // Comprobamos si hay error
                    if (user) {
                        return h.view('usuario/perfil',
                            {
                                user,
                                usuarioAutenticado: req.auth.credentials
                            },
                            { layout: 'base'});
                    } else {
                        return h.redirect('/?mensaje="Ha ocurrido un error"');
                    }
                }
            },
            /* MODIFICAR PERFIL */
            {
                method: 'POST',
                path: '/perfil',
                handler: async (req, h) => {
                    let usuario = {
                        usuario: req.payload.usuario,
                        nombre: req.payload.nombre,
                        color: req.payload.color
                    };

                    // Modificamos el usuario
                    let respuesta = null;
                    await equipoRepo.update(usuario).then((id) => {
                        if (id == null) {
                            respuesta =  h.redirect('/perfil?mensaje="Error al modificar"')
                        } else {
                            respuesta = h.redirect('/perfil?mensaje="Usuario modificado"');
                        }
                    });

                    return respuesta;
                }
            },
            /* CREAR TORNEOS */
            {
                method: 'GET',
                path: '/torneos/crear',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Posible número de equipos
                    let numEquipos = [];
                    for (let i = 2; i <= process.env.MAX_TEAMS; i=i*process.env.MULTIPLE_TEAMS) {
                        numEquipos.push(i);
                    }
                    // Categorías disponibles
                    let categoria = categorias.categorias;
                    // Obtenemos la vista
                    return h.view('torneos/crear',
                        {
                            categoria,
                            numEquipos,
                            usuarioAutenticado: req.auth.credentials,
                        },
                        { layout: 'base'}
                    );
                }
            },
            /* CREAR TORNEO */
            {
                method: 'POST',
                path: '/torneos/crear',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Comprobamos que el usuario no tiene 2 torneos ya creados
                    let torneos = await torneoRepo.search({}).then((torneos) => {
                        return torneos;
                    });
                    // Transformar a objetos de nuestro modelo
                    torneos = module.exports.getTorneos(torneos);
                    let contador = 0;
                    torneos.forEach(t => {
                        if (t.creador === module.exports.getUsuarioIdentificado(req)){
                            contador++;
                        }
                    });
                    if (contador >= 2)
                        return h.redirect('/torneos/crear?mensaje=Ya dispones de 2 torneos&tipoMensaje=danger\'');
                    // Creamos el torneo
                    let torneo = futbolFactory.crearTorneo();
                    // Obtener valores del usuarios
                    let fin = new Date(req.payload.fecha);
                    let empieza = new Date(req.payload.fecha);
                    empieza.setDate(empieza.getDate() - 10);
                    torneo.nombre = req.payload.nombre;
                    torneo.numEquipos = req.payload.nEquipos;
                    torneo.categoria = req.payload.categoria;
                    torneo.finInscripcion = fin;
                    torneo.visibilidad = req.payload.visibilidad;
                    torneo.inicioInscripcion = empieza;
                    torneo.equipos = [];
                    torneo.partidos = [];
                    torneo.creador = req.auth.credentials;
                    // Guardamos el torneo en la bd
                    let respuesta = null;
                    await torneoRepo.save(torneo).then((id) => {
                        respuesta = "";
                        if (id == null) {
                            respuesta =  h.redirect('/?mensaje=Error al crear el torneo');
                        } else {
                            respuesta = h.redirect('/?mensaje=Torneo creado');
                        }
                    });
                    return respuesta;
                }
            },
            /* VER TORNEOS CREADOS*/
            {
                method: 'GET',
                path: '/torneos/creados',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Paginación
                    let pg = parseInt(req.query.pg);
                    let pgUltima = 0;
                    // Puede no venir el param
                    if ( req.query.pg === null){
                        pg = 1;
                    }
                    // Criterio de búsqueda
                    let criteria = { _creador : req.auth.credentials };
                    // Buscamos con paginación
                    let torneos = await torneoRepo.searchPg(pg, criteria).then(torneos => {
                        pgUltima = torneos.total/2;
                        if (pgUltima % 2 > 0 ){
                            pgUltima = Math.trunc(pgUltima);
                            pgUltima = pgUltima+1;
                        }
                        return torneos;
                    });
                    // Transformar a objetos de nuestro modelo
                    torneos = module.exports.getTorneos(torneos);
                    // Cambiar el estilo de las fechas
                    torneos.forEach(torneo => {
                        torneo.inicioInscripcion = module.exports.getFechaBonita(torneo.inicioInscripcion);
                        torneo.finInscripcion = module.exports.getFechaBonita(torneo.finInscripcion);
                    });
                    // Paginación
                    let paginas = [];
                    for (let i=1; i <= pgUltima; i++){
                        if ( i === pg ){
                            paginas.push({valor: i , clase: "uk-active" });
                        } else {
                            paginas.push({valor: i});
                        }
                    }
                    // Obtenemos la vista
                    return h.view('torneos/mistorneos',
                    {
                        torneos,
                        usuarioAutenticado: req.auth.credentials,
                        paginas
                    },
                    { layout: 'base'} );
                }
            },
            /* VER TORNEOS */
            {
                method: 'GET',
                path: '/torneos',
                handler: async (req, h) => {
                    // Criterio de búsqueda
                    let criteria = {};
                    if (req.query.criterio != null ){
                        criteria = { $or:[{ "_nombre" : {$regex : ".*"+req.query.criterio+".*"}},
                        {"_creador" : {$regex : ".*"+req.query.criterio+".*"}}
                    ] };
                    }
                    criteria._visibilidad = 'public';
                    // Buscamos el torneo
                    let torneos = await torneoRepo.search(criteria).then((torneos) => {
                        return torneos;
                    });
                    // Transformar a objetos de nuestro modelo
                    torneos = module.exports.getTorneos(torneos);
                    // Recortamos el nombre para la interfaz
                    torneos.forEach( (torneo) => {
                        if (torneo.nombre.length > 25){
                            torneo.nombre = torneo.nombre.substring(0, 25) + "...";
                        }
                        torneo.inicioInscripcion = module.exports.getFechaBonita(torneo.inicioInscripcion);
                        torneo.finInscripcion= module.exports.getFechaBonita(torneo.finInscripcion);
                        torneo.disponible = true;
                        let ahora = module.exports.getFechaBonita(new Date());
                        if (ahora > torneo.finInscripcion || ahora < torneo.inicioInscripcion){
                            torneo.disponible = false;
                        }
                        if(module.exports.getUsuarioIdentificado(req) !== null){
                            torneo.unido = false;
                            torneo.equipos.forEach(equipo => {
                                if(equipo == module.exports.getUsuarioIdentificado(req))
                                {
                                    torneo.unido = true;
                                }
                            });
                         } else {
                            torneo.unido = false;
                         }
                    });
                    // Obtenemos la vista
                    return h.view('torneos/torneos',
                    {
                        torneos,
                        usuarioAutenticado: module.exports.getUsuarioIdentificado(req)
                    },
                    { layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/{param*}',
                handler: {
                    directory: {
                        path: './public'
                    }
                }
            },
            {
                method: 'GET',
                path: '/',
                handler: async (req, h) => {
                    return h.view('index',
                    {
                        usuarioAutenticado: module.exports.getUsuarioIdentificado(req)
                    },
                    { layout: 'base'});
                }
            },
            /* VER ESTADÍSTICAS */
            {
                method: 'GET',
                path: '/torneos/{id}/stats',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Criterio de búsqueda
                    let criteria = {"_id": require("mongodb").ObjectID(req.params.id)};
                    // Buscamos con paginación
                    let torneo = await torneoRepo.search(criteria).then(torneos => {
                        return torneos[0];
                    });
                    // Transformar a objetos de nuestro modelo
                    torneo = module.exports.getTorneo(torneo);

                    // Calcular stats
                    let equipos = [];
                    torneo.equipos.forEach(equipo => {
                        let golesFavor = 0;
                        let golesContra = 0;
                        torneo.partidos.forEach(partido =>{
                            if((partido.equipoLocal === equipo || partido.equipoVisitante === equipo)&&typeof(partido.resultado.golesEquipoLocal) == 'number'
                            && typeof(partido.resultado.golesEquipoVisitante) == 'number'){
                                if(partido.equipoLocal === equipo){
                                    golesFavor += partido.resultado.golesEquipoLocal;
                                    golesContra += partido.resultado.golesEquipoVisitante;
                                }else{
                                    golesFavor += partido.resultado.golesEquipoVisitante;
                                    golesContra += partido.resultado.golesEquipoLocal;
                                }
                            }
                        });
                        let diferencia = golesFavor - golesContra;
                        equipos.push({
                            nombre: equipo,
                            golesFavor: golesFavor,
                            golesContra: golesContra,
                            diferencia: diferencia
                        });
                    });
                    // Obtenemos la vista
                    return h.view('torneos/stats',
                        {
                            torneo,
                            equipos,
                            usuarioAutenticado: req.auth.credentials
                        },
                        {layout: 'base'});
                }
            },
            {
                method: 'POST',
                path: '/torneos/{id}/resultado',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    let criteria = {"_id": require("mongodb").ObjectID(req.params.id)};
                    let torneo = await torneoRepo.search(criteria).then(torneos => {
                        return torneos[0];
                    });
                    // Transformar a objetos de nuestro modelo
                    torneo = module.exports.getTorneo(torneo);
                    let claves = Object.keys(req.payload)
                    let equipoLocal = claves[0];
                    let equipoVisitante = claves[1];
                    let golesEquipoLocal = parseInt(req.payload[claves[0]]);
                    let golesEquipoVisitante = parseInt(req.payload[claves[1]]);

                    let index = 0;

                    for (let i=0; i < torneo.partidos.length; i++){
                        if (torneo.partidos[i].equipoLocal == equipoLocal && torneo.partidos[i].equipoVisitante == equipoVisitante){
                            torneo.partidos[i].resultado.golesEquipoLocal = golesEquipoLocal;
                            torneo.partidos[i].resultado.golesEquipoVisitante = golesEquipoVisitante;
                            index = i;
                        }
                    }


                    let newIndex = Math.ceil((index + 1) / 2) + Math.floor(torneo.partidos.length / 2);

                    console.log(index)
                    console.log(newIndex)

                    if (newIndex < torneo.partidos.length){
                        console.log("asd");
                        if (index % 2 == 1){
                            if (golesEquipoLocal > golesEquipoVisitante){
                                torneo.partidos[newIndex].equipoVisitante = equipoLocal
                            } else {
                                torneo.partidos[newIndex].equipoVisitante = equipoVisitante
                            }
                        } else {
                            if (golesEquipoLocal > golesEquipoVisitante){
                                torneo.partidos[newIndex].equipoLocal = equipoLocal
                            } else {
                                torneo.partidos[newIndex].equipoLocal = equipoVisitante
                            }
                        }
                    }
                    // Modificamos el usuario
                    let respuesta = null;
                    await torneoRepo.update(torneo).then((id) => {
                        if (id == null) {
                            respuesta =  h.redirect('/torneos/' + req.params.id + "/ver")
                        } else {
                            respuesta = h.redirect('/torneos/' + req.params.id + "/ver");
                        }
                    });

                    return respuesta;




                }
            }
        ])
    }
};
