// MIS FUNCIONES AXIALIARES O PARTE DE LA FUNCINALIDAD O LÓGICA DE LA SKILL

// LIBRERÍAS A USAR
const moment = require('moment-timezone'); // manejo de fechas con TimeZone
const util = require('./util'); // Utilidades
const axios = require('axios'); // servicios HTTP y REST 


module.exports = {
    
    // Dado un nombre de un mes devuelve su número
    getIDMes(mesNombre) {
       var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]; 
       return  meses.indexOf( mesNombre) + 1;
    },
    
    // Devuelve los datos del cumpleaños dado una fecha
    getDatosCumple(dia, mes, anno, timezone) {
        const hoy = moment().tz(timezone).startOf('day');
        const naciste = moment(`${mes}/${dia}/${anno}`, "MM/DD/YYYY").tz(timezone).startOf('day');
        const siguienteCumple = moment(`${mes}/${dia}/${hoy.year()}`, "MM/DD/YYYY").tz(timezone).startOf('day');
        if (hoy.isAfter(siguienteCumple)) {
            siguienteCumple.add(1, 'years');
        }
        const edad = hoy.diff(naciste, 'years');
        const diasVivo = hoy.diff(naciste, 'days');
        const diasParaCumple = siguienteCumple.startOf('day').diff(hoy, 'days'); // el mismo dia devuelve cero
        // Devuelvo esta estructura de datos
        return {
            diasVivo: diasVivo, // por si acaso :)
            diasParaCumple: diasParaCumple,
            edad: edad //en años
        }
    },
    
    // Crear un recordatorio dado el texto, timezone, locale y el contador de días
    crearRecordatorioCumple(diasParaCumple, timezone, locale, mensaje) {
        moment.locale(locale);
        const momento = moment().tz(timezone);
        let disparadorMomento = momento.startOf('day').add(diasParaCumple, 'days');
        // Si es el día de nuestro cumple cuando lo creamos lo programamos para el año siguiente
        if (diasParaCumple === 0) {
            disparadorMomento = momento.startOf('day').add(1, 'years'); // el mismo día el año siguiente 
        }
        console.log('Recordatorio programado: ' +  disparadorMomento.format('YYYY-MM-DDTHH:mm:00.000'));
        // Devuelvo y creo la creación de recordatorio
        return util.createReminder(momento, disparadorMomento, timezone, locale, mensaje); // Está en utils
    }, 
    
    // Obtiene la fechaActual en la estructura dia y mes
     getFechaActual(timezone) {
        const hoy = moment().tz(timezone).startOf('day');

        return {
            dia: hoy.date(),
            mes: hoy.month() + 1,
            anno: hoy.year()
        }
    },
    
    // Obtiene cumpleaños famosos usando un servicio web, en este caso de la wikipedia usando de lenguaje de consulta sparql
    getCumpleFamosos(dia, mes, limite){
        const endpoint = 'https://query.wikidata.org/sparql';
        // Lista de actores con fotos y fecha de nacimiento para un día y mes determinados
        const consultaSparql =
        `SELECT DISTINCT ?human ?humanLabel ?picture ?date_of_birth ?place_of_birthLabel WHERE {
        ?human wdt:P31 wd:Q5;
            wdt:P106 wd:Q33999;
            wdt:P18 ?picture.
        FILTER((DATATYPE(?date_of_birth)) = xsd:dateTime)
        FILTER((MONTH(?date_of_birth)) = ${mes})
        FILTER((DAY(?date_of_birth)) = ${dia})
        FILTER (bound(?place_of_birth))
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        OPTIONAL { ?human wdt:P569 ?date_of_birth. }
        OPTIONAL { ?human wdt:P19 ?place_of_birth. }
        }
        LIMIT ${limite}`;
        const url = endpoint + '?query=' + encodeURIComponent(consultaSparql);
        console.log(url); // por si queremos verla en el explorador

        var config = {
            timeout: 6500, // timeout api 8 seg timeout, se puede cambiar en  axios.defaults.timeout
            headers: {'Accept': 'application/sparql-results+json'} // Queremos JSON
        };
        
        // aqui hacemos la función asíncrona para obtener la respuesta de JSON
        async function getJsonResponse(url, config){
            const res = await axios.get(url, config);
            return res.data;
        }
        
        // Devolvermos la respuesta 
        return getJsonResponse(url, config).then((result) => {
            return result;
        }).catch((error) => {
            return null;
        });
    },
    
    // Convertimos las respuesta de cumples en texto hablado
    convertirCumplesResponse(handlerInput, response, conEdad, timezone){
        let textoSalida = '';
        // Si la llamada API falla, simplemente no agregamos los cumpleaños de hoy a la respuesta
        if (!response || !response.results || !response.results.bindings || !Object.keys(response.results.bindings).length > 0)
            return textoSalida;
        
        const resultados = response.results.bindings;
        textoSalida += handlerInput.t('ALSO_TODAY_MSG');
        
        // Recorremos los resultados y lo almacenamos en el objeto persona 
        resultados.forEach((persona, index) => {
            console.log(persona);
            textoSalida += persona.humanLabel.value;
            // si tiene la edad de nacimiento...
            if (conEdad && timezone && persona.date_of_birth.value) {
                const edad = module.exports.convertirFechaNacimientoEnEdad(persona, timezone);
                 textoSalida += handlerInput.t('TURNING_YO_MSG', {contador: edad});
                 persona.date_of_birth.value = handlerInput.t('LIST_YO_ABBREV_MSG', {count: edad});
            }
            // Juntamos más
            if (index === Object.keys(resultados).length - 2)
                textoSalida += handlerInput.t('CONJUNCTION_MSG');
            else
               textoSalida += '. ';
        });

        return textoSalida;
    },
    
    
    // Convierte fechas de cumpleaños en años que tiene
    convertirFechaNacimientoEnEdad(persona, timezone) {
        const hoy = moment().tz(timezone).startOf('day');
        const fechaNacimiento = moment(persona.date_of_birth.value).tz(timezone).startOf('day');
        return hoy.diff(fechaNacimiento, 'years');
    }
}