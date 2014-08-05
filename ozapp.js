/*
* Overview: Prodonus App
* A warranty and social network platform for products. It enables conversation between
* the manufacturers and consumers, both individuals and companies
* Dated:
* Author: Sunil More
* Copyright: Prodonus Software Private Limited and GiantLeap Systems Private Limited 2013
* Change History:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/


var express = require('express');
var http = require('http');
var fs = require('fs');
var passport=require('passport');
var path = require('path');
var api =require("./app/api/api");
var logger=require("./app/common/js/logger");
//var SessionSockets = require('session.socket.io');
// var connect = require('connect');
var passportSocketIo = require("passport.socketio");
var app = express();
var redis = require("redis").createClient();
var session      = require('express-session')
var RedisStore = require('connect-redis')(express);
var multer=require("multer");
var redisstore =new RedisStore({ host: 'localhost', port: 7000, client: redis,ttl:900});
var methodOverride = require('method-override')
//var session      = require('express-session')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var logger = require('express-logger');
// var errorHandler = require('express-error-handler');
// app.use(function(req, res, next) {

//   res.on('header', function() {
//     console.trace('HEADERS GOING TO BE WRITTEN');
//   });
//   next();
// });
//app.use(express.favicon());
// app.use(express.multipart({ uploadDir: './tmp/uploads' }));
app.use(logger({path: "./logfile.txt"}));
app.use(cookieParser());
app.use(bodyParser());
//app.use(express.json());
//app.use(express.urlencoded());
app.use(multer({ dest: './tmp/uploads/' }));
// app.use(express.methodOverride());
app.use(methodOverride('X-HTTP-Method-Override'))
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(session({secret:"qwerty1234",store: redisstore,key:"hhsid", cookie:{maxAge:2*3600*1000}}));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
//app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(function(req, res, next) {
  console.log("req url"+req.url)
  console.log("app use headers");
  req.headers['if-none-match'] = 'no-match-for-this';
  next();
});

/////to disable no cache always give 200 statuscode for eache request
//  app.disable('etag');
// enables compression for all requests
app.use(express.compress());

/*All the routes files are described and stored in the routes directory
* All the routes for prodonus are initialized in the code below. The init function
* is called on all the routes.
*/
// var server=http.createServer(app);
var server=http.createServer(app);
// app.use( errorHandler({server: server}) );

////////////socket i.o/////////////
var io = require('socket.io').listen(server);
// io.configure('production', function(){
//   logger.emit("log","socket config for production");
//   io.enable('browser client etag');
//   io.set('log level', 1);

//   io.set('transports', [
//     'websocket'
//   , 'flashsocket'
//   , 'htmlfile'
//   , 'xhr-polling'
//   , 'jsonp-polling'
//   ]);
// });

// io.configure('development', function(){
 //   logger.emit("log","socket config for development");
//   io.set('transports', ['websocket']);
// });
// io.set('authorization', passportSocketIo.authorize({
//   cookieParser: express.cookieParser,
//   key:         'hhsid',       // the name of the cookie where express/connect stores its session_id
//   secret:      "qwerty1234",    // the session_secret to parse the cookie
//   store:       redisstore,        // we NEED to use a sessionstore. no memorystore please
//   success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
//   fail:        onAuthorizeFail,     // *optional* callback on fail/error - read more below
// }));
//io.set( 'origins', '' );
// io.set('authorization', function (handshakeData, accept) {

//   if (handshakeData.headers.cookie) {

//     handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);

//     handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['hhsid'], 'qwerty1234');

//     if (handshakeData.cookie["hhsid"] == handshakeData.sessionID) {
//       return accept('Cookie is invalid.', false);
//     }

//   } else {
//     return accept('No cookie transmitted.', false);
//   } 

//   accept(null, true);
// });
function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
                                                                                                                                               
 // The accept-callback still allows us to decide whether to
  // accept the connection or not.
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept){
  if(error)
    console.log("redis server not  stared"+error);
    console.log('failed connection to socket.io:', message);

  // We use this callback to log all of our failed connections.
  accept(null, false);
}
////////////////////////////////////////
var RouteDir = './app/routes',
    files = fs.readdirSync(RouteDir);

files.forEach(function (file) {
    var filePath = path.resolve('./', RouteDir, file),
        route = require(filePath);
    route.init(app);
});

app.get("/api",function(req,res){
  res.send("Welcome to Order Zapp ");
})
// var log = new Log();

api.hhiconapi.addIcon(io,__dirname);

// // defines app settings with default values for Prodonus
// app.set('log level', process.env.PRODONUS_LOG_LEVEL || Log.DEBUG);
// app.set('session secret', process.env.PRODONUS_SESSION_SECRET || 'secret');
// app.set('session age', process.env.PRODONUS_SESSION_AGE || 3600);
app.set('port', process.env.OZ_PORT || 5000);
                     
server.listen(app.get('port'), function(){
  console.log('OrderZapp Products is ready to serv on port ' + app.get('port'));
});