
// LIBRERÍAS
const Alexa = require('ask-sdk-core'); // Librería de Alexa
const util = require('./util'); // Utilidades
const interceptors = require('./interceptors'); // Interceptores
const handlers = require('./handlers'); // Handelers


// Este controlador (handler) actúa como el punto de entrada para la skill, enrutando todas las solicitudes y respuestas
// a los controladores anteriores. Todos deben estar definidos o incluídos aquí. El orden importa: se procesan de arriba a abajo
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        handlers.LaunchRequestHandler,
        handlers.RegistrarCumpleIntentHandler,
        handlers.DiasParaCumpleIntentHandler,
        handlers.RecordatorioCumpleIntentHandler,
        handlers.FamososCumpleIntentHandler,
        handlers.TouchIntentHandler,
        handlers.HelpIntentHandler,
        handlers.CancelAndStopIntentHandler,
        handlers.FallbackIntentHandler,
        handlers.SessionEndedRequestHandler,
        handlers.IntentReflectorHandler)
    .addErrorHandlers(
        handlers.ErrorHandler)
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
    .withCustomUserAgent('sample/feliz-cumple/mod8')
    .lambda();
