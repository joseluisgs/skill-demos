// LIBRERÍAS
const Alexa = require('ask-sdk-core');
const func = require('./funciones'); // Mis funciones y otras cosas usadas aqui: operaciones de fechas, crear recordatorio
// Fichero de configuración de permisos y variables globales
const configuracion = require('./configuracion');
const interceptors = require('./interceptors'); // Interceptores
const util = require('./util'); // funciones de utilidad. Aquí está la persistencia, recordatorios,  ahora y se exporta como util. Mirad en = Alexa.SkillBuilders
const moment = require('moment-timezone'); // Para manejar fechas


//LANZAMIENTO - INTENCION
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    // Proceso
    handle(handlerInput) {
       // Necesitamos serviceClientFactory para acceder a la API
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        // Para manejar la sesion
        const sessionAttributes = attributesManager.getSessionAttributes();
         
        // Cargamos los atrinbutos de sesion 
        const dia = sessionAttributes['dia'];
        const mesNombre = sessionAttributes['mesNombre'];
        const mes = sessionAttributes['mesID'];
        const anno = sessionAttributes['anno'];
        const nombre = sessionAttributes['nombre'] || '';
        const sessionCounter = sessionAttributes['sessionCounter']; // Contador de sesiones
        
        
        // Variable de mensaje
        // Si no hay sesión, damos la bienvenida, si existe le damos bienvenida de registrado
        let mensajeHablado = !sessionCounter ? handlerInput.t('WELCOME_MSG', {nombre: nombre}) : handlerInput.t('WELCOME_BACK_MSG', {nombre: nombre});
         
         // Si existen los mensajes, mostramos
        if(dia && mesNombre && anno) {
            // Si queremos que nos indique ya nuestro cumpleaños nada más arrancar
             //mensajeHablado += handlerInput.t('REGISTER_MSG', {nombre:nombre, dia: dia, mes: mesNombre, anno: anno});  // COMENTAR EN EXPERIMENTO
            // Si queremos que nos diga los dias para nuestro cumple o si es nuestro cumple
            
            return DiasParaCumpleIntentHandler.handle(handlerInput);  // DESCOMENTAR EN EXPERIMENTO
            
        }
        
        return handlerInput.responseBuilder
            .speak(mensajeHablado)
            // Pantalla principal con un StandardCard.
            .withStandardCard(
                handlerInput.t('LAUNCH_HEADER_MSG'),
                mensajeHablado,
                util.getS3PreSignedUrl('Media/full_icon_512.png'))
            // usamos el encadenamiento de intenciones para activar el registro de cumpleaños en varios usos seguidos. Delegamos el control de dialogo a otro intent
            .addDelegateDirective({
                name: 'RegistrarCumpleIntent', // Intent que lo hará
                confirmationStatus: 'NONE', // Si necesitamos confirmar
                slots: {} // Slots
            })
            
            .getResponse();
            
    }
};

