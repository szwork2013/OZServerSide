var HHIcon=require("./hhicon");
var logger=require("../../common/js/logger");
exports.addIcon=function(io,__dirname){
	io.of('/uploadicon').on('connection', function(socket) {
    var sessionuserid=socket.handshake.user.userid;
    socket.on('addIcon', function(file,icondata) {
      var hhicon= new HHIcon(icondata);
     logger.emit("log",JSON.stringify(icondata));
      hhicon.removeAllListeners("failedAddIcon");
      hhicon.on("failedAddIcon",function(err){
        logger.emit("error", err.error.message,sessionuserid);
        socket.emit("addIconResponse",err);
      });
      hhicon.removeAllListeners("successfulAddIcon");
      hhicon.on("successfulAddIcon",function(result){
        logger.emit("info", result.success.message,sessionuserid);
        socket.emit("addIconResponse",null,result);
      });
      hhicon.addIcon(sessionuserid,__dirname,file);
  	})
  })
}
exports.searchIcons=function(req,res){
  console.log("test");
  var iconname=req.params.iconname;
  var hhicon=new HHIcon();
  hhicon.removeAllListeners("failedSearchIcon");
    hhicon.on("failedSearchIcon",function(err){
    logger.emit("error", err.error.message);
    res.send(err);
  });
  hhicon.removeAllListeners("successfulSearchIcon");
  hhicon.on("successfulSearchIcon",function(result){
    res.send(result);
  });
  hhicon.searchIcon(iconname);
}