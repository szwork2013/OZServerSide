var inbox = require("inbox");

var client = inbox.createConnection(false, "imap.giantleapsystems.com", {
    secureConnection: false,
    auth:{
        user: "orderzapp@giantleapsystems.com",
        pass: "Sunil12345"
    }
});

client.connect();

client.on("connect", function(){
    client.openMailbox("INBOX", function(error, info){
        if(error) throw error;
         console.log("info"+JSON.stringify(info))
        client.listMessages(-10, function(err, messages){
					messages.forEach(function(message){
            client.fetchData(message.UID, function(error, message){
              console.log(message);
            });
            // console.log(JSON.stringify(message))
          });
        });

    });
});