// REGISTRAR CUMPLEAÑOS - INTENCION
const RegistrarCumpleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrarCumpleIntent';
    },
    //Proceso
    handle(handlerInput) {
        // Recogemos los la entrada entrada - handler Input
        const {attributesManager,requestEnvelope, responseBuilder} = handlerInput;
        // Tomamos su intención y con ello la estructura de datos donde nos llega los slots
        const {intent} = requestEnvelope.request;
        // Atributos de sesiónconst 
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        
        // Creamos mensaje
        let mensajeHablado = handlerInput.t('REJECTED_MSG');

        // Si todo esta confirmado
        //if (intent.confirmationStatus === 'CONFIRMED') {
            //Tomamos los slots y los almacenamos en variables
            const dia = Alexa.getSlotValue(requestEnvelope, 'dia');
            const anno = Alexa.getSlotValue(requestEnvelope, 'anno');
            //const mes = Alexa.getSlotValue(requestEnvelope, 'mes');
            // Vamos a almacenar también el id del mes y su nombre, por eso hemos cambiado lo de antes
            const mesNombre = Alexa.getSlotValue(requestEnvelope, 'mes');
            const mesID = func.getIDMes(mesNombre); // Sacamos el mes, podíamos hacerlo como const mesSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id; //MM
            
            // Si existen
            if (dia && anno && mesNombre && mesID) {
                // Almacenamos en la sesión
                sessionAttributes['dia'] = dia;
                sessionAttributes['mesID'] = mesID; //MM
                sessionAttributes['mesNombre'] = mesNombre;
                sessionAttributes['anno'] = anno;
                
                // Una vez tengamos los días se los pasamos para ver cunto queda o si es nuestro cumple
                return DiasParaCumpleIntentHandler.handle(handlerInput);
                
            }
        // Devolvemos la salida
       return handlerInput.responseBuilder
            .speak(handlerInput.t('REJECTED_MSG'))
            .withSimpleCard("Cumpleaños", handlerInput.t('REJECTED_MSG'))
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

// DIAS PARA CUMPLE -INTENT
const DiasParaCumpleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DiasParaCumpleIntent';
    },
    // Le ponemos asíncrono porque vamos a indicar los cumpleaños de la gente
    async handle(handlerInput) {
        // Recuperamos la sesion
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        // Nos traemos los atributos
        const dia = sessionAttributes['dia'];
        const mesNombre = sessionAttributes['mesNombre'];
        const mes = sessionAttributes['mesID'];
        const anno = sessionAttributes['anno'];
        const sessionCounter = sessionAttributes['sessionCounter']; // Contador de sesiones
        const nombre = sessionAttributes['nombre'] || ''; // Nombre
        let timezone = sessionAttributes['timezone'];
        
        let mensajeHablado = !sessionCounter ? handlerInput.t('WELCOME_MSG', {nombre: nombre}) : handlerInput.t('WELCOME_BACK_MSG',{nombre: nombre});
        let textoPantalla='';
        // Si existen
        if (dia && mes && anno) {
            // Buscamos el timezone
            if (!timezone) {
                //timezone = 'Europe/Rome';  // por si no funciona en el simulador
                return handlerInput.responseBuilder
                    .speak(handlerInput.t('NO_TIMEZONE_MSG'))
                    .getResponse();
            }
            
            timezone = timezone? timezone : 'Europe/Madrid'; // Fijamos la zona horaria
            
            // Obtenemos la estructura de información de los datos de cumpleaños
            const datosCumple = func.getDatosCumple(dia, mes, anno, timezone);
            // Metemos algunas cosas en la sesión. Revisar en interceptor si las queremos guardar en BD
            sessionAttributes['edad'] = datosCumple.edad;
            sessionAttributes['diasParaCumple'] = datosCumple.diasParaCumple;
            
            
            
            const hoy = moment().tz(timezone).startOf('day'); // Obtenemos la fechas
             // Calculamos cuando nacimos en base a la fecha registrada
            const naciste = moment(`${mes}/${dia}/${anno}`, "MM/DD/YYYY").tz(timezone).startOf('day');
            // Calculamos el proximo cumple
            const proximoCumple = moment(`${mes}/${dia}/${hoy.year()}`, "MM/DD/YYYY").tz(timezone).startOf('day');
            
            // Preparamos los mensajes
            
            // Si quedan días para el cumple
            if(datosCumple.diasParaCumple>0){
                mensajeHablado += handlerInput.t('DAYS_LEFT_MSG', {nombre: nombre, count: datosCumple.diasParaCumple});
                mensajeHablado += handlerInput.t('WILL_TURN_MSG', {count: datosCumple.edad + 1});
            } 
            // PAsamos el texto a la pantalla...
            textoPantalla = mensajeHablado;
            
            // Si es nuestro cumpleaños
            if (datosCumple.diasParaCumple===0) { //¡Es nuestro cumpleaños!
                textoPantalla = handlerInput.t('FELICITACION_MSG', {nombre: nombre});
                mensajeHablado = handlerInput.t('GREET_MSG', {nombre: nombre});
                mensajeHablado += handlerInput.t('NOW_TURN_MSG', {count: datosCumple.edad});
                 textoPantalla += handlerInput.t('NOW_TURN_MSG', {count: datosCumple.edad});
                // Ahora vamos a concatenarle los cumpleaños importantes de hoy
                const fechaActual = func.getFechaActual(timezone);
                // obtenemos los cumpleaños acediendo a nuestra API, ver CUMPLEAÑOS DE FAMOSOS -INTENT
                const respuesta = await func.getCumpleFamosos(fechaActual.dia, fechaActual.mes, configuracion.MAX_CUMPLES);
                console.log(JSON.stringify(respuesta));
                // convertimos a texto hablado
                const textoRespuesta = func.convertirCumplesResponse(handlerInput, respuesta, false);
                mensajeHablado += textoRespuesta;
                
            }
            
            
            mensajeHablado += handlerInput.t('POST_SAY_HELP_MSG');
            
            // Pintamos la pantalla 
            if(util.supportsAPL(handlerInput)) {
                const {Viewport} = handlerInput.requestEnvelope.context;
                const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
                handlerInput.responseBuilder.addDirective({
                        type: 'Alexa.Presentation.APL.RenderDocument',
                        version: '1.1',
                        document: configuracion.APL.launchDoc,
                        datasources: {
                            launchData: {
                                type: 'object',
                                properties: {
                                    headerTitle: handlerInput.t('LAUNCH_HEADER_MSG'),
                                    mainText: textoPantalla,
                                    hintString: handlerInput.t('LAUNCH_HINT_MSG'),
                                    logoImage: Viewport.pixelWidth > 480 ? util.getS3PreSignedUrl('Media/full_icon_512.png') : util.getS3PreSignedUrl('Media/full_icon_108.png'),
                                    backgroundImage: util.getS3PreSignedUrl('Media/straws_'+resolution+'.png'),
                                    backgroundOpacity: "0.5"
                                },
                                transformers: [{
                                    inputPath: 'hintString',
                                    transformer: 'textToHint',
                                }]
                            }
                        }
                    });
            
            }
        }else {
            mensajeHablado += handlerInput.t('MISSING_MSG');
            // unsamos delegación de intenciones para lanzar otro intent
            handlerInput.responseBuilder.addDelegateDirective({
                name: 'RegistrarCumpleIntent',
                confirmationStatus: 'NONE',
                slots: {}
            });
        }
        
        // Devolvemos
        return handlerInput.responseBuilder
            //.withStandardCard('Cumpleaños',mensajeHablado, util.getS3PreSignedUrl('Media/papers_480x480.png'))
            .speak(mensajeHablado)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

// RECORDATORIO PARA CUMPLE -INTENT
const RecordatorioCumpleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RecordatorioCumpleIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;

        const dia = sessionAttributes['dia'];
        const mesNombre = sessionAttributes['mesNombre'];
        const mes = sessionAttributes['mesID'];
        const anno = sessionAttributes['anno'];
        const sessionCounter = sessionAttributes['sessionCounter']; // Contador de sesiones
        const nombre = sessionAttributes['nombre'] || ''; // Nombre
        let timezone = sessionAttributes['timezone'];
        
        const mensajeEntrada = Alexa.getSlotValue(requestEnvelope, 'mensaje');
        
        //timezone = timezone? timezone : 'Europe/Madrid'; // Fijamos la zona horaria si no existe
        
        // Si NO esta confirmado
        if (intent.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(handlerInput.t('CANCEL_MSG') + handlerInput.t('REPROMPT_MSG'))
                .reprompt(handlerInput.t('REPROMPT_MSG'))
                .getResponse();
        }
        
        // Texto de salida 
        let mensajeHablado = '';
        
        // Si tenemos los datos
        if (dia && mes && anno){
            if (!timezone){
                //timezone = 'Europe/Madrid'; 
                return handlerInput.responseBuilder
                    .speak(handlerInput.t('NO_TIMEZONE_MSG'))
                    .getResponse();
            }

            const datosCumple = func.getDatosCumple(dia, mes, anno, timezone);
            let errorFlag = false;
            // Creamos el recordatorio usando la API Remiders
            // Hay que darle permisos en Build -> Prmissions
            // o saltara la excepción.
            try {
                // Para accedera los permisos
                const {permissions} = requestEnvelope.context.System.user;
                
                if (!(permissions && permissions.consentToken))
                    throw { statusCode: 401, message: 'No tienes permisos disponibles' }; // No tienes permisos o no has inicializado la API
                
                // Obtenemos el cliente para manejar recordatorios
                const recordatorioServiceClient = serviceClientFactory.getReminderManagementServiceClient();
               
               // los recordatorios antiguis se conservan durante 3 días después de que 'recuerden' al cliente antes de ser eliminados
                
                const recordatorioList = await recordatorioServiceClient.getReminders();
                console.log('Recordatorios actuales: ' + JSON.stringify(recordatorioList));
                // Borramos recordatorio pasados si existen
                const recordatorioAnterior = sessionAttributes['recordatorioID'];
                
                
                if (recordatorioAnterior){
                    try {
                        if (recordatorioList.totalCount !== "0") {
                            await recordatorioServiceClient.deleteReminder(recordatorioAnterior);
                            delete sessionAttributes['recordatorioID'];
                            console.log('Eliminado ID del recordatorio anterior: ' + recordatorioAnterior);
                        }
                    } catch (error) {
                        // significa que el recordatorio no existe o que hubo un problema con la eliminación
                        // de cualquier manera, podemos seguir adelante y crear el nuevo recordatorio
                        console.log('Error al borrar ID de recordatorio anterior: ' + recordatorioAnterior + ' via ' + JSON.stringify(error));
                    }
                }
                
                // Creamos la estructura del recordatorio
                const recordatorio = func.crearRecordatorioCumple(
                    datosCumple.diasParaCumple,
                    timezone,
                    Alexa.getLocale(requestEnvelope),
                    mensajeEntrada);
                    
                // Creamos el recordatorio
                const recordatorioResponse = await recordatorioServiceClient.createReminder(recordatorio); // la respuesta incluirá un "alertToken" que puede usar para consultar este recordatorio
                // salvamos el ID del recordatorio en la sesion
                sessionAttributes['recordatorioId'] = recordatorioResponse.alertToken;
                console.log('Recordatorio creado con ID: ' + recordatorioResponse.alertToken);
                // Textto de respuesta
                mensajeHablado = handlerInput.t('REMINDER_CREATED_MSG', {nombre: nombre});
                mensajeHablado += handlerInput.t('POST_REMINDER_HELP_MSG');
            } catch (error) {
                console.log(JSON.stringify(error));
                errorFlag = true;
                switch (error.statusCode) {
                    case 401: // el usuario debe habilitar los permisos para recordatorios, adjuntemos una tarjeta de permisos a la respuesta
                        handlerInput.responseBuilder.withAskForPermissionsConsentCard(configuracion.PERMISO_RECORDATORIO);
                        mensajeHablado += handlerInput.t('MISSING_PERMISSION_MSG');
                        break;
                    case 403: // dispositivos como el simulador no admiten la gestión de recordatorios
                        mensajeHablado += handlerInput.t('UNSUPPORTED_DEVICE_MSG');
                        break;
                    //case 405: METHOD_NOT_ALLOWED, please contact the Alexa team
                    default:
                        mensajeHablado += handlerInput.t('REMINDER_ERROR_MSG') + ' El error es: ' + error.message;
                }
               mensajeHablado += handlerInput.t('REPROMPT_MSG');
            }
            
       // prorizamos la directiva APL para que nos saque la imagen si no hay errores
       // Con esto sacamos una que hemos creado
            if (util.supportsAPL(handlerInput) && !errorFlag) {
                console.log("PASO: Entro en el IF");
                const {Viewport} = handlerInput.requestEnvelope.context;
                const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
                handlerInput.responseBuilder.addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.1',
                    // Preparamos la pantalla a lanzar
                    document: configuracion.APL.launchDoc,
                    datasources: {
                        launchData: {
                            type: 'object',
                            // Las propiedades que usa, las cambiamos dinamicamente
                            properties: {
                                headerTitle: handlerInput.t('LAUNCH_HEADER_MSG'),
                                mainText: handlerInput.t('REMINDER_CREATED_MSG', {nombre: nombre}),
                                hintString: handlerInput.t('LAUNCH_HINT_MSG'),
                                logoImage: Viewport.pixelWidth > 480 ? util.getS3PreSignedUrl('Media/full_icon_512.png') : util.getS3PreSignedUrl('Media/full_icon_108.png'),
                                backgroundImage: util.getS3PreSignedUrl('Media/straws_'+resolution+'.png'),
                                backgroundOpacity: "0.5"
                            },
                            transformers: [{
                                inputPath: 'hintString',
                                transformer: 'textToHint',
                            }]
                        }
                    }
                });
            }

            // Agregar tarjeta de inicio a la respuesta de tipo standard
            // Si estás usando una habilidad alojada de Alexa, las imágenes a continuación caducarán
            // y no se pudo mostrar en la tarjeta. Debes reemplazarlos con imágenes estáticas
            handlerInput.responseBuilder.withStandardCard(
                handlerInput.t('LAUNCH_HEADER_MSG'),
                handlerInput.t('REMINDER_CREATED_MSG', {nombre: nombre}),
                util.getS3PreSignedUrl('Media/straws_480x480.png'));
        
        // Si no tenemos los datos
        } else {
            mensajeHablado += handlerInput.t('MISSING_MSG');
           // Usamos delegación de servicios para volver a un intent
            handlerInput.responseBuilder.addDelegateDirective({
                name: 'RegistrarCumpleIntent',
                confirmationStatus: 'NONE',
                slots: {}
            });
        }
        
        // Reprompt
        return handlerInput.responseBuilder
            .withStandardCard('Cumpleaños',mensajeHablado, util.getS3PreSignedUrl('Media/papers_480x480.png'))
            .speak(mensajeHablado)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

