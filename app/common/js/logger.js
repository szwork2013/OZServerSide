var MongoDB = require('winston-mongodb').MongoDB;
var winston = require('winston');
var CONFIG=require("config").OrderZapp;
 // var myCustomLevels = {
 //    levels: {
 //      dberror: 0,
 //      silly: 1,
 //      bad: 2,
 //      data: 3
 //    },
 //    colors: {
 //      data: 'blue',
 //      bad: 'green',
 //      silly: 'yellow',
 //      dberror: 'red'
 //    }
 //  };
var logger = new (winston.Logger)({
transports: [
    new (winston.transports.Console)({colorize:true}),
    new (winston.transports.MongoDB)({ host: CONFIG.dbHost,  db: CONFIG.dbName, collection: 'log'})
], exceptionHandlers: [ new winston.transports.Console() ]
});
//winston.setLevels(myCustomLevels.levels);
logger.on("error",function(message,email){
  logger.error(message,{"userid":email});
});
logger.on("info",function(message,email){
  logger.info(message,{"userid":email});
});
logger.on("log",function(message){
	if(CONFIG.debug==true){
      console.log(message);
    }
})
if(CONFIG.debug==false){
 logger.remove(winston.transports.Console);
}
//winston.addColors(myCustomLevels.colors);
module.exports=logger