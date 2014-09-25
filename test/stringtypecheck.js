var value="12/09";
var date=new Date(value);
var S=require("string")
var isNumeric = require("isnumeric");
var number=isNumeric(value);
console.log("date:"+date.getDate());
if(date.getMonth()){
	console.log("Nan");
}
console.log("number:"+number);