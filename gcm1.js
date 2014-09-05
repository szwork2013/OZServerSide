var gcm = require('node-gcm');

// create a message with default values
var message = new gcm.Message();

// or with object values
var message = new gcm.Message({
    collapseKey: 'demo',
    delayWhileIdle: true,
    timeToLive: 3,
    data: {
        suborderid: 'message1',
        status: 'message2'
    }
});

var sender = new gcm.Sender('AIzaSyDunDAT6c-kge_RNzvwzXoPGljWpdpi2FI');
var registrationIds = [];

// OPTIONAL
// add new key-value in data object
// message.addDataWithKeyValue('key1','message1');
// message.addDataWithKeyValue('key2','message2');

// or add a data object
// message.addDataWithObject({
//     key1: 'message1',
//     key2: 'message2'
// });

// or with backwards compability of previous versions
// message.addData('key1','message1');
// message.addData('key2','message2');


// message.collapseKey = 'demo';
// message.delayWhileIdle = true;
// message.timeToLive = 3;
// message.dryRun = true;
// // END OPTIONAL

// At least one required
registrationIds.push('APA91bHyiVyEoxe0l0z6hPhwB2UA6NrPPAQ-Edv-nckugIjXhLgZ9w55drr3wjGpZzs_7lRqpBUpwq9dkm3dSjjFOgRfUhL3j3FZkztdCoZ9CYON2u_Z_8iCbYO0abH67eD_mN1OwnOW8AT4PISce2OJEvkcTgtobQ');
 registrationIds.push('APA91bHyiVyEoxe0l0z6hPhwB2UA6NrPPAQ-Edv-APA91bHyiVyEoxe0l0z6hPhwB2UA6NrPPAQ-Edv-nckugIjXhLgZ9w55drr3wjGpZzs_7lRqpBUpwq9dkm3dSjjFOgRfUhL3j3FZkztdCoZ9CYON2u_Z_8iCbYO0abH67eD_mN1OwnOW8AT4PISce2OJEvkcTgtobQ'); 
registrationIds.push('APA91bHyiVyEoxe0l0z6hPhwB2UA6NrPPAQ-Edv-nckugIjXhLgZ9w55drr3wjGpZzs_7lRqpBUpwq9dkm3dSjjFOgRfUhL3j3FZkztdCoZ9CYON2u_Z_8iCbYO0abH67eD_mN1OwnOW8AT4PISce2OJEvkcTgtobQ'); 
 registrationIds.push('APA91bHyiVyEoxe0l0z6hPhwB2UA6NrPPAQ-Edv-nckugIjXhLgZ9w55drr3wjGpZzs_7lRqpBUpwq9dkm3dSjjFOgRfUhL3j3FZkztdCoZ9CYON2u_Z_8iCbYO0abH67eD_mN1OwnOW8AT4PISce2OJEvkcTgtobQ'); 
 registrationIds.push('APA91bEWcREoz7bpckOTXu1jIH02kQWpjdthATJn2Bk9aAjRHnV4jiD8EPzNO4MKKM6UMNwA6fUMnSO9MjGEMvd5EtR4r7-TIz6tpnHWlACir1UnYEPpL8oYqAqT-ByShMxHm0MTx4H_lkGHetQNwhZlZdJpsrKwYw'); 


/**
 * Params: message-literal, registrationIds-array, No. of retries, callback-function
 **/
sender.send(message, registrationIds, 4, function (err, result) {
    console.log(result);
});