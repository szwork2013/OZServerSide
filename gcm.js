var GCM = require('gcm').GCM;

var apiKey = 'AIzaSyD9sNb97eYjsCzt1m7TGxDAHdZmnKigA-g';
var gcm = new GCM(apiKey);

var message = {
    registration_id: 'APA91bHfzWo_uQvcOpY9qeQzWV2HkP1MVMFzlNz1AkuIXiLMqisCSiWoG9ICEUbzbG0USQF4qtJ47x2un8-Ck1PjDS2KIszfFF0ys1YaJJ9o3zQQucodJKoB7mOfze4JbINPIMUbfjAqU4uuOFxzIELK1dienJBNQg', // required
    collapse_key: 'Collapse key', 
    'data.suborderid': 'value1',
    'data.status': 'value2'
};

gcm.send(message, function(err, messageId){
    if (err) {
        console.log("Something has gone wrong!");
    } else {
        console.log("Sent with message ID: ", messageId);
    }
});