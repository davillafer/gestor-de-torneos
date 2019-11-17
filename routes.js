const categorias = require('./models/Categoria');
const ObjectID = require("mongodb").ObjectID;
const FutbolFactory = require('./factory/FutbolFactory');
const futbolFactory = new FutbolFactory();
const TorneoFutbol = require('./models/TorneoFutbol');

module.exports = {
    name: 'MiRouter',
    utilSubirFichero : async (binario, nombre, extension) => {
        return new Promise((resolve, reject) => {
            nombre = nombre + "." + extension;
            require('fs').writeFile('./public/subidas/'+nombre, binario, err => {
                if (err) {
                    resolve(false)
                }
                resolve(true)
            })
        })
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
    getIdUsuarioIdentificado(req){
        if(req.auth.credentials !== null){
            return req.auth.credentials;
        }else if(req.state['session-id'] != null && req.state['session-id'].usuario !=""){
            return req.state['session-id']; // TODO: Hay que sacar el id de la base de datos
        }else{
            return null;
        }
    },
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
    register: async (server, options) => {
        miserver = server;        
        equipoRepo = server.methods.getEquipoRepo();
        torneoRepo = server.methods.getTorneoRepo();

        server.route([
            /* ELIMINAR TORNEOS */
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
                    // Comprobar si aun pueden inscribirse
                    let ahora = new Date();
                    if (ahora < torneo.finInscripcion)
                        torneo.equipos.push(req.state["session-id"].usuario);
                    else
                        return h.redirect('/torneos?mensaje=Ya no permite inscripciones el torneo&tipoMensaje=danger');
                    // Actualizar bd
                    let result = null;
                    await torneoRepo.update(torneo).then((result) => {
                        if(result)
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
                        let equipos = torneo.equipos;
                        let equiposLength = equipos.length;
                        let equipoAnterior = undefined;
                        for (let i = 0; i < equiposLength; i++){
                            let number = Math.floor(Math.random() * equipos.length);
                            if (equipoAnterior === undefined){
                                equipoAnterior = equipos[number];
                                equipos.splice(number, 1);
                            } else {
                                let partido = {
                                    equipoLocal : equipoAnterior,
                                    equipoVisitante : equipos[number]
                                };
                                equipoAnterior = undefined;
                                equipos.splice(number, 1);
                                torneo.partidos.push(partido)
                            }
                        }
                        let columna = torneo.partidos.length;
                        while(columna > 1) {
                            for (let i = 0; i < columna; i += 2) {
                                let partido = {
                                    equipoLocal: "Por Determinar",
                                    equipoVisitante: "Por Determinar"
                                };
                                columna = 0;
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
                        if (torneo.partidos.length == 1){
                            partidos = torneo.partidos;
                        } else {
                            while(true){
                                if (auxTorneos.length == 0){
                                    let half = Math.floor(torneo.partidos.length / 2) +1;
                                    partidos.push(torneo.partidos.slice(0, half));
                                    auxTorneos = torneo.partidos.slice(half, torneo.partidos.length);
                                } else {
                                    let half = Math.floor(auxTorneos.length / 2) +1;
                                    partidos.push(auxTorneos.slice(0, half));
                                    auxTorneos = auxTorneos.slice(half, auxTorneos.length);
                                }
                                if (auxTorneos.length == 1){
                                    partidos.push(auxTorneos);
                                    break;
                                }
                            }
                        }
                    } else {
                        let auxTorneos = [];
                        if (torneo.partidos.length == 1){
                            partidos = torneo.partidos;
                        } else {
                            while(true){
                                if (auxTorneos.length == 0){
                                    let half = Math.floor(torneo.partidos.length / 2) +1;
                                    partidos.push(torneo.partidos.slice(0, half));
                                    auxTorneos = torneo.partidos.slice(half, torneo.partidos.length);
                                } else {
                                    let half = Math.floor(auxTorneos.length / 2) +1;
                                    partidos.push(auxTorneos.slice(0, half));
                                    auxTorneos = auxTorneos.slice(half, auxTorneos.length);
                                }
                                if (auxTorneos.length == 1){
                                    partidos.push(auxTorneos);
                                    break;
                                }
                            }
                        }
                    }
                    return h.view('torneos/ver',
                        {
                            torneo: torneo,
                            partidos: partidos,
                            usuarioAutenticado: req.state["session-id"].usuario,
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
                    // Comprobar que ambas contraseñas son iguales
                    if (req.payload.password !== req.payload.repassword)
                        return h.redirect('/registro?mensaje="Passwords distintas"'); // Contraseña no salta, debe ser por la 'ñ'
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
                    let user = await equipoRepo.search({ 'usuario': req.state['session-id'].usuario }).then( async result => {
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
                                usuarioAutenticado: req.state["session-id"].usuario
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
                    let numEquipos = [2, 4, 8, 16, 32];
                    // Categorías disponibles
                    let categoria = categorias.categorias;
                    // Obtenemos la vista
                    return h.view('torneos/crear',
                        {
                            categoria,
                            numEquipos,
                            usuarioAutenticado: req.state['session-id'].usuario,
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
                    torneo.creador = req.state['session-id'].usuario;
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
                    let criteria = { _creador : req.state['session-id'].usuario };
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
                            usuarioAutenticado: req.state['session-id'].usuario,
                            paginas
                        },
                        { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/torneos',
                handler: async (req, h) => {

                    var criterio = {};
                    if (req.query.criterio != null ){
                        criterio = { "nombre" : {$regex : ".*"+req.query.criterio+".*"}};
                    }
                    await torneoRepo.search(criterio)
                        .then((torneos) => {
                            totalTorneos = torneos;
                        })

                    
                    totalTorneos.forEach( (e) => {
                        if (e.nombre.length > 25){
                            e.nombre =
                                e.nombre.substring(0, 25) + "...";
                        }
                         e.inicioInscripcion = module.exports.getFechaBonita(e.inicioInscripcion);
                         e.finInscripcion= module.exports.getFechaBonita(e.finInscripcion);
                         e.categoria = require('./models/Categoria').categorias[e.categoria];
                         e.disponible = true;
                         if (module.exports.getFechaBonita(new Date()) > e.finInscripcion){
                            e.disponible = false;
                         }
                         if(module.exports.getUsuarioIdentificado(req) != null){
                            e.unido = false;
                            e.equipos.forEach(equipo => {
                                if(equipo == module.exports.getUsuarioIdentificado(req))
                                {
                                    e.unido = true;
                                }
                            });
                         }
                         else{
                            e.unido = false;
                         }
                    });

                    return h.view('torneos/torneos',
                        {                            
                            torneos: totalTorneos,
                            usuarioAutenticado : module.exports.getUsuarioIdentificado(req)
                        }, { layout: 'base'} );
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
                path: '/anuncio/{id}',
                handler: async  (req, h) => {
                    return 'Anuncio id: ' + req.params.id;
                }
            },
            {
                method: 'GET',
                path: '/',
                handler: async (req, h) => {
                    
                    return h.view('index',
                        {
                            usuarioAutenticado: module.exports.getUsuarioIdentificado(req),
                            usuarioIdentificadoId: module.exports.getIdUsuarioIdentificado(req)
                        },
                        { layout: 'base'});
                }
            },{
                method: 'GET',
                path: '/api/',
                handler: async (req, h) => {
                    return  {usuarioAutenticado: module.exports.getUsuarioIdentificado(req)};
                }
            }
        ])
    }
}
