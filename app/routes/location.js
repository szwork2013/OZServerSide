var api = require("../api/api.js");
var auth=require('../common/js/security');

exports.init = function (app) {
	// console.log("api call");
	// app.post('/api/location',auth,api.locationapi.manageLocations);
	app.post('/api/location',auth,api.locationapi.addLocation);
	app.put('/api/location',auth,api.locationapi.updateLocation);
	app.get('/api/location',api.locationapi.getLocationDetails);
	app.get('/api/location/area',auth,api.locationapi.getAllAreasByCity);
 }