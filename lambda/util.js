const AWS = require('aws-sdk');

const s3SigV4Client = new AWS.S3({
    signatureVersion: 'v4'
});

module.exports = {
    
    getS3PreSignedUrl(s3ObjectKey) {
        const bucketName = process.env.S3_PERSISTENCE_BUCKET;
        const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: s3ObjectKey,
            Expires: 60*1 // the Expires is capped for 1 minute
        });
        console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
        return s3PreSignedUrl;
    
    }, 
     // FUNCIÓN PARA CONFIGURAR LA DEPENDENCIA
    getPersistenceAdapter(tableName) {
        // Esto lo ponemos porque esta almacenanda en el propio sistema de Alexa Hosted
        function isAlexaHosted() {
            return process.env.S3_PERSISTENCE_BUCKET; // Como es un Hosted Node.js usamos este
        }
        if (isAlexaHosted()) {
            const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
            return new S3PersistenceAdapter({
                bucketName: process.env.S3_PERSISTENCE_BUCKET
            });
        } else {
            // Si es una base de datos externa
            // IMPORTANTE: no olvides dar acceso a DynamoDB al rol que está utilizando para ejecutar este lambda (a través de la política de IAM)
            const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
            return new DynamoDbPersistenceAdapter({
                tableName: tableName || 'feliz_cumple',
                createTable: true
            });
        }
    },
    
    // FUNCION PARA CREAR UN RECORDATORIO
    createReminder(requestMoment, scheduledMoment, timezone, locale, message) {
        return {
            requestTime: requestMoment.format('YYYY-MM-DDTHH:mm:00.000'),
            trigger: {
                type: 'SCHEDULED_ABSOLUTE',
                scheduledTime: scheduledMoment.format('YYYY-MM-DDTHH:mm:00.000'),
                timeZoneId: timezone
            },
            alertInfo: {
                spokenInfo: {
                    content: [{
                        locale: locale,
                        text: message
                    }]
                }
            },
            pushNotification: {
                status: 'ENABLED'
            }
        }
    }, 
    
    // FUNCION PARA CREAR UNA DIRECTIVA DE SERVICIO
    callDirectiveService(handlerInput, msg) {
        // llama a Alexa, Directiva de servicio
        const {requestEnvelope} = handlerInput;
        const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();
        const requestId = requestEnvelope.request.requestId;
        const {apiEndpoint, apiAccessToken} = requestEnvelope.context.System;
        // Construye la respuesta progresiva
        const directive = {
            header: {
                requestId
            },
            directive:{
                type: 'VoicePlayer.Speak',
                speech: msg
            }
        };
        // envia la directiva de servicio
        return directiveServiceClient.enqueue(directive, apiEndpoint, apiAccessToken);
    }, 
    
    // FUNCION PARA INDICAR SI EL DISPOSITIVO SOPORTA APL
    supportsAPL(handlerInput) {
        const {supportedInterfaces} = handlerInput.requestEnvelope.context.System.device;
        return !!supportedInterfaces['Alexa.Presentation.APL'];
    }
}