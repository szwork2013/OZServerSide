var excelbuilder = require('msexcel-builder');
var workbook = excelbuilder.createWorkbook('./', 'sample.xlsx')
  
  // Create a new worksheet with 10 columns and 12 rows
  var sheet = workbook.createSheet('sheet1', 10, 12);
  var vendor={vednorname:"Copper Chocst",transactiondate:new Date()}
  var excelrows=[];
        excelrows.push(["DAILY TRANSACTION REPORT(ORDERZAPP)","","","","","",""]);
        excelrows.push(["","","","","","",""]);
        excelrows.push(["Vendor Name",vendor.vednorname,"","","","",""])
        excelrows.push(["Date:",vendor.transactiondate,"","","","",""]);
        excelrows.push(["","","","","","",""]);
        excelrows.push(["Created Orders","Order Value","Transaction Cost(2.5%)","Settlement Cost","Previous Balance","Final Settlement",""]);
       
        
        // excelrows.push([createdordersettlement.noofcreatedorders,createdordersettlement.totalordervalue,createdordersettlement.totaltransactioncost,createdordersettlement.totalsettlementcost,prevunsettledbal,totalsettlement,""]); 
        excelrows.push(["","","","","","",""]);
        excelrows.push(["Cancelled Orders","Order Value","Transaction Cost(2.5%)","Settlement Cost","","",""]);
       
        excelrows.push(["","","","","","",""]);
        excelrows.push(["","","","","","",""]);
        excelrows.push(["","","","","","",""]);
        excelrows.push(["Details Wise Report","","","","","",""]);
        excelrows.push(["Order No","Suborder No","Order Date","Order Value","Transaction Cost","Settlement Amount","Status"]);
        // sheet.set(1, 1, 'I am title');
        for(var i=1;i<excelrows.length;i++){
          for(var j=1;j<excelrows[i].length;j++){
            sheet.set(i, j,excelrows[i][j]);
          
            sheet.font(i, j,{name:'黑体',sz:'12',family:'3',bold:'true',iter:'true'});
            sheet.fill(i, j, {type:'solid',fgColor:'8',bgColor:'64'});
          }
        }
  // Fill some data
 
 
  
  
  // Save it
  workbook.save(function(ok){
    if (!ok) 
      workbook.cancel();
    else
      console.log('congratulations, your workbook created'+ok);
  });