// CUMPLEAÑOS DE FAMOSOS -INTENT
const FamososCumpleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FamososCumpleIntent';
    },
    // Como vamos a acceder a una API externa lo hacemos async 
    async handle(handlerInput) {
        // Obtenemos los atributos de sesión que necesitamos
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
        const nombre = sessionAttributes['nombre'] || '';
        let timezone = sessionAttributes['timezone'];
        
        // Obtenemos el TimeZone
        if (!timezone){
           //timezone = 'Europe/Rome'; 
            return handlerInput.responseBuilder
                .speak(handlerInput.t('NO_TIMEZONE_MSG'))
                .getResponse();
        }
        
        // Vamos con el servicio
        // Lo primero es constrir la respuesta progresiva
        try {
            // llame al servicio de respuesta progresiva
            await util.callDirectiveService(handlerInput, handlerInput.t('PROGRESSIVE_MSG', {nombre: nombre}));
        } catch (error) {
            // si falla podemos continuar, pero el usuario esperará sin una respuesta progresiva
            console.log("Error de respuesta progresiva : " + error);
        }
        // Obtenemos la fecha 
        const fechaActual = func.getFechaActual(timezone);
        // ahora buscaremos cumpleaños de celebridades desde una API externa
        const respuesta = await func.getCumpleFamosos(fechaActual.dia, fechaActual.mes, configuracion.MAX_CUMPLES);
        console.log(JSON.stringify(respuesta));
        // convertimos la respuesta API a texto que Alexa puede leer
        const textoRespuesta = func.convertirCumplesResponse(handlerInput, respuesta, true, timezone);
        let mensajeHablado = handlerInput.t('API_ERROR_MSG');
        if (textoRespuesta) {
            mensajeHablado = textoRespuesta;
        }
        mensajeHablado += handlerInput.t('POST_CELEBRITIES_HELP_MSG');

       // Add APL directiva para responder usando el documento lista
       
       if (util.supportsAPL(handlerInput) && textoRespuesta) { //no hay respuesta
             mensajeHablado += handlerInput.t('POST_CELEBRITIES_APL_HELP_MSG');
            // Para saber lka resolución
            const {Viewport} = handlerInput.requestEnvelope.context;
            const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                document: configuracion.APL.listDoc, // Cargamos la interfaz de listas
                // Lo cogemos estos datos siguiendo la estructura de listSampleDataSource.json
                datasources: {
                    listData: {
                        type: 'object',
                        properties: {
                            config: {
                                backgroundImage: util.getS3PreSignedUrl('Media/lights_'+resolution+'.png'),
                                title: handlerInput.t('LIST_HEADER_MSG'),
                                skillIcon: util.getS3PreSignedUrl('Media/full_icon_108.png'),
                                hintText: handlerInput.t('LIST_HINT_MSG')
                            },
                            list: {
                                listItems: respuesta.results.bindings
                            }
                        },
                        transformers: [{
                            inputPath: 'config.hintText',
                            transformer: 'textToHint'
                        }]
                    }
                }
            });
            
            /*
            if (util.supportsAPL(handlerInput) && textoRespuesta) { // si no hay texto de respuesta es que no hay nada que decir
            const {Viewport} = handlerInput.requestEnvelope.context;
            const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                document: configuracion.APL.launchDoc,
                datasources: {
                    launchData: {
                        type: 'object',
                        properties: {
                            headerTitle: handlerInput.t('LAUNCH_HEADER_MSG'),
                            mainText: func.convertirCumplesResponse(handlerInput, respuesta, true, timezone).split(": ")[1],
                            hintString: handlerInput.t('LAUNCH_HINT_MSG'),
                            logoImage: Viewport.pixelWidth > 480 ? util.getS3PreSignedUrl('Media/full_icon_512.png') : util.getS3PreSignedUrl('Media/full_icon_108.png'),
                            backgroundImage: util.getS3PreSignedUrl('Media/lights_'+resolution+'.png'),
                            backgroundOpacity: "0.5"
                        },
                        transformers: [{
                            inputPath: 'hintString',
                            transformer: 'textToHint',
                        }]
                    }
                }
            });
            */
             // Agregar tarjeta de inicio a la respuesta
            // Si estás usando una habilidad alojada de Alexa, las imágenes a continuación caducarán
            // y no se pudo mostrar en la tarjeta. Debes reemplazarlos con imágenes estáticas
            handlerInput.responseBuilder.withStandardCard(
                handlerInput.t('LIST_HEADER_MSG'),
                mensajeHablado,
                util.getS3PreSignedUrl('Media/lights_480x480.png'));
                
        // Si no tenemos respuesta....
        } else {
            mensajeHablado += handlerInput.t('POST_CELEBRITIES_HELP_MSG');
        }  
        
        // En cualquier caso devolvemos la respuesta 
        return handlerInput.responseBuilder
            .speak(mensajeHablado)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

