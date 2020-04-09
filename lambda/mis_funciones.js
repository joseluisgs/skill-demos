// MIS FUNCIONES AUXILIARES


module.exports = {
    
    // Dado un nombre de un mes devuelve su número
    getIDMes(mesNombre) {
       var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]; 
       return  meses.indexOf( mesNombre) + 1;
    }
}