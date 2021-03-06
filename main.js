// Módulos
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const Cookie = require('@hapi/cookie');
const routes = require("./controladores/routes.js");
const EquipoRepo = require("./gest_usuarios/EquipoRepo");
const TorneoRepo = require("./gest_torneos/TorneoRepo");
const dotenv = require('dotenv');
dotenv.config();
// Servidor
const server = Hapi.server({
    port: process.env.PORT, // USAR EL .ENV
    //host: 'localhost',
});


// declarar metodos comunes  
server.method({
    name:'getEquipoRepo',
    method: () => {
        return new EquipoRepo();
    },
    options: {}
});

server.method({
    name:'getTorneoRepo',
    method: () => {
        return new TorneoRepo();
    },
    options: {}
});

const iniciarServer = async () => {
    try {
        // Registrar el Inter antes de usar directory en routes
        await server.register(Inert);
        await server.register(Vision);
        await server.register(Cookie);
        //Configurar seguridad

        await server.auth.strategy('auth-registrado', 'cookie', {
            cookie: {
                name: 'session-id',
                password: 'secretosecretosecretosecretosecretosecretosecreto',
                isSecure: false
            },
            redirectTo: '/login',
            validateFunc: function (request, cookie){
                promise = new Promise((resolve, reject) => {

                    usuarioCriterio = {"usuario": cookie.usuario};
                    if ( cookie.usuario != null && cookie.usuario != "" &&
                        cookie.secreto == "secreto"){

                        resolve({valid: true,
                            credentials: cookie.usuario});

                    } else {
                        resolve({valid: false});
                    }
                });

                return promise;
            }
        });

        var handlebars = require('handlebars');
        handlebars.registerHelper("sumar", (a, b) => {
            return a + b;
        });

        var handlebars = require('handlebars');
        handlebars.registerHelper("empty", (a) => {
            return a.length == 0;
        });

        await server.register(routes);
        await server.views({
            engines: {
                html: require('handlebars')
            },
            relativeTo: __dirname,
            path: './visualizacion/views',
            layoutPath: './visualizacion/views/layout',
            context : {
                sitioWeb: "wallapep"
            }
        });
        await server.start();
        console.log('Servidor localhost:8080');
    } catch (error) {
        console.log('Error '+error);
    }
};

iniciarServer();


/**
server.start();

console.log("Inicio Server 8080")

// Enrutador
server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        return 'Página principal, hola ' +request.query.nombre;
    }
});
 **/