// HANDLER DE DE EVENTO TOUCH
const TouchIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'; // Los datos que nos vienen del evento
    },
    handle(handlerInput) {
        const {request} = handlerInput.requestEnvelope; // Datos de entrada
        // Datos de la persona, es lo que nos llega
        let persona = request.arguments[0];
        // Test Simulator está enviando JSON mientras que el dispositivo enviará String
        // La casteamos del JSON
        try { persona = JSON.parse(persona); } catch (e) {}
        console.log('Evento Touch argumentos: ' + JSON.stringify(persona));
        // Construimos el mensaje de salida 
        let mensajeHablado = handlerInput.t('LIST_PERSON_DETAIL_MSG', {person: persona}); // Es person porque fijate que enla cadena cogemos sus atributos

        mensajeHablado += handlerInput.t('POST_TOUCH_HELP_MSG');

        return handlerInput.responseBuilder
            .speak(mensajeHablado)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

// AYUDA - INTENT
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const mensajeHablado = handlerInput.t('HELP_MSG');

        return handlerInput.responseBuilder
            //.withStandardCard('Cumpleaños',mensajeHablado, util.getS3PreSignedUrl('Media/papers_480x480.png'))
            .speak(mensajeHablado)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

// CANCELACIÓN Y PARADA INTENT
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        // Para decir su nombre
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const nombre = sessionAttributes['nombre'] || '';
        const mensajeHablado = handlerInput.t('GOODBYE_MSG', {nombre: nombre});

        // Preparamos la salida
        return handlerInput.responseBuilder
            //.withStandardCard('Cumpleaños',mensajeHablado, util.getS3PreSignedUrl('Media/papers_480x480.png'))
            .speak(mensajeHablado)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};


