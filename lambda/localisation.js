// CONSTANTES
//Creamos un objeto de cadenas de lenguaje que contiene todas nuestras cadenas.
//Las claves para cada cadena se referenciarán en nuestro código, p. handlerInput.t ('WELCOME_MSG')

module.exports = {
    es: {
        translation: {
            POSITIVE_SOUND: `<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02'/>`,
            GREETING_SPEECHCON: `<say-as interpret-as="interjection">felicidades</say-as>`,
            DOUBT_SPEECHCON: `<say-as interpret-as="interjection">hmm</say-as>`,
            WELCOME_MSG: '¡Te doy la bienvenida a Feliz Cumpleaños {{nombre}}. ¡Vamos a divertirnos un poco con tu cumpleaños! ',
            WELCOME_BACK_MSG: '¡Te doy la bienvenida otra vez {{nombre}}! ',
            REJECTED_MSG: 'No pasa nada. Por favor dime la fecha otra vez y lo corregimos. ',
            DAYS_LEFT_MSG: '{{nombre}} Queda {{contador}} día ',
            DAYS_LEFT_MSG_plural: '{{nombre}} Quedan {{contador}} días ',
            WILL_TURN_MSG: 'para que cumplas {{contador}} año. ',
            WILL_TURN_MSG_plural: 'para que cumplas {{contador}} años. ',
            GREET_MSG: '$t(POSITIVE_SOUND) $t(GREETING_SPEECHCON) {{nombre}}. ',
            NOW_TURN_MSG: '¡Hoy cumples {{contador}} año! ',
            NOW_TURN_MSG_plural: '¡Hoy cumples {{contador}} años! ',
            MISSING_MSG: '$t(DOUBT_SPEECHCON). Parece que aun no me has dicho tu fecha de cumpleaños. ',
            POST_SAY_HELP_MSG: 'Si quieres cambiar la fecha puedes decir, registra mi cumpleaños. O sólo dime la fecha directamente. ¿Qué quieres hacer? ',
            HELP_MSG: 'Puedo recordar tu cumpleaños si me dices una fecha. O decirte cuanto falta para que cumplas. ¿Qué quieres hacer? ',
            REPROMPT_MSG: 'Si no sabes como continuar intent pedir ayuda. Si quieres salir solo dí para. ¿Qué quieres hacer? ',
            GOODBYE_MSG: ['¡Hasta luego {{nombre}}! ', '¡Adiós {{nombre}}! ', '¡Hasta pronto {{nombre}}! ', '¡Nos vemos {{nombre}}! '],
            REFLECTOR_MSG: 'Acabas de activar {{intent}}',
            FALLBACK_MSG: 'Lo siento, no se nada sobre eso. Por favor inténtalo otra vez. ',
            ERROR_MSG: 'Lo siento, ha habido un problema. Por favor inténtalo otra vez. ',
            NO_TIMEZONE_MSG: 'No he podido determinar tu zona horaria. Verifica la configuración de tu dispositivo, abre otraa vez la skill e inténtalo otra vez.'
        }
    }
}