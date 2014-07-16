var GCM = require('gcm').GCM;

var apiKey = '';
var gcm = new GCM("AIzaSyDzp1MHb_0fxjshwFJ5OtStOJszVWX7xx0");

var message = {
    registration_id: 'APA91bF4qPfIdVxtaOGYATQdepi3j476iid', // required
    collapse_key: 'Collapse key', 
    'data.key1': 'value1',
    'data.key2': 'value2'
};
console.log("test");
gcm.send(message, function(err, messageId){
    if (err) {
        console.log("Something has gone wrong!");
    } else {
        console.log("Sent with message ID: ", messageId);
    }
});