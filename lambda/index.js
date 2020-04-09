
// LIBRERÍAS
const Alexa = require('ask-sdk-core');
const interceptors = require('./interceptors'); // Interceptores
const util = require('./util'); // funciones de utilidad. Aquí está la persistencia ahora y se exporta como util. Mirad en = Alexa.SkillBuilders
const moment = require('moment-timezone'); // Para manejar fechas
const aux = require('./mis_funciones'); // Mis funciones


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
        const anno = sessionAttributes['anno'];
        const nombre = sessionAttributes['nombre'] || '';
        const sessionCounter = sessionAttributes['sessionCounter']; // Contador de sesiones

         // Si existen los mensajes, mostramos
        if(dia && mesNombre && anno) {
            // Si queremos que nos indique ya nuestro cumpleaños nada más arrancar
             //mensaje = handlerInput.t('REGISTER_MSG', {nombre:nombre, dia: dia, mes: mesNombre, anno: anno});
            // Si queremos que nos diga los dias para nuestro cumple o si es nuestro cumple
            return DiasParaCumpleIntentHandler.handle(handlerInput);
        }
        
        // Variable de mensaje
         // Si no hay sesión, damos la bienvenida, si existe le damos bienvenida de registrado
        let mensaje = !sessionCounter ? handlerInput.t('WELCOME_MSG', {nombre: nombre}) : handlerInput.t('WELCOME_BACK_MSG', {nombre: nombre});
        mensaje += handlerInput.t('MISSING_MSG');
    
        return handlerInput.responseBuilder
            .speak(mensaje)
            .withSimpleCard("Cumpleaños",mensaje)
            // usamos el encadenamiento de intenciones para activar el registro de cumpleaños en varios usos seguidos
            
            .addDelegateDirective({
                name: 'RegistrarCumpleIntent',
                confirmationStatus: 'NONE',
                slots: {}
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
        let mensaje = handlerInput.t('REJECTED_MSG');
        // Si todo esta confirmado
        //if (intent.confirmationStatus === 'CONFIRMED') {
            //Tomamos los slots y los almacenamos en variables
            const dia = Alexa.getSlotValue(requestEnvelope, 'dia');
            const anno = Alexa.getSlotValue(requestEnvelope, 'anno');
            //const mes = Alexa.getSlotValue(requestEnvelope, 'mes');
            // Vamos a almacenar también el id del mes y su nombre, por eso hemos cambiado lo de antes
            const mesNombre = Alexa.getSlotValue(requestEnvelope, 'mes');
            const mesID = aux.getIDMes(mesNombre); // Sacamos el mes, podíamos hacerlo como const mesSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id; //MM
            
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

// DIAs PARA CUMPLE -INTENT
const DiasParaCumpleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DiasParaCumpleIntent';
    },
    handle(handlerInput) {
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
        
        let mensaje = !sessionCounter ? handlerInput.t('WELCOME_MSG', {nombre: nombre}) : handlerInput.t('WELCOME_BACK_MSG',{nombre: nombre});
        
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
            const hoy = moment().tz(timezone).startOf('day'); // Obtenemos la fechas
             // Calculamos cuando nacimos en base a la fecha registrada
            const naciste = moment(`${mes}/${dia}/${anno}`, "MM/DD/YYYY").tz(timezone).startOf('day');
            // Calculamos el proximo cumple
            const proximoCumple = moment(`${mes}/${dia}/${hoy.year()}`, "MM/DD/YYYY").tz(timezone).startOf('day');
            
            // si ya ha pasado, le sumamos un año 
            if (hoy.isAfter(proximoCumple)){
                proximoCumple.add(1, 'years');
            }
            // Calculamos la edad en años
            const edad = hoy.diff(naciste, 'years');
            // Sacamos los dias para cumple
            const diasCumple = proximoCumple.startOf('day').diff(hoy, 'days'); // El mismo dia devuleve 0
            
            // Preparamos los mensajes
            if(diasCumple>1)
                mensaje += handlerInput.t('DAYS_LEFT_MSG_plural', {nombre: nombre, contador: diasCumple});
            else
                mensaje += handlerInput.t('DAYS_LEFT_MSG', {nombre: nombre, contador: diasCumple});
            
            if(edad>1) 
                mensaje += handlerInput.t('WILL_TURN_MSG_plural', {contador: edad + 1});
            else
                mensaje += handlerInput.t('WILL_TURN_MSG', {contador: edad + 1});
            
            if (diasCumple === 0) { //¡Es nuestro cumpleaños!
                // Si edad es mayor que 1, plurar
                if(edad>1) {
                    mensaje = handlerInput.t('GREET_MSG', {nombre: nombre});
                    mensaje += handlerInput.t('NOW_TURN_MSG_plural', {contador: edad});
                }
                else {
                    mensaje = handlerInput.t('GREET_MSG', {nombre: nombre});
                    mensaje += handlerInput.t('NOW_TURN_MSG', {contador: edad});
                }
            }
            mensaje += handlerInput.t('POST_SAY_HELP_MSG');
            
        }else{
            mensaje = handlerInput.t('MISSING_MSG');
            // llamamos a registrar cumpleaños usamos intercambiador de Intents
            handlerInput.responseBuilder.addDelegateDirective({
                name: 'RegistrarCumpleIntentHandler',
                confirmationStatus: 'NONE',
                slots: {}
            });
        }
        return handlerInput.responseBuilder
            .speak(mensaje)
            .withSimpleCard("Cumpleaños", mensaje)
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
        const mensaje = handlerInput.t('HELP_MSG');

        return handlerInput.responseBuilder
            .speak(mensaje)
            .reprompt(mensaje)
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
        const mensaje = handlerInput.t('GOODBYE_MSG', {nombre: nombre});


        return handlerInput.responseBuilder
            .speak(mensaje)
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
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
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
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('HELP_MSG'))
            .getResponse();
    }
};



// Este controlador (handler) actúa como el punto de entrada para la skill, enrutando todas las solicitudes y respuestas
// a los controladores anteriores. Todos deben estar definidos o incluídos aquí. El orden importa: se procesan de arriba a abajo
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RegistrarCumpleIntentHandler,
        DiasParaCumpleIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        interceptors.LoadAttributesRequestInterceptor,
        interceptors.LocalisationRequestInterceptor,
        interceptors.LoggingRequestInterceptor,
        interceptors.LoadNameRequestInterceptor,
        interceptors.LoadTimezoneRequestInterceptor)
    .addResponseInterceptors(
        interceptors.LoggingResponseInterceptor,
        interceptors.SaveAttributesResponseInterceptor)
    .withPersistenceAdapter(util.getPersistenceAdapter()) // indicamos las persistencia
    .withApiClient(new Alexa.DefaultApiClient()) // indicamos que vamos a usar una API
    //.withCustomUserAgent('sample/happy-birthday/mod5')
    .lambda();
