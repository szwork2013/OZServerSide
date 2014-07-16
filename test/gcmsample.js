var gcm = require('node-gcm');

// create a message with default values
var message = new gcm.Message();

// or with object values
var message = new gcm.Message({
    collapseKey: 'demo',
    delayWhileIdle: true,
    timeToLive: 3,
    data: {
        key1: 'message1',
        key2: 'message2'
    }
});

var sender = new gcm.Sender('AIzaSyDzp1MHb_0fxjshwFJ5OtStOJszVWX7xx0');
var registrationIds = [];

// OPTIONAL
// add new key-value in data object
// message.addDataWithKeyValue('key1','message1');
// message.addDataWithKeyValue('key2','message2');

// or add a data object
message.addDataWithObject({
    key1: 'message1',
    key2: 'message2'
});

// or with backwards compability of previous versions
message.addData('key1','message1');
message.addData('key2','message2');


message.collapseKey = 'do_not_collapse';
message.delayWhileIdle = true;
message.timeToLive = 3;
message.dryRun = true;
// END OPTIONAL

// At least one required
registrationIds.push('APA91bF4qPfIdVxtaOGYATQdepi3j476iid-rYGQ1kGvakXS4wJ8-dRPEhDxwrhXcm59UMte5Wn8CD3lapXhSyLbd6MhnMeSHbSsLwygZ7jTn3VEogJFJEHWceqKz__mZpW0Xzhmf3HC2avLZXtPC1iezsvge1q7Bw');
registrationIds.push('APA91bFapTbaNuyPAqYFSqKPZSvJDkdiSD9BbRbd7n6S27YIvANZ1yFx3gYEJzB1GueuswKn9OTKhQ6jQyv9023YeS3U2_yfS9qpQOjw3-peODyNXEP7oKuLrEIXpFKVSXmRm8zTs4gtErkHm19kdt0aGntaAZ0h8qWwNBEq4GHPkkkA2P8U3wE'); 
registrationIds.push('APA91bF4qPfIdVxtaOGYATQdepi3j476iid-rYGQ1kGvakXS4wJ8-dRPEhDxwrhXcm59UMte5Wn8CD3lapXhSyLbd6MhnMeSHbSsLwygZ7jTn3VEogJFJEHWceqKz__mZpW0Xzhmf3HC2avLZXtPC1iezsvge1q7Bw');
// registrationIds.push('APA91bF4qPfIdVxtaOGYATQdepi3j476iid-rYGQ1kGvakXS4wJ8-dRPEhDxwrhXcm59UMte5Wn8CD3lapXhSyLbd6MhnMeSHbSsLwygZ7jTn3VEogJFJEHWceqKz__mZpW0Xzhmf3HC2avLZXtPC1iezsvge1q7Bw');
registrationIds.push('APA91bFC6TwyynGM382ZnrCDzhlsinb8C-lKc59NDIGZJFB-Mq0isxyYl6XHrgM64SghVqXeBPlu418Hu2kmisdD9R7Sb_HrcGO8PcQMBoU5mNZwXXmsgZyhwMtvcD96wH0bkcDR8CCkb-WCkbVocVhlvGmyilyskw');
/**
 * Params: message-literal, registrationIds-array, No. of retries, callback-function
 **/
sender.send(message, registrationIds, 4, function (err, result) {
    console.log(err);
    console.log(result);
});