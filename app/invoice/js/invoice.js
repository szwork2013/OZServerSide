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
AWS.config.update({accessKeyId:'AKIAJOGXRBMWHVXPSC7Q', secretAccessKey:'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'});
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
	_getInvoiceDetails(self,branchid,suborderid)
	///////////////////////////////////
};
var _getInvoiceDetails=function(self,branchid,suborderid){
  InvoiceModel.findOne({suborderid:suborderid},{invoice:1},function(err,invoice){
  	if(err){
  		logger.emit("error","Database Issue"+err);
  		self.emit("failedGetInvoiceDetails",{error:{code:"ED001",message:"Database Issue"}})
  	}else if(!invoice){
  		self.emit("failedGetInvoiceDetails",{error:{message:"Until Invoice not generated for order"}})
  	}else{

  		//////////////////////////////////
  		_successfullGetInvoiceDetails(self,invoice);
  		/////////////////////////////////
  	}
  })
}
var _successfullGetInvoiceDetails=function(self,invoice){
	self.emit("successfulGetInvoiceDetails",{success:{message:"Getting Invoice Successfully",invoice:invoice.invoice.image}})
}
Invoice.prototype.createInvoice= function(branchid,suborderid,sessionuserid) {
  var self=this;
  /////////////////////////////////////
  _checkInvoiceAlreadyCreated(self,suborderid,sessionuserid)
  ////////////////////////////////
  
};
var _checkInvoiceAlreadyCreated=function(self,suborderid,sessionuserid){
  InvoiceModel.findOne({suborderid:suborderid},function(err,invoice){
    if(err){
      logger.emit(" error","Database Issue:_checkInvoiceAlreadyCreated"+err)
      self.emit("failedCreateInvoice",{error:{message:"Database Issue",code:"ED001"}})
    }else if(invoice){
      var url=invoice.invoice.image;
      ////////////////////////////
      self.emit("successfulCreateInvoice",{success:{message:"Invoice Already created",invoice:url}})
      //////////////////////////
    }else{
      /////////////////////////////////////
      _createJSONForInvoice(self,suborderid,sessionuserid)
     ///////////////////////////////////
    }
  })
}
var _createJSONForInvoice=function(self,suborderid){
  ProductOrderModel.aggregate({$match:{"suborder.suborderid":suborderid}},{$unwind:"$suborder"},{$match:{"suborder.suborderid":suborderid}},function(err,suborder){
    if(err){
      logger.emit(" error","Database Issue:_createJSONForInvoice"+err)
      self.emit("failedCreateInvoice",{error:{message:"Database Issue",code:"ED001"}})
    }else if(suborder.length==0){
      self.emit("failedCreateInvoice",{error:{message:"suborderid is wrong "}})
    }else{
      var order=suborder[0];
      var suborder=suborder[0].suborder;
      
      console.log("suborder"+JSON.stringify(suborder));
      console.log("providerid"+suborder.productprovider.providerid);
      console.log("branchid"+suborder.productprovider.branchid);
      
      ProductProviderModel.aggregate({$match:{providerid:suborder.productprovider.providerid}},{$unwind:"$branch"},{$match:{"branch.branchid":suborder.productprovider.branchid}},function(err,branch){
        if(err){
          self.emit("failedCreateInvoice",{error:{message:"Database issue",code:"ED001"}})
          logger.emit("error","Database Issue :_createJSONForInvoice"+err)
        }else if(branch.length==0){
          logger.emit("error","branchid is wrong");
          self.emit("failedCreateInvoice",{error:{message:"branchid is wrong"}})
          logger.emit("error","branchid is wrong for _createJSONForInvoice")
        }else{
          var selleruserid=branch[0].user.userid;
          var branch=branch[0].branch;
          console.log("Branch"+JSON.stringify(branch));
          UserModel.findOne({userid:selleruserid},{email:1,firstname:1,lastname:1},function(err,selleruser){
            if(err){
              self.emit("failedCreateInvoice",{error:{message:"Database issue",code:"ED001"}})
              logger.emit("error","Database Issue :_createJSONForInvoice"+err)
            }else if(!selleruser){
              logger.emit("error","give selleruser id wrong")
            }else{
              var contacts=branch.contact_supports;
              var selleremail=selleruser.email;
              console.log("selleruser"+selleruser.email);
              console.log("contact_supports"+contacts)
              var inoviceobject={orderid:suborder.suborderid,suborderid:suborder.suborderid,invoicedate:order.createdate,orderdate:order.createdate,tinno:"taxno",billing_address:suborder.billing_address,delivery_address:suborder.delivery_address,deliverytype:suborder.deliverytype}
              var products=[];
              inoviceobject.invoiceno=Math.floor(Math.random()*1000000)
              inoviceobject.buyername=order.consumer.name;
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
              inoviceobject.pickup_address=suborder.pickup_address
              // inoviceobject.delivery
              logger.emit("log","invoice:\n"+JSON.stringify(inoviceobject))
              // var invoice_data=new InvoiceModel(inoviceobject);
              _createPDFInvocie(self,inoviceobject,branch);
              ////////////////////////////////
              // _SubOrderInvoiceCreation(suborders,++value,order);
              ////////////////////////
              // invoicearray.push(inoviceobject);
            }
          })
        }
    })
  }
})
}
var _createPDFInvocie=function(self,inoviceobject,branch){
  fs.readFile('invoicesample1.html', function (err, data) {
    if(err){
      logger.emit("error","Invoice Sample html Issue:_createPDFInvocie "+err);
      self.emit("failedCreateInvoice",{error:{message:""}})
    }else{
      var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];
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
      if(i==(locationkeys.length-1)){
        selleraddress+=sellerlocation[locationkeys[i]]+".";  
      }else{
        selleraddress+=sellerlocation[locationkeys[i]]+",";  
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
     var productsobject=inoviceobject.products;
     var productshtml="";
     for(var i=0;i<productsobject.length;i++){
      var j=i+1;
       productshtml+="<tr>";
       productshtml+="<td><span contenteditable=''>"+j+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].productname+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].qty+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].productprice+"</span></td>";
       productshtml+="<td><span contenteditable=''>"+productsobject[i].tax+"</span></td>";
       productshtml+="<td><span contenteditable='' style='float:right'>"+productsobject[i].orderprice+"</span></td>";
       productshtml+="</tr>";
        if(productsobject[i].productconfiguration!=undefined){
          if(productsobject[i].productconfiguration.length>0){
            productshtml+="<tr>"
            productshtml+="<td></td>";
            productshtml+="<td>Above price includes product configuration Prices</td>";
            var productconfiguration=[{prod_configname:"Photoprint",prod_configprice:{value:10}},{prod_configname:"egg",prod_configprice:{value:20}}]
            var configname="";
            var configvalue="";
            for(var j=0;j<productconfiguration.length;j++){
             configname+=productconfiguration[j].prod_configname+"</br>";
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
            productshtml+="<td>+delivery charges</td>";
            productshtml+="<td><span style='float:right'>"+inoviceobject.deliverycharge+"</span></td>";
            productshtml+="</tr>";
       }
       }
          htmldata=htmldata.replaceAll("{{products}}",productshtml);
     ////////////////////////////////////////
     _writeHtmlDataToFile(self,inoviceobject,htmldata.s,branch);
     /////////////////////////////////////        
     console.log("htmldata"+htmldata)

    }
  
  });
}
var _writeHtmlDataToFile=function(self,inoviceobject,htmldata,branch){
  var filename="test.html";
  var stream = fs.createWriteStream(filename);
  var pdfinvoice=inoviceobject.suborderid+".pdf";
  stream.once('open', function(fd) {
    stream.write(htmldata);
    exec("phantomjs/bin/phantomjs phantomjs/bin/rasterize.js "+filename+" "+pdfinvoice+" A4",function(err,out,code){
      if(err){
        self.emit("failedCreateInvoice",{error:{message:"Invoice Pdf creation issue"}})
        logger.emit("error","Invoice Sample html Issue:_writeHtmlDataToFile "+err);
      }else{
        exec("rm -rf "+filename);
        //////////////////////////////////////////////////
        _saveInvoiceToAmazonServer(self,inoviceobject,htmldata,pdfinvoice,branch)
        ////////////////////////////////////////////////
      }
    });
  });
}
var _saveInvoiceToAmazonServer=function(self,inoviceobject,htmldata,pdfinvoice,branch){
  fs.readFile(pdfinvoice,function (err, data) {
    if(err){
       self.emit("failedCreateInvoice",{error:{message:"Invoice Pdf creation issue"}})
        logger.emit("error","Invoice Sample html Issue:_saveInvoiceToAmazonServer "+err);
    }else{
      var bucketFolder;
      var params;

      bucketFolder=amazonbucket+"/provider/"+inoviceobject.productprovider.providerid+"/branch/"+branch.branchid+"/invoice";
      params = {
         Bucket: bucketFolder,
         Key:inoviceobject.suborderid+pdfinvoice,
         Body: data,
         //ACL: 'public-read-write',
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
              exec("rm -rf "+pdfinvoice)
              console.log("url"+url)
              var invoicedata={bucket:params1.Bucket,key:params1.Key,image:url};
              //////////////////////////
               _saveInvoiceDataIntoCollection(self,inoviceobject,invoicedata)
              //////////////////////////////
            }
          })
        }
      })
    }
  })
}
var _saveInvoiceDataIntoCollection=function(self,inoviceobject,invoicedata){
  var inoviceobject={invoiceno:inoviceobject.invoiceno,orderid:inoviceobject.orderid,suborderid:inoviceobject.suborderid,invoicedate:new Date(),invoice:invoicedata};
  var invoice=new InvoiceModel(inoviceobject);
  invoice.save(function(err,invoice){
    if(err){
      logger.emit("error")
      self.emit("failedCreateInvoice",{error:{code:"ED001",message:"Database Issue"}})
    }else{
      ////////////////////////////////
      _successfullInvoiceCreation(self,invoicedata.image)
      ////////////////////////////////
    }
  })

}
var _successfullInvoiceCreation=function(self,invoicepdf){
  self.emit("successfulCreateInvoice",{success:{message:"Invoice created Successfully",invoice:invoicepdf}})
}

      ////////////////////////////////////////////////////////////////////////////
     