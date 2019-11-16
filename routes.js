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
    
    register: async (server, options) => {
        miserver = server;        
        equipoRepo = server.methods.getEquipoRepo();
        torneoRepo = server.methods.getTorneoRepo();





        server.route([
            {
                method: 'GET',
                path: '/torneos/inscrito',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {        

                    var criterio = null;
                    // cookieAuth

                    await torneoRepo.search(criterio)
                        .then((torneos) => {
                             totalTorneos = torneos;                            
                        });

                    var torneosInscrito = [];
                        
                    totalTorneos.forEach(torneo => {
                        torneo.inicioInscripcion = module.exports.getFechaBonita(torneo.inicioInscripcion);
                        torneo.finInscripcion = module.exports.getFechaBonita(torneo.finInscripcion);
                        torneo.equipos.forEach(equipo => {
                            if (equipo == req.auth.credentials)
                            {
                                torneosInscrito.push(torneo);
                            }
                        })
                    })

                    return h.view('torneos/inscrito',
                        {
                            torneos: torneosInscrito,
                            usuarioAutenticado: req.auth.credentials                            
                        },
                        { layout: 'base'} );
                }
            },
            {
                method: 'GET',
                path: '/torneos/{id}/unirse',
                options:
                {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                   

                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};
                    
        
                    await torneoRepo.search(criterio)
                        .then((torneos) => {
                            torneo = torneos[0];
                    });
                    
                    torneo.equipos.forEach(equipo_nombre => {
                        if(equipo_nombre == req.auth.credentials)
                        {
                            respuesta = '/torneos?mensaje=Ya se ha unido al torneo&tipoMensaje=danger';
                        }
                    });

                    torneo.equipos.push(req.auth.credentials);

                    await torneoRepo.update(torneo) .then((result) => {
                        if(result)
                            respuesta ='/torneos?mensaje=Se ha unido al torneo&tipoMensaje=success';
                        else
                        {
                           respuesta = '/torneos?mensaje=No se ha podido unirse&tipoMensaje=danger';                      
                        }

                });;

                return h.redirect(respuesta);
                    

                    
                }
            },
            {
                method: 'GET',
                path:
                    '/torneos/{id}/ver',
                options:
                    {
                        auth: 'auth-registrado'
                    },
                handler: async (req, h) => {


                    var criterio = {"_id": require("mongodb").ObjectID(req.params.id)};
                    var torneo;

                    ///HAZLO CON TORNEOREPO.SEARCH
                    // await TorneoRepo.search(criterio)
                    //     .then((torneos) => {
                    //         torneo = torneos[0];
                    //     });


                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerFormularios(db, criterio)) // TorneoRepo.search(criterio)
                        .then((torneos) => {
                            torneo = torneos[0];
                        });

                    partidos = [];
                    if (torneo.partidos == []){
                        if (true){
                            equipos = torneo.equipos;
                            equiposLenght = equipos.length;
                            equipoAnterior = undefined;
                            for(i = 0; i < equiposLenght; i++){
                                number = Math.floor(Math.random() * (equipos.length - 0)) + 0;
                                if (equipoAnterior == undefined){
                                    equipoAnterior = equipos[number];
                                    equipos.splice(number, 1);
                                } else {
                                    partido = {
                                        equipoLocal : equipoAnterior,
                                        equipoVisitante : equipos[number]
                                    }
                                    equipos.splice(number, 1);
                                    torneo.partidos.push(partido)
                                }
                            }


                            auxTorneos = [];
                            while(true){
                                if (auxTorneos == []){
                                    let half = Math.floor(torneo.partidos.length / 2);
                                    partidos.push(torneo.partidos.slice(0, half));
                                    auxTorneos = torneo.partidos.slice(half, torneo.partidos.length);
                                } else {
                                    let half = Math.floor(auxTorneos.length / 2);
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
                        auxTorneos = [];
                        while(true){
                            if (auxTorneos == []){
                                let half = Math.floor(torneo.partidos.length / 2);
                                partidos.push(torneo.partidos.slice(0, half));
                                auxTorneos = torneo.partidos.slice(half, torneo.partidos.length);
                            } else {
                                let half = Math.floor(auxTorneos.length / 2);
                                partidos.push(auxTorneos.slice(0, half));
                                auxTorneos = auxTorneos.slice(half, auxTorneos.length);
                            }
                            if (auxTorneos.length == 1){
                                partidos.push(auxTorneos);
                                break;
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
                path: '/anuncio/{id}/eliminar',
                handler: async (req, h) => {

                    var criterio = { "_id" :
                            require("mongodb").ObjectID(req.params.id) };

                    await repositorio.conexion()
                        .then((db) => repositorio.eliminarAnuncios(db, criterio))
                        .then((resultado) => {
                            console.log("Eliminado")
                        })

                    return h.redirect('/misanuncios?mensaje="Anuncio Eliminado"')
                }
            },
            {
                method: 'POST',
                path: '/anuncio/{id}/modificar',
                options : {
                    auth: 'auth-registrado',
                    payload: {
                        output: 'stream'
                    }
                },
                handler: async (req, h) => {

                    // criterio de anucio a modificar
                    var criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id),
                        "usuario": req.auth.credentials
                    }

                    // nuevos valores para los atributos
                    anuncio = {
                        usuario: req.auth.credentials ,
                        titulo: req.payload.titulo,
                        descripcion: req.payload.descripcion,
                        categoria: req.payload.categoria,
                        precio: Number.parseFloat(req.payload.precio),
                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta
                    await repositorio.conexion()
                        .then((db) => repositorio.modificarAnuncio(db,criterio,anuncio))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =  h.redirect('/misanuncios?mensaje="Error al modificar"')
                            } else {
                                respuesta = h.redirect('/misanuncios?mensaje="Anuncio modificado"')
                            }
                        })

                    // ¿nos han enviado foto nueva?
                    if ( req.payload.foto.filename != "") {
                        binario = req.payload.foto._data;
                        extension = req.payload.foto.hapi.filename.split('.')[1];

                        await module.exports.utilSubirFichero(
                            binario, req.params.id, extension);
                    }

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path: '/anuncio/{id}/modificar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var criterio = {
                        "_id" : require("mongodb").ObjectID(req.params.id),
                        "usuario": req.auth.credentials
                    }
                    await repositorio.conexion()
                        .then((db) => repositorio.obtenerAnuncios(db, criterio))
                        .then((anuncios) => {
                            // ¿Solo una coincidencia por _id?
                            anuncio = anuncios[0];
                        })

                    return h.view('modificar',
                        { anuncio: anuncio},
                        { layout: 'base'} );
                }
            },
            {
                method: 'POST',
                path: '/publicar',
                options : {
                    auth: 'auth-registrado',
                    payload: {
                        output: 'stream'
                    }
                },
                handler: async (req, h) => {

                    anuncio = {
                        usuario: req.auth.credentials ,
                        titulo: req.payload.titulo,
                        descripcion: req.payload.descripcion,
                        categoria: req.payload.categoria,
                        precio: Number.parseFloat(req.payload.precio),

                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta

                    await repositorio.conexion()
                        .then((db) => repositorio.insertarAnuncio(db, anuncio))
                        .then((id) => {
                            respuesta = "";
                            if (id == null) {
                                respuesta =   h.redirect('/misanuncios?mensaje="Error al insertar"')
                            } else {
                                respuesta = h.redirect('/misanuncios?mensaje="Anuncio Insertado"')
                                idAnuncio = id;
                            }
                        })

                    binario = req.payload.foto._data;
                    extension = req.payload.foto.hapi.filename.split('.')[1];

                    await module.exports.utilSubirFichero(
                        binario, idAnuncio, extension);

                    return respuesta;
                }
            },
            {
                method: 'GET',
                path: '/publicar',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    return h.view('publicar',
                        { usuario: 'jordán'},
                        { layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/base',
                handler: {
                    view: 'layout/base'
                }
            },
            {
                method: 'GET',
                path: '/registro',
                handler: async (req, h) => {
                    return h.view('registro',
                        { },
                        { layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/login',
                handler: async (req, h) => {
                    return h.view('login',
                        { },
                        { layout: 'base'});
                }
            },
            {
                method: 'GET',
                path: '/desconectarse',
                handler: async (req, h) => {
                    req.cookieAuth.set({ usuario: "", secreto: "" });
                    return h.view('login',
                        { },
                        { layout: 'base'});
                }
            },
            {
                method: 'POST',
                path: '/login',
                handler: async (req, h) => {
                    password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');

                    usuarioBuscar = {
                        usuario: req.payload.usuario,
                        password: password,
                    }

                    // await no continuar hasta acabar esto
                    // Da valor a respuesta

                    await equipoRepo.search(usuarioBuscar).then((usuarios) => {
                        respuesta = "";
                        if (usuarios == null || usuarios.length == 0 ) {
                            respuesta =  h.redirect('/login?mensaje=Usuario o password incorrecto&tipoMensaje=danger')
                        } else {
                            req.cookieAuth.set({
                                usuario: usuarios[0].usuario,
                                secreto : "secreto"
                            });
                            respuesta = h.redirect('/')

                        }
                    })
                    return respuesta;
                }
            },
            {
                method: 'POST',
                path: '/registro',
                handler: async (req, h) => {
                    let respuesta;

                    // Comprobar que ambas contraseñas son iguales
                    if (req.payload.password !== req.payload.repassword)
                        return h.redirect('/registro?mensaje="Passwords distintas"'); // Contraseña no salta, debe ser por la 'ñ'

                    let password = require('crypto').createHmac('sha256', 'secreto')
                        .update(req.payload.password).digest('hex');

                    let usuario = {
                        usuario: req.payload.usuario,
                        nombre: req.payload.nombre,
                        color: req.payload.color,
                        password: password
                    }

                    await equipoRepo.search({'usuario': usuario.usuario}).then( async (result) => {
                       if (result.length !== 0) {
                           respuesta =  h.redirect('/registro?mensaje="Usuario no disponible"');
                       } else {
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
            {
                method: 'GET',
                path: '/perfil',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {
                    // Obtenemos la información del usuario
                    let user = await equipoRepo.search({ 'usuario': req.state['session-id'].usuario })
                        .then( async result => {
                            if (result) {
                                return result[0];
                            } else {
                                return null;
                            }
                    });
                    // Comprobamos si hay error
                    if ( user ) {
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
            {
                method: 'POST',
                path: '/perfil',
                handler: async (req, h) => {
                    let respuesta;

                    let usuario = {
                        usuario: req.payload.usuario,
                        nombre: req.payload.nombre,
                        color: req.payload.color
                    }

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
            {
                method: 'GET',
                path: '/torneos/crear',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {                    
                    const categoria = require('models/Categoria');
                    console.log(categoria);
                    let equipos = [2, 4, 8, 16, 32];
                    return h.view('torneos/crear',
                        {
                            categoria,
                            equipos,
                            usuarioAutenticado: req.auth.credentials,
                        },
                        { layout: 'base'}
                    );
                }
            },
            {
                method: 'GET',
                path: '/torneos/creados',
                options: {
                    auth: 'auth-registrado'
                },
                handler: async (req, h) => {

                    var pg = parseInt(req.query.pg); 
                    if ( req.query.pg == null){ // Puede no venir el param
                        pg = 1;
                    }

                    var criterio = { "creador" : req.auth.credentials };
                    // cookieAuth

                    await torneoRepo.searchPg(pg, criterio)
                        .then((torneos, total) => {
                             totalTorneos = torneos;
                            pgUltima = totalTorneos.total/2;

                            // La págian 2.5 no existe
                            // Si excede sumar 1 y quitar los decimales
                            if (pgUltima % 2 > 0 ){
                                pgUltima = Math.trunc(pgUltima);
                                pgUltima = pgUltima+1;
                            }
                        })

                    totalTorneos.forEach(torneo => {
                        torneo.inicioInscripcion = module.exports.getFechaBonita(torneo.inicioInscripcion);
                        torneo.finInscripcion = module.exports.getFechaBonita(torneo.finInscripcion);
                    })


                    var paginas = [];
                    for( i=1; i <= pgUltima; i++){
                        if ( i == pg ){
                            paginas.push({valor: i , clase : "uk-active" });
                        } else {
                            paginas.push({valor: i});
                        }
                    }
                    
                    return h.view('torneos/mistorneos',
                        {
                            torneos: totalTorneos,
                            usuarioAutenticado: req.auth.credentials,
                            paginas : paginas
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
