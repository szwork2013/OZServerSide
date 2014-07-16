var ProductProviderModel=require("../../productprovider/js/productprovider-model");
var ProviderGroupModel=require("./provider-group-model");
var UserModel=require("../../user/js/user-model");
var events = require("events");
var S=require("string");
var logger=require("../../common/js/logger");
var generateId = require('time-uuid');
var SMSTemplateModel=require("../../common/js/sms-template-model");
var __=require("underscore");
var regxemail = /\S+@\S+\.\S+/; 
var ProviderGroup = function(providergroupdata) {
  this.providergroup=providergroupdata;
};

function isArray(what) {
    return Object.prototype.toString.call(what) === '[object Array]';
}
ProviderGroup.prototype = new events.EventEmitter;
module.exports = ProviderGroup;
var isAuthorizedUserToManageGroup=function(userid,branchid,callback){
	logger.emit("log","isAuthorizedUserToManageGroup")
	UserModel.aggregate({$match:{userid:userid}},{"$unwind":"$provider"},{$match:{"provider.branchid":branchid}},function(err,userproductprovider){
		if(err){
			logger.emit("error","Database Issue: _isAuthorizedUserToManageGroup"+err);
			callback({"error":{"message":"Database Issue"}});
		}else if(userproductprovider.length==0){
			callback({"error":{"message":"User not belongs to Product Provider branch"}});
		}else{
			 if(userproductprovider[0].provider.isOwner!=true){
			 	 callback({"error":{"message":"You are not owner of ProductProvider to manage groups"}});
			 }else{
			    callback(null,true)
			 }
		}
	})
}
ProviderGroup.prototype.addGroupToBranch = function(sessionuser,providerid,branchid,groupdata) {
	var self=this;
	
	///////////////////////////////////////////////////////////////////////
	_validateBranchGroupData(self,sessionuser,providerid,branchid,groupdata);
	//////////////////////////////////////////////////////////////////////
};
var _validateBranchGroupData=function(self,sessionuser,providerid,branchid,groupdata){
	if(groupdata==undefined){
		self.emit("failedAddGroupToBranch",{"error":{code:"AV001",message:"Please provide groupdata"}});
	}else if(groupdata.grpname==undefined || groupdata.grpname==""){
		self.emit("failedAddGroupToBranch",{"error":{code:"AV001",message:"Please enter groupname"}});
	}else if(groupdata.description==undefined || groupdata.description==""){
		self.emit("failedAddGroupToBranch",{"error":{code:"AV001",message:"Please enter groupdescription"}});
	}else{
		groupdata.grpname=groupdata.grpname.toLowerCase();
		///////////////////////////////////////////////////
		_isAuthorizedUserToAddNewGroup(self,sessionuser,providerid,branchid,groupdata)
		//////////////////////////////////////////////////

	}
}
var _isAuthorizedUserToAddNewGroup=function(self,sessionuser,providerid,branchid,groupdata){
	isAuthorizedUserToManageGroup(sessionuser.userid,branchid,function(err,result){
		if(err){
			self.emit("failedAddGroupToBranch",err);
		}else{
			///////////////////////////////////////////////////
			 _checkGroupNameAlreadyExist(self,sessionuser,providerid,branchid,groupdata);
			/////////////////////////////////////////////////////////////////////////
		}
	})				
}
	
	var _checkGroupNameAlreadyExist=function(self,sessionuser,providerid,branchid,groupdata){

		ProviderGroupModel.findOne({providerid:providerid,branchid:branchid,"usergrp.grpname":groupdata.grpname},function(err,providergroup){
			if(err){
				logger.emit("error","Database Issue: _checkGroupNameAlreadyExist"+err);
				self.emit("failedAddGroupToBranch",{"error":{"message":"Database Issue"}});
			}else if(providergroup){
				self.emit("failedAddGroupToBranch",{"error":{"message":"Group name already exists"}});
			}else{	
				/////////////////////////////////////////////////////////////////
				_addGroupToBranch(self,sessionuser,providerid,branchid,groupdata);
				/////////////////////////////////////////////////////////////////
			}
		})
	}
	var _addGroupToBranch=function(self,sessionuser,providerid,branchid,groupdata){
		groupdata.grpname=groupdata.grpname.toLowerCase();
		groupdata.groupid=generateId();
		console.log("providerid"+providerid+" branchid"+branchid);
		ProviderGroupModel.update({providerid:providerid,branchid:branchid},{$push:{usergrp:groupdata}},function(err,grpaddstatus){
			if(err){
				logger.emit("error","Database Issue: _checkGroupNameAlreadyExist"+err);
				self.emit("failedAddGroupToBranch",{"error":{"message":"Database Issue"}});
			}else if(grpaddstatus==0){
				self.emit("failedAddGroupToBranch",{"error":{"message":"Branch id is wrong"}});
			}else{
				///////////////////////////////////
				_successfullGroupAddToBranch(self);
				///////////////////////////////////
			}
		})
	}
	var _successfullGroupAddToBranch=function(self){
		self.emit("successfulAddGroupToBranch",{success:{message:"New group added to the branch"}});
	}

