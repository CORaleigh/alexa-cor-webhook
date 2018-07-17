'use strict';

var Alexa = require('alexa-sdk');
const moment = require('moment');
const AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');
const GisServiceClient = require('./GisServiceClient');
const APP_ID = 'amzn1.ask.skill.036e0aaf-ba07-4e8b-953e-fcc5a1d6a546';
const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";
const PERMISSIONS = [ALL_ADDRESS_PERMISSION];


exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const getAddressFromDevice = function (consentToken, deviceId, apiEndpoint) {
    return new Promise((fulfill, reject) => { 
        const alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
        let deviceAddressRequest = alexaDeviceAddressClient.getFullAddress();
        deviceAddressRequest.then((addressResponse) => {
            switch(addressResponse.statusCode) {
                case 200:
                    const address = addressResponse.address;
                    if (address['city']!= "Raleigh") {
                        this.emit(":tell", "Your device is not in Raleigh");
                    }
                    fulfill(address['addressLine1']);
                    break;
                case 204:
                    // This likely means that the user didn't have their address set via the companion app.
                    console.log("Successfully requested from the device address API, but no address was returned.");
                    reject("No address was returned from your device");
                    break;
                case 403:
                    console.log("The consent token we had wasn't authorized to access the user's address.");
                    reject("Permission to obtain device address denied");
                    break;
                default:
                    reject("Failed to obtain device address");
            }
        });
    });
}

var handlers = {
    'SolidWaste': function () {
        var intentObj = this.event.request.intent;
        console.log(intentObj.slots.wastetype.value);
        let gisServiceClient = new GisServiceClient(12, 'DAY', 'Your ' + intentObj.slots.wastetype.value + ' day is ');
        if (typeof this.event.context === 'undefined') {
            let gisServiceRequest = gisServiceClient.getGisData("1234 Brooks Ave");
            gisServiceRequest.then((response) => {
                this.emit(":tell", response);
            });
        } else {
            const consentToken = this.event.context.System.user.permissions.consentToken;
            if(!consentToken) { 
                this.emit(":tell", "you didnt give me permission");
            }
            const deviceId = this.event.context.System.device.deviceId;
            const apiEndpoint = this.event.context.System.apiEndpoint;


            getAddressFromDevice(consentToken, deviceId, apiEndpoint).then(address => {
                let gisServiceRequest = gisServiceClient.getGisData(address);
                
                gisServiceRequest.then((response) => {
                    this.emit(":tell", response);
                }).catch(err => {
                    this.emit(":tell", err);
                });                                
            }).catch(err => {
                this.emit(":tell", err);
            });
        }
    },
    'District': function () {
        var intentObj = this.event.request.intent;
        let slot = intentObj.slots.districttype.value.toLowerCase();
        let id = null;
        let field = null;
        if (slot === 'cac' || slot === 'citizen advisory council') {
            id = 1;
            field = 'NAME';
        } else if (slot === 'council' || slot === 'city council') {
            id = 2;
            field = 'COUNCIL_DIST';
        } else if (slot === 'police') {
            id = 3;
            field = 'DISTRICT';
        }
        let gisServiceClient = new GisServiceClient(id, field, 'Your ' + slot + ' district is ');
        if (typeof this.event.context === 'undefined') {
            let gisServiceRequest = gisServiceClient.getGisData("1234 Brooks Ave");
            gisServiceRequest.then((response) => {
                this.emit(":tell", response);
            });
        } else {
            const consentToken = this.event.context.System.user.permissions.consentToken;
            if(!consentToken) { 
                this.emit(":tell", "you didnt give me permission");
            }
            const deviceId = this.event.context.System.device.deviceId;
            const apiEndpoint = this.event.context.System.apiEndpoint;
            getAddressFromDevice(consentToken, deviceId, apiEndpoint).then(address => {
                let gisServiceRequest = gisServiceClient.getGisData(address);
                gisServiceRequest.then((response) => {
                    this.emit(":tell", response);
                }).catch(err => {
                    this.emit(":tell", err);
                });                                
            }).catch(err => {
                this.emit(":tell", err);
            });
        }
    },
    'Person': function () {
        var intentObj = this.event.request.intent;
        //let slot = intentObj.slots.districttype.value.toLowerCase();
        let id = 2;
        let field = 'COUNCIL_PERSON';
        let gisServiceClient = new GisServiceClient(id, field, 'Your city council person is ');
        if (typeof this.event.context === 'undefined') {
            let gisServiceRequest = gisServiceClient.getGisData("1234 Brooks Ave");
            gisServiceRequest.then((response) => {
                this.emit(":tell", response);
            });
        } else {
            const consentToken = this.event.context.System.user.permissions.consentToken;
            if(!consentToken) { 
                this.emit(":tell", "you didnt give me permission");
            }
            const deviceId = this.event.context.System.device.deviceId;
            const apiEndpoint = this.event.context.System.apiEndpoint;
            getAddressFromDevice(consentToken, deviceId, apiEndpoint).then(address => {
                let gisServiceRequest = gisServiceClient.getGisData(address);
                gisServiceRequest.then((response) => {
                    this.emit(":tell", response);
                }).catch(err => {
                    this.emit(":tell", err);
                });                                
            }).catch(err => {
                this.emit(":tell", err);
            });
        }
    },
    'Recycling': function () {
        var intentObj = this.event.request.intent;
        
        //let slot = intentObj.slots.districttype.value.toLowerCase();
        let id = 12;
        let field = 'WEEK';
        let gisServiceClient = new GisServiceClient(id, field, '');
        if (typeof this.event.context === 'undefined') {
            let gisServiceRequest = gisServiceClient.getGisData("1234 Brooks Ave");
            gisServiceRequest.then((response) => {
                let isOdd = (moment().week() % 2) == 1;
                if (response === 'B' && isOdd) {
                    this.emit(":tell", 'No this is not your recycling week');
                } 
                this.emit(":tell", "Yes this is your recycing week");
            });
        } else {
            const consentToken = this.event.context.System.user.permissions.consentToken;
            if(!consentToken) { 
                this.emit(":tell", "you didnt give me permission");
            }
            const deviceId = this.event.context.System.device.deviceId;
            const apiEndpoint = this.event.context.System.apiEndpoint;
            getAddressFromDevice(consentToken, deviceId, apiEndpoint).then(address => {
                let gisServiceRequest = gisServiceClient.getGisData(address);
                gisServiceRequest.then((response) => {
                    let isOdd = (moment().week() % 2) == 1;
                    if (response === 'B' && isOdd) {
                        this.emit(":tell", 'No this is not your recycling week');
                    } 
                    this.emit(":tell", "Yes this is your recycling week");
                }).catch(err => {
                    this.emit(":tell", err);
                });                                
            }).catch(err => {
                this.emit(":tell", err);
            });
        }
    }          
};