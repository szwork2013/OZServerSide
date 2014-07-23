
var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	app.post('/api/branch/group/:providerid/:branchid',auth,api.providergroupapi.addGroupToBranch)
 	app.delete('/api/branch/group/:branchid/:groupid',auth,api.providergroupapi.removeGroupFromBranch);
 	app.post('/api/branch/groupmember/:branchid/:groupid',auth,api.providergroupapi.addMembersToGroup)
 	app.get('/api/branch/group/:providerid/:branchid',auth,api.providergroupapi.getMyGroupMembers)
 	app.delete("/api/branch/groupmember/:branchid/:groupid/:memberid",auth,api.providergroupapi.removeMemberFromGroup)
 	app.put('/api/branch/group/:providerid/:branchid/:groupid',auth,api.providergroupapi.updateGroupBranch)
}	
