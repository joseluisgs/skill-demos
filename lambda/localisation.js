// CONSTANTES DE LOCALIZACION
//Creamos un objeto de cadenas de lenguaje que contiene todas nuestras cadenas.
//Las claves para cada cadena se referenciarán en nuestro código, p. handlerInput.t ('WELCOME_MSG')

module.exports = {
    es: {
        translation: {
            POSITIVE_SOUND: `<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02'/>`,
            GREETING_SPEECHCON: `<say-as interpret-as="interjection">¡Felicidades!</say-as>`,
            DOUBT_SPEECHCON: `<say-as interpret-as="interjection">hmm</say-as>`,
            WELCOME_MSG: '¡Te doy la bienvenida a Feliz Cumpleaños {{nombre}}. ¡Vamos a divertirnos un poco con tu cumpleaños! ',
            WELCOME_BACK_MSG: '¡Hola {{nombre}}! ',
            REJECTED_MSG: 'No pasa nada. Por favor dime la fecha otra vez y lo corregimos. ',
            DAYS_LEFT_MSG: 'Queda {{count}} día ',
            DAYS_LEFT_MSG_plural: 'Quedan {{count}} días ',
            WILL_TURN_MSG: 'para que cumplas {{count}} año. ',
            WILL_TURN_MSG_plural: 'para que cumplas {{count}} años. ',
            GREET_MSG: '$t(POSITIVE_SOUND) $t(GREETING_SPEECHCON) ¡Hoy es tu cumpleaños {{nombre}}!. ',
            FELICITACION_MSG: '¡Felicidades! ¡Hoy es tu cumpleaños {{nombre}}!. ',
            NOW_TURN_MSG: '¡Hoy cumples {{count}} año! ',
            NOW_TURN_MSG_plural: '¡Hoy cumples {{count}} años! ',
            MISSING_MSG: '$t(DOUBT_SPEECHCON). Parece que aun no me has dicho tu fecha de cumpleaños. ',
            POST_SAY_HELP_MSG: 'Si quieres cambiar la fecha puedes decir, registra mi cumpleaños. También puedes crear un recordatorio para cuando cumplas o conocer los cumpleaños de hoy. ¿Qué quieres hacer? ',
            HELP_MSG: 'Puedo recordar tu cumpleaños si me dices una fecha. Decirte cuanto falta para que cumplas. Crear un recordatorio para tu cumpleaños y decirte quién cumplle años hoy. ¿Qué quieres hacer? ',
            REPROMPT_MSG: 'Si no sabes como continuar intenta pedir ayuda. Si quieres salir solo dí para. ¿Qué quieres hacer? ',
            GOODBYE_MSG: ['¡Hasta luego {{nombre}}! ', '¡Adiós {{nombre}}! ', '¡Hasta pronto {{nombre}}! ', '¡Nos vemos {{nombre}}! '],
            REFLECTOR_MSG: 'Acabas de activar {{intent}} ',
            FALLBACK_MSG: 'Lo siento, no se nada sobre eso. Por favor inténtalo otra vez. ',
            ERROR_MSG: 'Lo siento, ha habido un problema. Por favor inténtalo otra vez. ',
            REGISTER_MSG: 'Recordaré que tu fecha de cumpleaños es el {{dia}} de {{mes}} de {{anno}}. ',
            NO_TIMEZONE_MSG: 'No he podido determinar tu zona horaria. Verifica la configuración de tu dispositivo, abre otraa vez la skill e inténtalo otra vez. ',
            REMINDER_CREATED_MSG: '{{nombre}} Tu recordatorio se ha creado con éxito. ',
            REMINDER_ERROR_MSG: 'Perdona, ha habido un error al crear el recordatorio. ',
            UNSUPPORTED_DEVICE_MSG: 'Este dispositivo no soporta la operación que estás intentando realizar. ',
            CANCEL_MSG: 'Vale. Lo cancelamos. ',
            MISSING_PERMISSION_MSG: 'Parece que no has autorizado el envío de recordatorios. Te he enviado una tarjeta a la app Alexa para que lo habilites. ',
            POST_REMINDER_HELP_MSG: 'Si quieres saber cuando se aactivará tu recordatorio puedes decir, ¿cuánto falta para mi cumpleaños?. ¿Qué quieres hacer ahora? ',
            API_ERROR_MSG: 'Lo siento, ha habido un problema de acceso a la API externa. Por favor inténtalo otra vez. ',
            PROGRESSIVE_MSG: 'Déjame ver quién cumple hoy {{nombre}}. ',
            CONJUNCTION_MSG: ' y ',
            TURNING_YO_MSG: ' cumple {{count}} años ',
            TURNING_YO_MSG_plural: ' cumple {{count}} años ',
            CELEBRITY_BIRTHDAYS_MSG: 'En esta fecha cumplen años: ',
            ALSO_TODAY_MSG: 'También hoy cumplen: ',
            POST_CELEBRITIES_HELP_MSG: 'Quizá ahora puedes preguntar por cuántos días quedan hasta tu cumpleaños. Y recuerda que también puedes configurar un recordatorio para no olvidarlo. ¿Qué quieres hacer ahora? ', 
            POST_CELEBRITIES_APL_HELP_MSG: 'Puedes intentar tocar las fotos para obtener más información. O quizá quieres preguntar cuantos días quedan para tu cumpleaños. ¿Qué otra cosa te gustaría hacer? ',
            LAUNCH_HEADER_MSG: '¡Feliz Cumpleaños!',
            LAUNCH_TEXT_FILLED_MSG: '{{dia}}/{{mes}}/{{anno}}',
            LAUNCH_TEXT_EMPTY_MSG: '¿Cuándo cumples?',
            LAUNCH_HINT_MSG: ['¿cuánto falta para mi cumpleaños?', '¿quién cumple años hoy?', 'crea un recordatorio para mi cumpleaños', 'registra mi fecha de cumpleaños'],
            LIST_HEADER_MSG: 'Cumpleaños de Hoy',
            LIST_HINT_MSG: '¿quién cumple años hoy?',
            LIST_YO_ABBREV_MSG: '{{count}} año',
            LIST_YO_ABBREV_MSG_plural: '{{count}} años',
            LIST_PERSON_DETAIL_MSG: `{{person.humanLabel.value}} nació hace {{person.date_of_birth.value}} en <lang xml:lang="en-US">{{person.place_of_birthLabel.value}}</lang>. `,
            POST_TOUCH_HELP_MSG: `Intenta tocar en otras fotos para obtenr más información. Sino, puedes ver cuántos días quedan para tu cumpleaños o crear un recordatorio para no olvidarlo. ¿Qué quieres hacer?`
        }
    }
}