ProviderGroup.prototype.removeGroupFromBranch = function(sessionuser,branchid,groupid) {
	var self=this;
	/////////////////////////////////////////////////////////////////
	_isAuthorizeUserToRemoveGroup(self,sessionuser,branchid,groupid)
	////////////////////////////////////////////////////////////////
};
var _isAuthorizeUserToRemoveGroup=function(self,sessionuser,branchid,groupid){
		isAuthorizedUserToManageGroup(sessionuser.userid,branchid,function(err,result){
		if(err){
			self.emit("failedRemoveGroupFromBranch",err);
		}else{
			   ///////////////////////////////////////////////////
			 	_removeGroupFromBranch(self,branchid,groupid);
				 	/////////////////////////////////////////////////////////////////////////
		}
	})
}
var _removeGroupFromBranch=function(self,branchid,groupid){
	ProviderGroupModel.aggregate({$match:{branchid:branchid}},{$unwind:"$usergrp"},{$match:{"usergrp.groupid":groupid}},function(err,usergroup){
		if(err){
			logger.emit("error","Database Issue: _removeGroupFromBranch"+err);
			self.emit("failedRemoveGroupFromBranch",{"error":{"code":"ED001","message":"Database Issue"}});
		}else if(usergroup.length==0){
			self.emit("failedRemoveGroupFromBranch",{"error":{"message":"groupid is wrong"}});
		}else{
			if(usergroup[0].usergrp.grpname=="admin"){
				self.emit("failedRemoveGroupFromBranch",{"error":{"message":"You can not remove admin group"}});
			}else{
				ProviderGroupModel.update({branchid:branchid},{$pull:{usergrp:{groupid:groupid}}},function(err,groupremovestatus){
					if(err){
						logger.emit("error","Database Issue: _removeGroupFromBranch"+err);
						self.emit("failedRemoveGroupFromBranch",{"error":{"code":"ED001","message":"Database Issue"}});
					}else if(groupremovestatus==0){
						self.emit("failedRemoveGroupFromBranch",{"error":{"message":"branchid is wrong"}});
					}else{
						////////////////////////////////////////
						_successfullRemoveGroupFromBranch(self);
						////////////////////////////////////////
					}
				})
			}
			
		}
	})
}
var _successfullRemoveGroupFromBranch=function(self){
	self.emit("successfulRemoveGroupFromBranch",{success:{message:"Successfully removed group"}})
}

