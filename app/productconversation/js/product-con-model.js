/*
* Overview: The schema model for Service Conversation
* Dated:
* Author:
* Copyright: GiantLeap Systems Private Limited 2013
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 03-03/2014 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');
var shortId = require('shortid');

var serviceConversationSchema = mongoose.Schema({
	servicecon_id:{type:String,unique:true},
	order_id:{type:String,unique:true},
	participants:{
					user_id:{type:String},
					message:{type:String},
					isServiceProvider:Boolean,
					// datetime:{type:Date.now()},
					message_to:{type:String}
				},
	status:{type:String,default:"active"}
});

serviceConversationSchema.pre('save', function(next) {
	var serviceconversation = this;
  	serviceconversation.servicecon_id = shortId.generate();
  	console.log("ServiceConversation pre " + serviceconversation);
  	next();
});

var ServiceConversationModel = mongoose.model('serviceconversations', serviceConversationSchema);
module.exports = ServiceConversationModel;
