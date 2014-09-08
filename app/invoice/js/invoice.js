var InvoiceModel=require("./invoice-model");
var logger=require("../../common/js/logger");
var events = require("events");
var ProductOrderModel=require("../../productorder/js/productorder-model");
var ProductProviderModel=require("../../productprovider/js/productprovider-model");
var UserModel=require("../../user/js/user-model");
var fs=require("fs");
var S=require("string");
var exec = require('child_process').exec;
var CONFIG=require("config").OrderZapp;
var amazonbucket=CONFIG.amazonbucket;
var AWS = require('aws-sdk');
AWS.config.update(CONFIG.amazon);
AWS.config.update({region:'ap-southeast-1'});
var s3bucket = new AWS.S3();
var Invoice = function(discountdata) {
  this.discount=discountdata;
};

Invoice.prototype = new events.EventEmitter;
module.exports = Invoice;
Invoice.prototype.getInvoiceDetials= function(branchid,suborderid) {
	var self=this;
	/////////////////////////////////////
	_getInvoiceDetails(branchid,suborderid)
	///////////////////////////////////
};
var _getInvoiceDetails=function(branchid,suborderid){
  InvoiceModel.findOne({suborderid:suborderid},{invoice:1},function(err,invoice){
  	if(err){
  		logger.emit("error","Database Error"+err);
  		self.emit("failedGetInvoiceDetails",{error:{code:"ED001",message:"Database Error"}})
  	}else if(!invoice){
  		self.emit("failedGetInvoiceDetails",{error:{message:"Invoice cannot be generated for the order"}})
  	}else{

  		//////////////////////////////////
  		_successfullGetInvoiceDetails(invoice);
  		/////////////////////////////////
  	}
  })
}
var _successfullGetInvoiceDetails=function(invoice){
	self.emit("successfulGetInvoiceDetails",{success:{message:"Getting Invoice Successfully",invoice:invoice.invoice.image}})
}
Invoice.prototype.createInvoice= function(branchid,suborderid,sessionuserid) {
  var self=this;
  /////////////////////////////////////
  _checkInvoiceAlreadyCreated(suborderid,sessionuserid,function(err,result){
    if(err){
      self.emit("failedCreateInvoice",err)
    }else{
      self.emit("successfulCreateInvoice",result)
    }
  })
  ////////////////////////////////
  
};
Invoice.prototype.sendInvoiceAfterOrderComplete=function(branchid,suborderid,sessionuserid,callback){
  console.log("calling to sendInvoiceAfterOrderComplete");
/////////////////////////////////////
  _checkInvoiceAlreadyCreated(suborderid,sessionuserid,function(err,result){
    if(err){
      callback(err)
    }else{
      callback(null,result)
    }
  })
  ////////////////////////////////
  
}
var _checkInvoiceAlreadyCreated=function(suborderid,sessionuserid,callback){
  InvoiceModel.findOne({suborderid:suborderid},function(err,invoice){
    if(err){
      logger.emit(" error","Database Error:_checkInvoiceAlreadyCreated"+err)
      callback({error:{message:"Database Error",code:"ED001"}})
    }else if(invoice){
      var url=invoice.invoice.image;
      ////////////////////////////
      callback(null,{success:{message:"Invoice Already created",invoice:url}})
      //////////////////////////
    }else{
      /////////////////////////////////////
      _createJSONForInvoice(suborderid,function(err,result){
        if(err){
          callback(err);
        }else{
          callback(null,result);
        }
      })
     ///////////////////////////////////
    }
  })
}
var _createJSONForInvoice=function(suborderid,callback){
  ProductOrderModel.aggregate({$match:{"suborder.suborderid":suborderid}},{$unwind:"$suborder"},{$match:{"suborder.suborderid":suborderid}},function(err,suborder){
    if(err){
      logger.emit(" error","Database Error:_createJSONForInvoice"+err)
      callback({error:{message:"Database Error",code:"ED001"}})
    }else if(suborder.length==0){
      callback({error:{message:"Incorrect SubOrder No "}})
    }else{
      var order=suborder[0];
      var suborder=suborder[0].suborder;
      
      console.log("suborder"+JSON.stringify(suborder));
      console.log("providerid"+suborder.productprovider.providerid);
      console.log("branchid"+suborder.productprovider.branchid);
      
      ProductProviderModel.aggregate({$match:{providerid:suborder.productprovider.providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":suborder.productprovider.branchid}},function(err,branch){
        if(err){
          callback({error:{message:"Database Error",code:"ED001"}})
          logger.emit("error","Database Error :_createJSONForInvoice"+err)
        }else if(branch.length==0){
          logger.emit("error","branchid is wrong");
          callback({error:{message:"Incorrect Branch ID"}})
          logger.emit("error","branchid is wrong for _createJSONForInvoice")
        }else{
          var selleruserid=branch[0].user.userid;
          var provider=branch[0]
          var branch=branch[0].branch;
          console.log("provider"+JSON.stringify(provider));
          // UserModel.findOne({userid:selleruserid},{email:1,firstname:1,lastname:1},function(err,selleruser){
          //   if(err){
          //     callback({error:{message:"Database Error",code:"ED001"}})
          //     logger.emit("error","Database Error :_createJSONForInvoice"+err)
          //   }else if(!selleruser){
          //     logger.emit("error","Incorrect User")
          //     callback({error:{message:"Incorrect User"}})
          //   }else{
              var contacts=branch.contact_supports;
              // var selleremail=selleruser.email;
              // console.log("selleruser"+selleruser.email);
              console.log("contact_supports"+contacts)
              var inoviceobject={orderid:suborder.suborderid,suborderid:suborder.suborderid,invoicedate:order.createdate,orderdate:order.createdate,tinno:provider.tax.tino,billing_address:suborder.billing_address,delivery_address:suborder.delivery_address,deliverytype:suborder.deliverytype}
              var products=[];
              inoviceobject.invoiceno=Math.floor(Math.random()*1000000)
              inoviceobject.buyername=order.consumer.name;
              inoviceobject.buyermobileno=order.consumer.mobileno;
              
              // console.log("suborder products"+order.suborder[i].products)
              var productprovider=JSON.stringify(suborder.productprovider);
              productprovider=JSON.parse(productprovider)
              productprovider.contact_supports=contacts;
              productprovider.email=productprovider.provideremail;
              for(var j=0;j<suborder.products.length;j++){
                var baseprice=suborder.products[j].orderprice*(1-suborder.products[j].tax*0.01);
                var tax=suborder.products[j].orderprice*suborder.products[j].tax*0.01;
                var orderprice=suborder.products[j].orderprice;
                var uom=suborder.products[j].uom;
                var qty=suborder.products[j].qty;
                var productname=suborder.products[j].productname;
                var productcode=suborder.products[j].productcode;
                var productprice=suborder.products[j].baseprice;
                var productconfiguration=suborder.products[j].productconfiguration;
                console.log("baseprice"+baseprice);
                console.log("taxprice"+tax);
                var product={qty:qty,productid:suborder.products[j].productid,orderprice:orderprice,uom:uom,productcode:productcode,productname:productname,baseprice:baseprice,tax:0,productprice:productprice,productconfiguration:productconfiguration}
                console.log("productsdddd"+product);
                products.push(product)
              }
              inoviceobject.products=products;
              console.log("products"+JSON.stringify(products))
              inoviceobject.taxprice=suborder.suborder_price*0.1;
              inoviceobject.baseorderprice=suborder.suborder_price*0.9;
              inoviceobject.productprovider=productprovider;
              inoviceobject.totalprice=suborder.suborder_price;
              inoviceobject.payment=suborder.payment;
              inoviceobject.deliverycharge=suborder.deliverycharge;
              inoviceobject.pickup_address=suborder.pickup_address;
              inoviceobject.deliverydate=suborder.deliverydate;
              inoviceobject.deliverytimeslot=suborder.deliverytimeslot;
              // inoviceobject.delivery
              logger.emit("log","invoice:\n"+JSON.stringify(inoviceobject))
              // var invoice_data=new InvoiceModel(inoviceobject);
              ////////////////////////////////////////////////////////////////
              _createPDFInvocie(inoviceobject,branch,function(err,result){
                if(err){
                  callback(err);
                }else{
                  callback(null,result);
                }
              })
              //////////////////////////////////////////////////
            // }
          // })
        }
    })
  }
})
}
var _createPDFInvocie=function(inoviceobject,branch,callback){
  fs.readFile('phantomjs/src/invoice.html', function (err, data) {
    if(err){
      logger.emit("error","Invoice Sample html Error:_createPDFInvocie "+err);
      callback({error:{message:""}})
    }else{
      var monthNames = [ "January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December" ];
      var htmldata=S(data);
       htmldata=htmldata.replaceAll("{{orderid}}",inoviceobject.orderid);
      htmldata=htmldata.replaceAll("{{invoiceno}}",inoviceobject.invoiceno);
     var invoicedate=new Date();
     htmldata=htmldata.replaceAll("{{invoicedate}}",invoicedate.getDate()+"-"+monthNames[invoicedate.getMonth()]+"-"+invoicedate.getFullYear());
     var orderdate=new Date(inoviceobject.orderdate);
     htmldata=htmldata.replaceAll("{{orderdate}}",orderdate.getDate()+"-"+monthNames[orderdate.getMonth()]+"-"+orderdate.getFullYear());
     htmldata=htmldata.replaceAll("{{tino}}",inoviceobject.tinno);
     htmldata=htmldata.replaceAll("{{servicetaxno}}",inoviceobject.servicetaxno);
     var seller_contact_supports=[];
     for(var i=0;i<inoviceobject.productprovider.contact_supports.length;i++){
      if(i<3){
        seller_contact_supports.push(inoviceobject.productprovider.contact_supports[i]);
      }
     }
     //delivery date and deliverytime slot
     var deliverydate=new Date(inoviceobject.deliverydate)
      htmldata=htmldata.replaceAll("{{deliverydate}}",deliverydate.getDate()+"-"+monthNames[deliverydate.getMonth()]+"-"+deliverydate.getFullYear());
      if(inoviceobject.deliverytimeslot){
         var a=parseInt(inoviceobject.deliverytimeslot.from);
      var b=inoviceobject.deliverytimeslot.from-a;
      var fromminutes=Math.round(b*60);
      var fromdeliverytimeslot=a+":"+fromminutes;
      a=parseInt(inoviceobject.deliverytimeslot.to);
       b=inoviceobject.deliverytimeslot.to-a;
      var tominutes=Math.round(b*60);
      var todeliverytimeslot=a+":"+tominutes;

      htmldata=htmldata.replaceAll("{{deliverytimeslot}}",fromdeliverytimeslot+" to "+todeliverytimeslot)
 
      }else{
          htmldata=htmldata.replaceAll("{{deliverytimeslot}}","")    
      }
     
     htmldata=htmldata.replaceAll("{{sellercontact}}",seller_contact_supports+"");
     htmldata=htmldata.replaceAll("{{selleremail}}",inoviceobject.productprovider.email);
     htmldata=htmldata.replaceAll("{{sellername}}",inoviceobject.productprovider.providername);
     //for delivery address
     var delivery_addressoject=inoviceobject.delivery_address;
     var delivery_address="";
    if(inoviceobject.delivery_address!=undefined){
      var delivery_locationkeys=Object.keys(delivery_addressoject)
      for(var i=0;i<delivery_locationkeys.length;i++){
        if(i==(delivery_locationkeys.length-1)){
          delivery_address+=delivery_addressoject[delivery_locationkeys[i]];  
        }else{
          delivery_address+=delivery_addressoject[delivery_locationkeys[i]]+",<br>";  
        }  
      }
    }
   
     //for pickup address
       var pickup_address="";
     var pickup_addressoject=inoviceobject.pickup_address;
    if(pickup_addressoject!=undefined){
      var pickup_locationkeys=Object.keys(pickup_addressoject)
       // console.log("locationkeys"+locationkeys)
    
      for(var i=0;i<pickup_locationkeys.length;i++){
        if(i==(pickup_locationkeys.length-1)){
         pickup_address+=pickup_addressoject[pickup_locationkeys[i]]+".";  
        }else{
         pickup_address+=pickup_addressoject[pickup_locationkeys[i]]+",<br>";  
        }  
      } 
    }
    
     
     if(inoviceobject.deliverytype.toLowerCase()=="home"){
      htmldata=htmldata.replaceAll("{{addresskeyname}}","Shipping Address");

     }else{
        htmldata=htmldata.replaceAll("{{addresskeyname}}","Pickup Address");
        delivery_address=pickup_address
     }

     htmldata=htmldata.replaceAll("{{deliveryaddress}}",delivery_address);
     htmldata=htmldata.replaceAll("{{totalprice}}",inoviceobject.totalprice);
       // htmldata=htmldata.replaceAll("{{sellercontact}}",inoviceobject.delivery_address);

       //for seller address
     var selleraddress="";
     var sellerlocation=JSON.stringify(inoviceobject.productprovider.location);
     sellerlocation=JSON.parse(sellerlocation)
     sellerlocation={address1:sellerlocation.address1,address2:sellerlocation.address2,address3:sellerlocation.address3,area:sellerlocation.area,city:sellerlocation.city,zipcode:sellerlocation.zipcode};
     var locationkeys=Object.keys(sellerlocation)
     console.log("locationkeys"+locationkeys)
     for(var i=0;i<locationkeys.length;i++){
      if(sellerlocation[locationkeys[i]]!=undefined){
        if(i==(locationkeys.length-1)){
          selleraddress+=sellerlocation[locationkeys[i]]+".";  
        }else{
          selleraddress+=sellerlocation[locationkeys[i]]+",";  
        }   
      }
     
    }
     


     htmldata=htmldata.replaceAll("{{selleraddress}}",selleraddress);
     htmldata=htmldata.replaceAll("{{sellerlogo}}",inoviceobject.productprovider.providerlogo);
     var billing_addressoject=inoviceobject.billing_address;
     var billing_address="";
     var billing_locationkeys=Object.keys(billing_addressoject)
     // console.log("locationkeys"+locationkeys)
     for(var i=0;i<billing_locationkeys.length;i++){
      if(i==(billing_locationkeys.length-1)){
        billing_address+=billing_addressoject[billing_locationkeys[i]]+".";  
      }else{
        billing_address+=billing_addressoject[billing_locationkeys[i]]+",<br>";  
      }  
    }
   
     htmldata=htmldata.replaceAll("{{billingaddress}}",billing_address);
     var buyername;
     if(inoviceobject.buyername==undefined || inoviceobject.buyername==null){
      buyername=" ";
     }else{
      buyername=inoviceobject.buyername;
     }
     htmldata=htmldata.replaceAll("{{buyername}}",buyername);
      htmldata=htmldata.replaceAll("{{buyermobileno}}",inoviceobject.buyermobileno);
     var productsobject=inoviceobject.products;
     var productshtml="";
     for(var i=0;i<productsobject.length;i++){
      var j=i+1;
       productshtml+="<tr>";
       productshtml+="<td><span contenteditable=''>"+j+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].productname+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].qty+"("+productsobject[i].uom+")</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].productprice+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].tax+"</span></td>";
       productshtml+="<td><span contenteditable='' style='float:right'>"+productsobject[i].orderprice+"</span></td>";
       productshtml+="</tr>";
        if(productsobject[i].productconfiguration!=undefined){
          if(productsobject[i].productconfiguration.length>0){
            productshtml+="<tr>"
            productshtml+="<td></td>";
            productshtml+="<td>Above price includes product configuration Prices</td>";
            var productconfiguration=productsobject[i].productconfiguration
            var configname="";
            var configvalue="";
            for(var j=0;j<productconfiguration.length;j++){
              if(productconfiguration[j].prod_configtype.toLowerCase()=="ftp"){
                configname+=productconfiguration[j].prod_configname+" ("+productconfiguration[j].data.ftp+")</br>";  
              }else{
                configname+=productconfiguration[j].prod_configname+"</br>";  
              }
             
             configvalue+=productconfiguration[j].prod_configprice.value+"</br>"
            }
            productshtml+="<td>"+configname+"</td>";
            productshtml+="<td>"+configvalue+"</td>";
            productshtml+="<td></td>";
            productshtml+="</tr>";
          }
        }
      }
      if(inoviceobject.deliverytype.toLowerCase()=="home"){
        if(inoviceobject.deliverycharge!=undefined && inoviceobject.deliverycharge!=0){
            productshtml+="<tr>"
            productshtml+="<td></td>";
            productshtml+="<td></td>";
            productshtml+="<td></td>";
            productshtml+="<td></td>";
            productshtml+="<td>+ Delivery Charges</td>";
            productshtml+="<td><span style='float:right'>"+inoviceobject.deliverycharge+"</span></td>";
            productshtml+="</tr>";
       }
       }
          htmldata=htmldata.replaceAll("{{products}}",productshtml);
     ////////////////////////////////////////
     _writeHtmlDataToFile(inoviceobject,htmldata.s,branch,function(err,result){
        if(err){
          callback(err);
        }else{
          callback(null,result);
        }
      });
     /////////////////////////////////////        
     console.log("htmldata"+htmldata)

    }
  
  });
}
var _writeHtmlDataToFile=function(inoviceobject,htmldata,branch,callback){
  var filename="test.html";
  var stream = fs.createWriteStream(filename);
  var pdfinvoice=inoviceobject.suborderid+".pdf";
  stream.once('open', function(fd) {
    stream.write(htmldata);
    exec("phantomjs/bin/phantomjs phantomjs/bin/rasterize.js "+filename+" "+pdfinvoice+" A4",function(err,out,code){
      if(err){
        callback({error:{message:"Invoice Pdf creation Error"}})
        logger.emit("error","Invoice html Error:_writeHtmlDataToFile "+err);
      }else{
        exec("rm -rf "+filename);
        //////////////////////////////////////////////////
        _saveInvoiceToAmazonServer(inoviceobject,htmldata,pdfinvoice,branch,function(err,result){
          if(err){
            callback(err);
          }else{
            callback(null,result);
          }
        })
        ////////////////////////////////////////////////
      }
    });
  });
}
var _saveInvoiceToAmazonServer=function(inoviceobject,htmldata,pdfinvoice,branch,callback){
  fs.readFile(pdfinvoice,function (err, data) {
    if(err){
       callback({error:{message:"Invoice PDF creation Error"}})
        logger.emit("error","Invoice html Error:_saveInvoiceToAmazonServer "+err);
    }else{
      var bucketFolder;
      var params;

      bucketFolder=amazonbucket+"/provider/"+inoviceobject.productprovider.providerid+"/branch/"+branch.branchid+"/invoice";
      params = {
         Bucket: bucketFolder,
         Key:inoviceobject.suborderid+pdfinvoice,
         Body: data,
         ACL: 'public-read',
         ContentType:"application/pdf"
      };
      s3bucket.putObject(params, function(err, data) {
        if (err) {
          callback({"error":{"message":"s3bucket.putObject:-_addProviderLogoToAmazonServer"+err}})
        } else {
          var params1 = {Bucket: params.Bucket, Key: params.Key,Expires: 60*60*24*365};
          s3bucket.getSignedUrl('getObject',params1, function (err, url) {
            if(err){
              // callback({"error":{"message":"_addProviderLogoToAmazonServer:Error in getting getSignedUrl"+err}});
              console.log("error"+err)
            }else{
             url=url.split("?")[0]
              exec("rm -rf "+pdfinvoice)
              console.log("url"+url)
              var invoicedata={bucket:params1.Bucket,key:params1.Key,image:url};
              //////////////////////////
               _saveInvoiceDataIntoCollection(inoviceobject,invoicedata,function(err,result){
                if(err){
                  callback(err);
                }else{
                  callback(null,result);
                }
              })
              //////////////////////////////
            }
          })
        }
      })
    }
  })
}
var _saveInvoiceDataIntoCollection=function(inoviceobject,invoicedata,callback){
  var inoviceobject={invoiceno:inoviceobject.invoiceno,orderid:inoviceobject.orderid,suborderid:inoviceobject.suborderid,invoicedate:new Date(),invoice:invoicedata};
  var invoice=new InvoiceModel(inoviceobject);
  invoice.save(function(err,invoice){
    if(err){
      logger.emit("error")
      callback({error:{code:"ED001",message:"Database Error"}})
    }else{
      ////////////////////////////////
      _successfullInvoiceCreation(invoicedata.image,function(err,result){
        if(err){
          callback(err);
        }else{
          callback(null,result);
        }
      })
      ////////////////////////////////
    }
  })

}
var _successfullInvoiceCreation=function(invoicepdf,callback){
  callback(null,{success:{message:"Invoice Created Successfully",invoice:invoicepdf}})
}

      ////////////////////////////////////////////////////////////////////////////
     