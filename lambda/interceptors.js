// MODULO DE INTERCEPTORES
const Alexa = require('ask-sdk-core');

// i18n librería para usar el interceptor de localización para poder tener los mensajes en distintos idiomas.
const i18n = require('i18next');
// Fichero de mnesajes de texto localizados
const languageStrings = require('./localisation');
// Fichero de configuración de permisos 
const configuracion = require('./configuracion');

// Atributos a salvar. Código mas legible. Limitamos solo los que queremos salvar.Si no quitar
const PERSISTENT_ATTRIBUTES_NAMES = ['dia', 'mesID', 'mesNombre', 'anno', 'sessionCounter'];

//PERMISOS por ejemplo para acceder al nombre: de lectura
const GIVEN_NAME_PERMISSION = ['alexa::profile:given_name:read'];

// Request interceptor registrará todas las solicitudes entrantes en esta lambda

const LoggingRequestInterceptor = {
        process(handlerInput) {
            console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        }
};
    
    // Response interceptor registrará todas las respuestas salientes de esta lambda
const LoggingResponseInterceptor = {
    process(handlerInput, response) {
        console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
};
    
// Este Request interceptor enlazará una función de traducción 't' al controlador de entrada
// Se le ha añadido un metodo que elije cadenas aleatorias si existen en el fichero de cadenas de localización
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        const localisationClient = i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings,
            returnObjects: true
        });
        localisationClient.localise = function localise() {
            const args = arguments;
            const value = i18n.t(...args);
            if (Array.isArray(value)) {
                return value[Math.floor(Math.random() * value.length)];
            }
            return value;
        };
        handlerInput.t = function translate(...args) {
            return localisationClient.localise(...args);
        }
    }
};
    
// INTERCETORES PARA CARGAR Y ALMACENAR DATOS DE SESIÓN A BASE DE DATOS Y VICEVERSA
// A continuación usamos async y await (más información: javascript.info/async-await)
// Es una forma de salvar/cargar y esperar el resultado de una operación asíncrona externa
const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        // Lo que vamos a trabajar es con una variable que nos va a decir si hay sesión o no
        if (Alexa.isNewSession(requestEnvelope) || !sessionAttributes['loaded']){ //es una nueva sesión?
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            console.log('Cargando desde almacenamiento persistente: ' + JSON.stringify(persistentAttributes));
            persistentAttributes['loaded'] = true;
            //copiamos todos los atributos
            attributesManager.setSessionAttributes(persistentAttributes); // cargamos los atributos
        }
    }
};
    
//Si desabilitas la skill y la vuelve a habilitar, el ID de usuario podría cambiar 
// y perderás los atributos persistentes guardados a continuación, ya que el ID de usuario es la clave principal
const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        if (!response) return; // por si no tenemos respuesta o se ha caido
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //se ha finalizado la sesión
        // se debe a que el indicador de "nueva" sesión se pierde si hay un enunciado de un solo disparo que alcanza un intento con el delegado automático
        const loadedThisSession = sessionAttributes['loaded'];
        if ((shouldEndSession || Alexa.getRequestType(requestEnvelope) === 'SessionEndedRequest') && loadedThisSession) { // se ha parado por timeout
            // incrementamos el contador de sesiones
            sessionAttributes['sessionCounter'] = sessionAttributes['sessionCounter'] ? sessionAttributes['sessionCounter'] + 1 : 1;
            // limitamos salvar atributos solo a los que queremos
            for (var key in sessionAttributes) {
                if (!configuracion.PERSISTENT_ATTRIBUTES_NAMES.includes(key))
                    delete sessionAttributes[key];
            }
            console.log('Salvando a almacenamiento persistente:' + JSON.stringify(sessionAttributes));
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

// INTERCEPTORES DE PERMISOS
// Obtener nombre de usuario
// Si deshabilitas la skill y la vuelves a habilitar, el ID de usuario podría cambiar y el usuario tendrá que otorgar el permiso para acceder al nombre nuevamente
const LoadNameRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        if (!sessionAttributes['nombre']){
            // intentemos obtener el nombre a través de la API de perfil del cliente
            // no olvides habilitar este permiso en la configuración de tus habilidades (pestaña Build -> Permissions)
            // o obtendrás una SessionEndedRequest con un ERROR de tipo INVALID_RESPONSE
            // Según nuestras políticas, no puede hacer que los datos personales sean persistentes, por lo que limitamos el "nombre" a los atributos de la sesión
            try {
                const {permissions} = requestEnvelope.context.System.user;
                if (!(permissions && permissions.consentToken))
                    throw { statusCode: 401, message: 'No tienes permisos disponibles' }; // No tienes permisos o no has inicializado la API
                const upsServiceClient = serviceClientFactory.getUpsServiceClient();
                const profileName = await upsServiceClient.getProfileGivenName();
                if (profileName) { // puede que no sea el nombre del usuario
                    //salvamos a la sesión
                    sessionAttributes['nombre'] = profileName;
                }
            } catch (error) {
                console.log(JSON.stringify(error));
                if (error.statusCode === 401 || error.statusCode === 403) {
                    // el usuario necesita habilitar los permisos para el nombre dado, agreguemos una tarjeta de permisos a la respuesta.
                    handlerInput.responseBuilder.withAskForPermissionsConsentCard(configuracion.GIVEN_NAME_PERMISSION);
                }
            }
        }
    }
};

// Obtener TimeZone
const LoadTimezoneRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const deviceId = Alexa.getDeviceId(requestEnvelope);

        if (!sessionAttributes['timezone']){
             //Vamos a obtener la zona horaria a través de la API de UPS
            // (no se requieren permisos pero puede que no esté configurado)
            try {
                const upsServiceClient = serviceClientFactory.getUpsServiceClient();
                const timezone = await upsServiceClient.getSystemTimeZone(deviceId);
                if (timezone) { // Puede no estar configurada
                    console.log('Timezone del dispositivo: ' + timezone);
                    //salvamos a la sesión
                    sessionAttributes['timezone'] = timezone;
                }
            } catch (error) {
                console.log(JSON.stringify(error));
            }
        }
    }
};

// Exportamos los módulos
module.exports = {
    LoggingRequestInterceptor,
    LoggingResponseInterceptor,
    LocalisationRequestInterceptor,
    LoadAttributesRequestInterceptor,
    SaveAttributesResponseInterceptor,
    LoadNameRequestInterceptor,
    LoadTimezoneRequestInterceptor
}