// FallbackIntent se activa cuando un cliente dice algo que no se asigna a ninguna intención en su habilidad
// También debe definirse en el modelo de idioma (si la configuración regional lo admite)
//Este controlador se puede agregar de forma segura, pero se ignorará en las configuraciones regionales que aún no lo admiten
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const mensaje = handlerInput.t('FALLBACK_MSG');

        return handlerInput.responseBuilder
            .speak(mensaje)
            .reprompt(handlerInput.t('HELP_MSG'))
            .getResponse();
    }
};

// SessionEndedRequest notifica que una sesión ha finalizado. Este controlador se activará cuando se abra actualmente
// la sesión se cierra por uno de los siguientes motivos: 1) El usuario dice "salir" o "salir". 2) El usuario no
// responde o dice algo que no coincide con una intención definida en su modelo de voz. 3) se produce un error
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Sesión Terminada: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};


// Intent reflector se utiliza para probar y depurar modelos de interacción.
// Simplemente repetirá la intención que dijo el usuario. Puedes crear manejadores personalizados para tus intentos
// definiéndolos arriba, luego también agregándolos a la cadena de manejador de solicitudes a continuación
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speechText = handlerInput.t('REFLECTOR_MSG', {intent: intentName});

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error para capturar cualquier errores de sintaxis o errores de enrutamiento. Si recibes un error
// indicando que no se encuentra la cadena del controlador de solicitudes, no ha implementado un controlador para
// la intención invocada o incluida en el generador de habilidades a continuación
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speechText = handlerInput.t('ERROR_MSG');
        console.log(`~~~~ Error de Handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('HELP_MSG'))
            .getResponse();
    }
};

module.exports = {
    LaunchRequestHandler,
    RegistrarCumpleIntentHandler,
    DiasParaCumpleIntentHandler,
    RecordatorioCumpleIntentHandler,
    FamososCumpleIntentHandler,
    TouchIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler,
    ErrorHandler
}

