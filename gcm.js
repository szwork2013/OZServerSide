var GCM = require('gcm').GCM;

var apiKey = 'AIzaSyDunDAT6c-kge_RNzvwzXoPGljWpdpi2FI';
var gcm = new GCM(apiKey);

var message = {
    registration_id: 'APA91bFsOp3UdHnPmBAkLOCuUwn8svaYoGxAZ7uOe5OxIcDvdeRBiNxvchEuKPoVC5bUEDeK3Pp9rnDpdtqJ5nTYjOxPONmSyYOwrSky6YF30xyk9IuAu04Kyejfy9fgbtFQRPQAvFi6QfubXdTPTOAzJAaayqcoTQ', // required
    collapse_key: 'Collapse key', 
    delayWhileIdle: true,
    'data.suborderid': 'testing',
    'data.status': 'testing'
};

gcm.send(message, function(err, messageId){
    if (err) {
        console.log("Something has gone wrong!"+err);
    } else {
        console.log("Sent with message ID: ", messageId);
    }
});