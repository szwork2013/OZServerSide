var GCM = require('gcm').GCM;

var apiKey = 'AIzaSyDunDAT6c-kge_RNzvwzXoPGljWpdpi2FI';
var gcm = new GCM(apiKey);

var message = {
    registration_id: 'APA91bHyiVyEoxe0l0z6hPhwB2UA6NrPPAQ-Edv-nckugIjXhLgZ9w55drr3wjGpZzs_7lRqpBUpwq9dkm3dSjjFOgRfUhL3j3FZkztdCoZ9CYON2u_Z_8iCbYO0abH67eD_mN1OwnOW8AT4PISce2OJEvkcTgtobQ', // required
    collapse_key: 'Collapse key', 
     delayWhileIdle: 0,
    data:{suborderid: 'testing',
    status: 'testing'}
};

gcm.send(message, function(err, messageId){
    if (err) {
        console.log("Something has gone wrong!"+err);
    } else {
        console.log("Sent with message ID: ", messageId);
    }
});