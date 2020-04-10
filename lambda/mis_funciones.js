// MIS FUNCIONES AUXILIARES

const moment = require('moment-timezone'); // manejo de fechas con TimeZone
const util = require('./util');


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
    }
}