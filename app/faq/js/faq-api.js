var FAQ=require("./faq.js");
var logger = require("../../common/js/logger");
var S=require("string");
var getHtmlFAQResponse=function(result){
  var htmlresponse="<html><head>"
  htmlresponse+="<meta charset='utf-8'>";
  htmlresponse+="<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  htmlresponse+="<meta name='description' content=''>";
  htmlresponse+="<link rel='stylesheet' href='https://netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css'>"; 
  htmlresponse+="<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js'></script>"; 
  htmlresponse+="<script src='http://netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js'></script>" 
  htmlresponse+="</head><body><div style='border: 1px solid #EEE8E8; border-radius: 6px;' class=''>{{htmldata}}</div></body></html>";
  var htmldata="";
  if(result.success.faqs!=undefined){
    var faqs=result.success.faqs;
    console.log("faqs"+JSON.stringify(faqs));
    for(var i=0;i<faqs.length;i++){
      htmldata+="<div style='padding:20px;'><h2 style='font-size: 18px;font-weight: bold;line-height: 1.2em;letter-spacing: 0.21em;text-transform:uppercase;color: #0a4d6d;'>"+faqs[i].heading+"</h2></div>";
      htmldata+"<div class='panel-group' id='accordion'>"
      for(var j=0;j<faqs[i].faqs.length;j++){
        htmldata+="<div style='margin:5px;padding:5px;box-shadow: 0 0px 0px rgba(0,0,0,0.05);' class='panel'>";
        htmldata+="<div class='question'><p class='panel-title'>";
        htmldata+="<h4 style='cursor:pointer;color:#b3b3b3;line-height: 1.2em;letter-spacing: 0.21em;' data-toggle='collapse' data-parent='#accordion' href='#collapse"+i+j+"'>"
        htmldata+=faqs[i].faqs[j].question;
        htmldata+="</h4></p></div></div>"
        ///for answer
        htmldata+="<div id='collapse"+i+j+"' class='panel-collapse collapse'>"
        htmldata+="<div class=''>";
        htmldata+=faqs[i].faqs[j].answer
        htmldata+="</div></div>"
      }
      htmldata+="</div>"
    }
    htmlresponse=S(htmlresponse);
    htmlresponse=htmlresponse.replaceAll("{{htmldata}}",htmldata);
    htmlresponse=htmlresponse.s;
  }
  return htmlresponse;

}
exports.addFAQ=function(req,res){
  var sessionuserid=req.user.userid;
  var faqdata=req.body.faqdata;
  
  var faq= new FAQ(faqdata);
  // logger.emit("log",JSON.stringify(discountdata));
  faq.removeAllListeners("failedAddFAQ");
  faq.on("failedAddFAQ",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  faq.removeAllListeners("successfulAddFAQ");
  faq.on("successfulAddFAQ",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  
   faq.addFAQ(sessionuserid);
}
exports.updateFAQ=function(req,res){
  var sessionuserid=req.user.userid;
  var faqid=req.params.faqid;
  var faqdata=req.body.faqdata;
  
  var faq= new FAQ(faqdata);
  // logger.emit("log",JSON.stringify(discountdata));
  faq.removeAllListeners("failedUpdateFAQ");
  faq.on("failedUpdateFAQ",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  faq.removeAllListeners("successfulUpdateFAQ");
  faq.on("successfulUpdateFAQ",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  
   faq.updateFAQ(sessionuserid,faqid);
}
exports.getAllFAQ=function(req,res){
  
  
  var responsetype=req.query.responsetype;
  
  var faq= new FAQ();
  // logger.emit("log",JSON.stringify(discountdata));
  faq.removeAllListeners("failedGetAllFAQ");
  faq.on("failedGetAllFAQ",function(err){
    logger.emit("error", err.error.message);
    var response="";
    if(responsetype==undefined){
      response=err;
    }else if(responsetype.toLowerCase()=="json"){
      response=err;
    }else if(responsetype.toLowerCase()=="html"){
      response="<html><body><b>"+err.error.message+"</b></body></html>"
    }

    // socket.emit("addIconResponse",err);
    res.send(response);
  });
  faq.removeAllListeners("successfulGetAllFAQ");
  faq.on("successfulGetAllFAQ",function(result){
    logger.emit("info", result.success.message);
    if(responsetype==undefined){
      response=result;
    }else if(responsetype.toLowerCase()=="json"){
      response=result;
    }else if(responsetype.toLowerCase()=="html"){
      response=getHtmlFAQResponse(result)
    }
    res.send(response)
  });
  
   faq.getAllFAQ("",responsetype);
}
exports.deleteFAQ=function(req,res){
  var sessionuserid=req.user.userid;
  var faqid=req.params.faqid;
  
  var faq= new FAQ();
  // logger.emit("log",JSON.stringify(discountdata));
  faq.removeAllListeners("failedDeleteAQ");
  faq.on("failedDeleteAQ",function(err){
    logger.emit("error", err.error.message,sessionuserid);
    // socket.emit("addIconResponse",err);
    res.send(err);
  });
  faq.removeAllListeners("successfulDeleteFAQ");
  faq.on("successfulDeleteFAQ",function(result){
    logger.emit("info", result.success.message,sessionuserid);
    res.send(result)
  });
  
   faq.deleteFAQ(sessionuserid,faqid);
}