module.exports = {
    // Especificamos que atributos queremos que sea salvados de sesión a base de datos
    
    PERSISTENT_ATTRIBUTES_NAMES: ['dia', 'mesID', 'mesNombre', 'anno', 'sessionCounter', 'recordatorioID'],
    
    //PERMISOS por ejemplo para acceder al nombre: de lectura
    GIVEN_NAME_PERMISSION: ['alexa::profile:given_name:read'],
    
    // Permisos para recordatorios
    REMINDERS_PERMISSION: ['alexa::alerts:reminders:skill:readwrite'],
    
    // número máximo de cumpleaños a consultar de famosos por el servicio
    MAX_CUMPLES: 5
}