ProviderGroup.prototype.addMembersToGroup = function(sessionuser,branchid,groupid,invites){
	var self=this;
	////////////////////////////////////////////////////////////////////////
	_validateGroupMemberData(self,sessionuser,branchid,groupid,invites)
	////////////////////////////////////////////////////////////////////////
};
var _validateGroupMemberData=function(self,sessionuser,branchid,groupid,invites){
	if(invites==undefined){
		self.emit("failedAddMembersToGroup",{error:{message:"please provides invites data"}})
	}else if(invites.grpname==undefined || invites.grpname==""){
		self.emit("failedAddMembersToGroup",{error:{message:"please provides group name"}})
	}else if(!isArray(invites.members)){
		self.emit("failedAddMembersToGroup",{error:{message:"invites should be an array"}})
	}else if(invites.members.length==0){
		self.emit("failedAddMembersToGroup",{error:{message:"please enter atleast one member"}})
	}else{
		console.log("invites"+JSON.stringify(invites));
		////////////////////////////////////////////////////////////////////////////
		_isAuthoRizedUserToAddGroupMember(self,sessionuser,branchid,groupid,invites)
		//////////////////////////////////////////////////////////////////////////
	}
}
var _isAuthoRizedUserToAddGroupMember=function(self,sessionuser,branchid,groupid,invites){
	isAuthorizedUserToManageGroup(sessionuser.userid,branchid,function(err,result){
		if(err){
			self.emit("failedAddMembersToGroup",err);
		}else{
			console.log("_isAuthoRizedUserToAddGroupMember")
			ProductProviderModel.aggregate({$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$project:{branchid:"$branch.branchid",branchname:"$branch.branchname",providerid:1,usergrp:"$branch.usergrp",providername:1}},function(err,providerbranch){
				if(err){
					logger.emit("error","Database Issue: _isAuthorizedUserToAddNewGroup"+err);
	      	self.emit("failedAddMembersToGroup",{"error":{"message":"Database Issue"}});
				}else if(providerbranch.length==0){
					self.emit("failedAddMembersToGroup",{"error":{"message":"Branch does not exist"}});
				}else{
					console.log("test1");
					var branch=providerbranch[0];
					/////////////////////////////////////////////////////////////////
					_addUserGrpDetailsToServiceBranch(self,branch,sessionuser,invites.members,invites.grpname,groupid)
					////////////////////////////////////////////////////////////////
				}
			})
		}
	})
}
var _addUserGrpDetailsToServiceBranch=function(self,branch,sessionuser,members,grpname,groupid){
	// var members=usergrp.members;
	console.log("members"+members);
  var userinvites=[];
	console.log("memberdetails"+JSON.stringify(members));
	for(var i=0;i<members.length;i++){
		if(members[i].mobileno!=undefined && members[i].email!=undefined){
			if( S(members[i].mobileno).isNumeric() && members[i].mobileno.length==10 || members[i].length==12 && regxemail.test(members[i].email)){
				if(members[i].mobileno.length==10){
					members[i].mobileno="91"+members[i].mobileno;
					userinvites.push({mobileno:members[i].mobileno,email:members[i].email});
				}else{
					userinvites.push({mobileno:members[i].mobileno,email:members[i].email});
				}
			}	
		}
	}
 if(userinvites.length==0){
 	        self.emit("failedAddMembersToGroup",{"error":{"message":"Please pass valid mobileno and email"}});
 }else{
 	var userinvitesmobileno=[];
 var uniqueuserinvites=[];
 for(var i=0;i<userinvites.length;i++){
 	if(userinvitesmobileno.indexOf(userinvites[i].mobileno)<0){
 		uniqueuserinvites.push(userinvites[i]);
 		userinvitesmobileno.push(userinvites[i].mobileno)
 	}
 }
	userinvites=uniqueuserinvites;
	
	UserModel.find({mobileno:{$in:userinvitesmobileno}},{mobileno:1,username:1,email:1}).lean().exec(function(err,user){
    if(err){
    	logger.emit("error","Database Issue,fun:_addServiceProviderDetailsToTheUser"+err,user.userid);
	  	self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
    }else{
    	var existingusers=[];
    	 var existingmobileno=[];
      for(var i=0;i<user.length;i++)
      {
        existingmobileno.push(user[i].mobileno);
        existingusers.push({mobileno:user[i].mobileno,firstname:user[i].firstname,email:user[i].email});
      }
      
      var newusers=[];

      for(var i=0;i<userinvites.length;i++){
      	if(existingmobileno.indexOf(userinvites[i].mobileno)<0){
      		newusers.push(userinvites[i]);
      	}
      }
      console.log("newusers"+JSON.stringify(userinvites));
      // newusers=__.difference(userinvites,existingusers);
      // console.log("newusers"+JSON.stringify(newusers));
      if(newusers.length>0){
      	var userdata=[];
      	for(var i=0;i<newusers.length;i++)
     		{ 
     			var newuserproviderdata=[{providerid:branch.providerid,branchid:branch.branchid,isOwner:false,confirmed:false}] 
     			if(grpname.toLowerCase()=="admin"){
     				newuserproviderdata=[{providerid:branch.providerid,branchid:branch.branchid,isOwner:true,confirmed:false}]
     			}
			    userdata.push({mobileno:newusers[i].mobileno,password:Math.floor(Math.random()*1000000),usertype:"provider",username:newusers[i].email ,email:newusers[i].email, provider:newuserproviderdata});
     		}
      
      	console.log("userdata"+JSON.stringify(userdata));
        UserModel.create(userdata,function(err,grpusers){
          if(err){
          	logger.emit("error","Database Issue:fun/_addUserGrpDetailsToServiceProvider"+err)
            self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
          }else if(grpusers){
          	/////////////////////////////////////////////////
            _sendSMSToInvitees(self,branch,grpname,existingusers,newusers,sessionuser,groupid);
            /////////////////////////////////////////////////
          }
        })
      }else{//if the provided mobile number is already registered with Orderzapp
      /////////////////////////////////////////////////////////////
     	 _sendSMSToInvitees(self,branch,grpname,existingusers,newusers,sessionuser,groupid);
     	////////////////////////////////////////////////////////////
	    }
	  }
  })	
 }
 
}
var _sendSMSToInvitees = function(self,branch,grpname,existingusers,newusers,user,groupid){
		// self.emit("abc",{"message":"test"});
		SMSTemplateModel.findOne({name:"productprovidermemberinvite"}).lean().exec(function(err,nespusertemplate){
	  	if(err){
	  		logger.emit("error","Database Issue :fun-_sendSMSToInvitees")
	    	self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
	  	}else if(nespusertemplate){
	  		SMSTemplateModel.findOne({name:"productprovidermemberonlyinvite"}).lean().exec(function(err,spusertemplate){
	  			if(err){
	    			 self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Error in db to find invite email templates"}});
	  			}else if(spusertemplate){
	  				for(var i=0;i<newusers.length;i++){
	            self.emit("sendinvitetospnewuser",newusers[i],nespusertemplate,branch,grpname);
	          }
         		for(var j=0;j<existingusers.length;j++)
            {
            	self.emit("sendinvitetospuser",existingusers[j],spusertemplate,branch,grpname);
            }
	            ///////////////////////////////////////
	             _addBranchMembersToUserGroupOther(self,existingusers,newusers,branch,groupid);
	            /////////////////////////////
	            ////////////////////////////////////////////////////////////////////
	            _addProviderProviderBranchDetailsToTheUser(self,branch,existingusers,user,grpname);
	           //////////////////////////////////////////////////////////
	    	}else{
	  				self.emit("failedAddMembersToGroup",{"error":{"code":"ED002","message":"Server setup template issue"}});
	  		}
			})//end of orgmemberonlyinvite
		}else{
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED002","message":"Server setup template issue"}});		
		}
	})
}
var _addProviderProviderBranchDetailsToTheUser=function(self,branch,existingusers,user,grpname){
	// console.log("userid"+user.userid);
	var existingusers_array=[];
	for(var i=0;i<existingusers.length;i++){
		if(existingusers[i].mobileno!=user.mobileno){
			existingusers_array.push(existingusers[i]);
		}
	}
	console.log("branchid"+branch.branchid)
	var existingusers_mobileno=[];
	for(var j=0;j<existingusers_array.length;j++){
  	existingusers_mobileno.push(existingusers[j].mobileno)
	}
	console.log("existingmobileno"+existingusers_mobileno);
	var userprovidersetdata={providerid:branch.providerid,branchid:branch.branchid,isOwner:false,confirmed:false}
	if(grpname.toLowerCase()=="admin"){
    userprovidersetdata	.isOwner=true;
	}
	if(grpname.toLowerCase()=="admin"){
		UserModel.update({mobileno:{$in:existingusers_mobileno},"provider.branchid":branch.branchid},{$set:{"provider.$.isOwner":true}},{multi:true},function(err,userprovideradminstatus){
			if(err){
				logger.emit("error","Database Issue :_addProviderProviderBranchDetailsToTheUser"+err)
			}else if(userprovideradminstatus==0){
				logger.emit("error","no members for admin group")
			}else{
				logger.emit("log","members set to admin")
			}
		})
	}
	UserModel.update({mobileno:{$in:existingusers_mobileno},"provider.branchid":{$ne:branch.branchid}},{$addToSet:{provider:userprovidersetdata}},{multi:true},function(err,providerupdatestatus){
	  if(err){
	 		logger.emit("error","Database Issue,fun:_addServiceProviderDetailsToTheUser"+err,user.userid);
			// self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
	  }else if(providerupdatestatus==0){
	  	
	   	// self.emit("failedAddMembersToGroup",{"error":{"message":"Userid is wrong"}});
	  }else{
			UserModel.update({userid:{$in:existingusers_mobileno}},{$set:{usertype:"provider"}},{multi:true},function(err,providerstatus){
			  if(err){
			 		logger.emit("error","Database Issue,fun:_addServiceProviderDetailsToTheUser"+err,user.userid);
					self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
			  }else if(providerstatus==0){
			   	// logger.emit("failedAddMembersToGroup",{"error":{"message":"No user exists"}});
			   	logger.emit("NO user find add provider details")
			  }else{
		  	logger.emit("info","Added ProductProviderBranch Details To The User")
		  	}
			})
		}
	})
}
var _addBranchMembersToUserGroupOther=function(self,existingusers,newusers,branch,groupid){
	var mobilenos=[];

	for(var i=0;i<existingusers.length;i++){
		mobilenos.push(existingusers[i].mobileno)
	}
	for(var i=0;i<newusers.length;i++){
		mobilenos.push(newusers[i].mobileno)	
	}
	// console.log("mobidddddddddddlenos"+mobilenos)
	UserModel.find({mobileno:{$in:mobilenos}},function(err,users){
		if(err){
			logger.emit("error","Database Issue _addProductProviderMembersToUserGroupOther"+err);
			self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
    }else if(users.length==0){
    	self.emit("failedAddMembersToGroup",{"error":{"message":"No user exists"}});
		}else{
			var grpmembers=[];
			for(var i=0;i<users.length;i++){
				grpmembers.push(users[i].userid);
			}
			ProviderGroupModel.update({branchid:branch.branchid,"usergrp.groupid":groupid},{$addToSet:{"usergrp.$.grpmembers":{$each:grpmembers}}},function(err,addgrpstats){
				if(err){
					logger.emit("error","Database Issue _addProviderMembersToUserGroupOther"+err);
					self.emit("failedAddMembersToGroup",{"error":{"code":"ED001","message":"Database Issue"}});
				}else if(addgrpstats==0){
					self.emit("failedAddMembersToGroup",{"error":{"message":"Given group id not exists"}});
					// logger.emit("error","userinvte not added to the serviceproviderlist");
				}else{
					///////////////////////////////////////
		   		_succesfullAddMemberToGroup(self);
		   		//////////////////////////////////////	
		   	}
			})
		}
	})
}
var _succesfullAddMemberToGroup=function(self){
	self.emit("successfulAddMembersToGroup",{success:{message:"Member added to group successfully"}})
}
ProviderGroup.prototype.getMyGroupMembers = function(sessionuser,providerid,branchid){
	var self=this;
/////////////////////////////////////////////////////////////////
_isAuthorizeUserToGetMemberDetails(self,sessionuser,providerid,branchid)
/////////////////////////////////////////////////////////////////
};
var _isAuthorizeUserToGetMemberDetails=function(self,sessionuser,providerid,branchid){
	isAuthorizedUserToManageGroup(sessionuser.userid,branchid,function(err,result){
		if(err){
					self.emit("failedGetMyGroupMembers",err);
		}else{
				 /////////////////////////////////////////////
				 _getMyGroupMembers(self,providerid,branchid);
				 //////////////////////////////////////////
			
		}
	})
}
			
	var _getMyGroupMembers=function(self,providerid,branchid){
		ProviderGroupModel.findOne({providerid:providerid,branchid:branchid},function(err,providergroup){
			if(err){
				logger.emit("error","Database Issue: _getMyGroupMembers"+err);
				self.emit("failedGetMyGroupMembers",{"error":{"message":"Database Issue"}});
			}else if(!providergroup){
				self.emit("failedGetMyGroupMembers",{"error":{"message":"providergroup branchid is wrong"}});
			}else{
				providergroup=JSON.stringify(providergroup);
				providergroup=JSON.parse(providergroup);
				
				var usergrp=providergroup.usergrp;
				var userarray=[];
				for(var i=0;i<usergrp.length;i++){
					userarray=__.union(userarray,usergrp[i].grpmembers);
				}
				console.log("userarray"+JSON.stringify(userarray))
				UserModel.find({userid:{$in:userarray}},{user_avatar:1,firstname:1,mobileno:1,userid:1,email:1,username:1},function(err,groupmemers){
					if(err){
						logger.emit("error","Database Issue: _getMyGroupMembers"+err);
			    	self.emit("failedGetMyGroupMembers",{"error":{"message":"Database Issue"}});
					}else if(groupmemers.length==0){
						self.emit("failedGetMyGroupMembers",{"error":{"message":"No group members exists"}});		
					}else{
						var userids=[];
						for(var j=0;j<groupmemers.length;j++){
							userids.push(groupmemers[j].userid);
						}
						// console.log("userids"+userids)
						var newusergrp=[];
						for(var k=0;k<usergrp.length;k++){
							var usergroup={groupid:usergrp[k].groupid,grpname:usergrp[k].grpname,description:usergrp[k].description}
							var group_members=[];
							for(var l=0;l<usergrp[k].grpmembers.length;l++){
								if(userids.indexOf(usergrp[k].grpmembers[l])>=0){
									var indexvalue=userids.indexOf(usergrp[k].grpmembers[l]);
									group_members.push({userid:groupmemers[indexvalue].userid,mobileno:groupmemers[indexvalue].mobileno,name:groupmemers[indexvalue].firstname,profilepic:groupmemers[indexvalue].user_avatar,email:groupmemers[indexvalue].email,username:groupmemers[indexvalue].username})
								}
							}
							console.log("group_members"+JSON.stringify(group_members))
							usergroup.grpmembers=group_members
							console.log()
							newusergrp.push(usergroup);
						}
						providergroup.usergrp=newusergrp;
						/////////////////////////////////////
						_successfullGetMyGroupMembers(self,providergroup)
						////////////////////////////////////
					}
				})
			}
		})
	}
	var _successfullGetMyGroupMembers=function(self,providergroup){
		self.emit("successfulGetMyGroupMembers",{success:{message:"Getting Groupmembers successfully",usergrp:providergroup.usergrp}})
	}
	ProviderGroup.prototype.removeMemberFromGroup = function(sessionuser,branchid,groupid,memberid){
	var self=this;
    /////////////////////////////////////////////////////////////////
   _isAuthorizeToRemoveMemberFromUsergroup(self,sessionuser,branchid,groupid,memberid)
    /////////////////////////////////////////////////////////////////
   };
   var _isAuthorizeToRemoveMemberFromUsergroup=function(self,sessionuser,branchid,groupid,memberid){
   	logger.emit("log","_isAuthorizeToRemoveMemberFromUsergroup");
   	isAuthorizedUserToManageGroup(sessionuser.userid,branchid,function(err,result){
   		if(err){
   			self.emit("failedRemoveMemberFromGroup",err);
   		}else{
   			logger.emit("log","Tesing");
   			ProductProviderModel.aggregate({$match:{"branch.branchid":branchid}},{$unwind:"$branch"},{$match:{"branch.branchid":branchid}},{$project:{branchid:"$branch.branchid",branchname:"$branch.branchname"}},function(err,branch){
   				if(err){
   					logger.emit("error","Database Issue: _isAuthorizeToRemoveMemberFromUsergroup"+err);
			      self.emit("failedRemoveMemberFromGroup",{"error":{"message":"Database Issue"}});
   				}else if(branch.length==0){
   					 self.emit("failedRemoveMemberFromGroup",{"error":{"message":"branchid is wrong"}});
   				}else{
   					logger.emit("log","Tesing11");
   					var branch=branch[0];
   						//////////////////////////////////////////////////////////////////
   			     _isLastAdminGroupMember(self,sessionuser,branchid,groupid,memberid,branch)
   			     ///////////////////////////////////////////////////////////
   				}
   			})
   		}
   	})
   }
   var _isLastAdminGroupMember=function(self,sessionuser,branchid,groupid,memberid,branch){
   	ProviderGroupModel.aggregate({$match:{branchid:branchid}},{$unwind:"$usergrp"},{$match:{"usergrp.groupid":groupid}},function(err,usergroupdata){
   		if(err){
   			logger.emit("error","Database Issue: _isLastAdminGroupMember"+err);
			  self.emit("failedRemoveMemberFromGroup",{"error":{"message":"Database Issue"}});
   		}else if(usergroupdata.length==0){
   			self.emit("failedRemoveMemberFromGroup",{"error":{"message":"groupid is wrong"}});
   		}else{
   			var groupmemers=usergroupdata[0].usergrp.grpmembers;
   			console.log("Groupmembers"+JSON.stringify(usergroupdata[0]))	
   			if(groupmemers.indexOf(memberid)<0){
   				self.emit("failedRemoveMemberFromGroup",{"error":{"message":"Given memberid does not exists in group"+usergroupdata[0].usergrp.grpname}});
   			}else if(usergroupdata[0].usergrp.grpname.toLowerCase()=="admin" && groupmemers.length==1){
   				self.emit("failedRemoveMemberFromGroup",{"error":{"message":"In Admin group atleast have one member"}});
   			}else{
   				/////////////////////////////////
   					_isMemberContainsInOtherGroup(self,sessionuser,branchid,groupid,memberid,branch,usergroupdata[0].usergrp)
   				////////////////////////////////
   			} 	
   		}
   	})
   }
   	var _isMemberContainsInOtherGroup=function(self,sessionuser,branchid,groupid,memberid,branch,groupdata){
   		ProviderGroupModel.aggregate({$match:{branchid:branchid}},{$unwind:"$usergrp"},{$match:{"usergrp.grpmembers":memberid}},function(err,groups){
   			if(err){
   				logger.emit("error","Database Issue: _isMemberContainsInOtherGroup"+err);
			    self.emit("failedRemoveMemberFromGroup",{"error":{"message":"Database Issue"}});
   			}else if(groups.length==0){	
   				self.emit("failedRemoveMemberFromGroup",{"error":{"message":"memberid is wrong"}});
   			}else{
   				if(groups.length==1){
   					if(sessionuser.userid==memberid){
   						//////////////////////////////////////////////////////////////////
   					_removeMemberFromBranch(self,sessionuser,branchid,groupid,memberid,branch,groupdata)
   					///////////////////////////////////////////////////////
   					}else{
   						///////////////////////////////////////////
   					_removeProviderBranchDetailsFromMember(self,sessionuser,branchid,groupid,memberid,branch,groupdata)
   					/////////////////////////////////////////	
   					}
   					
   				}else{
   						//////////////////////////////////////////////////////////////////
   					_removeMemberFromBranch(self,sessionuser,branchid,groupid,memberid,branch,groupdata)
   					///////////////////////////////////////////////////////	
   				}
   			}
   		})
   	}
   	var _removeProviderBranchDetailsFromMember=function(self,sessionuser,branchid,groupid,memberid,branch,groupdata){
   		if(sessionuser.usrid==memberid){
   			logger.emit("error","You are owner you can not remove providr branch details")
   		}else{
   			

   			UserModel.update({userid:memberid},{$pull:{provider:{branchid:branchid}}},function(err,userproviderremovestatus){
	   			if(err){
	   				logger.emit("error","Database Issue: _removeProviderBranchDetailsFromMember"+err);
				    self.emit("failedRemoveMemberFromGroup",{"error":{"message":"Database Issue"}});
	   			}else if(userproviderremovestatus==0){
	   				self.emit("failedRemoveMemberFromGroup",{"error":{"message":"Member Does not exists"}});
	   			}else{
	   				//////////////////////////////////////////////////////////////////
	   					_removeMemberFromBranch(self,sessionuser,branchid,groupid,memberid,branch,groupdata)
	   					///////////////////////////////////////////////////////
	   			}
   			})
   		
   		}
   		
   	}
   	var _removeMemberFromBranch=function(self,sessionuser,branchid,groupid,memberid,branch,groupdata){
   		ProviderGroupModel.update({branchid:branchid,"usergrp.groupid":groupid},{$pull:{"usergrp.$.grpmembers":memberid}},function(err,memberremovestatus){
   			if(err){
   				logger.emit("error","Database Issue: _removeMemberFromBranch"+err);
			    self.emit("failedRemoveMemberFromGroup",{"error":{"message":"Database Issue"}});
   			}else if(memberremovestatus==0){
   				self.emit("failedRemoveMemberFromGroup",{"error":{"message":"groupid is wrong"}});
   			}else{
   				console.log("groupdata"+groupdata);
   				if(groupdata.grpname=="admin"){
   					///////////////////////////////
   					_removeAdminProviderRoleFromUser(branchid,memberid)
   					////////////////////////////////
   				}
   				/////////////////////////////////////////////
   				_sendNotificatForRemovingMember(self,memberid,branch,groupdata);
   				//////////////////////////////////////////
   				////////////////////////////////////
   				_successfullRemoveMemberFromGroup(self,groupdata)
   				///////////////////////////////////
   			}
   		})
   	}
   	var _successfullRemoveMemberFromGroup=function(self,groupdata){
   		self.emit("successfulRemoveMemberFromGroup",{success:{message:"successfully remove member from group"+groupdata.grpname}})
   	}
   	var 	_removeAdminProviderRoleFromUser=function(branchid,memberid){
   		UserModel.update({userid:memberid,"provider.branchid":branchid},{$set:{"provider.$.isOwner":false}},function(err,userprovideramdinremovestatus){
   			if(err){
   				logger.emit("error","Database Issue :_removeAdminProviderRoleFromUser"+err)
   			}else if(userprovideramdinremovestatus==0){
   				logger.emit("error","branchid or userid wrong for _removeAdminProviderRoleFromUser")
   			}else{
   				logger.emit("log","remove admin role from provider");
   			}
   		})
   	}
   var _sendNotificatForRemovingMember=function(self,memberid,branch,groupdata){
   	UserModel.findOne({userid:memberid},{firstname:1,email:1,mobileno:1,preffered_lang:1},function(err,user){
   		if(err){
   			logger.emit("error","Database Issue :_sendNotificatForRemovingMember"+err)
   		}else if(!user){
   			logger.emit("error","member does not exists")
   		}else{
   			///////////////////////////
   			_sendSMSNotificationForRemovingMember(self,user,branch,groupdata)
   			/////////////////////////
				//////////////////////////////////////
				_sendEmailNotificationForRemovingMember(self,user,branch,groupdata)
				///////////////////////////////
			}
 		})
 }
  var _sendSMSNotificationForRemovingMember=function(self,user,branch,groupdata){
		SMSTemplateModel.findOne({name:"productprovidermemberremove",lang:user.preffered_lang},function(err,smstemplate){
			if(err){
					logger.emit("error","Database Issue :_sendNotificatForRemovingMember"+err)
			}else if(!smstemplate){
				logger.emit("error","SMS template not found for productprovidermemberremove in lang"+user.preffered_lang)
			}else{
							   				
				self.emit("sendsmsnotificationforremovingmember",user,branch,groupdata,smstemplate)
			}
		})
	}
	var _sendEmailNotificationForRemovingMember=function(self,user,branch,groupdata){
		///EMAIL TEMPLATE DATA 
		var emailtemplate="You have been removed from group <groupname>  of Branch <branchname>" ;
		self.emit("sendemailnotificationforremovingmember",user,branch,groupdata,emailtemplate)

	}   