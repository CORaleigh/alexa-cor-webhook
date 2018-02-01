'use strict';

var Alexa = require('alexa-sdk');
const moment = require('moment');
const AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');
const GisServiceClient = require('./GisServiceClient');
// const APP_ID = 'amzn1.ask.skill.036e0aaf-ba07-4e8b-953e-fcc5a1d6a546';
// const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";
// const PERMISSIONS = [ALL_ADDRESS_PERMISSION];


exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    // alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const getAddressFromDevice = function (consentToken, deviceId, apiEndpoint) {
    return new Promise((fulfill, reject) => {
        const alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
        let deviceAddressRequest = alexaDeviceAddressClient.getFullAddress();
        deviceAddressRequest.then((addressResponse) => {
            switch (addressResponse.statusCode) {
                case 200:
                    const address = addressResponse.address;
                    console.log('address from device is ', address);
                    if (address.city != "RALEIGH") {
                        console.log('address city is not in Raleigh');
                        // this.response.speak('address is not in raleigh');
                        // this.emit(':responseReady');
                    }
                    // fulfill(address['addressLine1']);
                    fulfill(address.addressLine1);
                    return address.addressLine1;
                    // this.response.speak('address is in raleigh ', address.addressLine1);
                    // this.emit(':responseReady');
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
        const consentToken = this.event.context.System.apiAccessToken;
        console.log('consentTOken is ', consentToken);

        console.log('wastetype is ', intentObj.slots.wastetype.value);
        let gisServiceClient = new GisServiceClient(12, 'DAY', 'Your ' + intentObj.slots.wastetype.value + ' day is ');
        if (typeof this.event.context === 'undefined') {
            let gisServiceRequest = gisServiceClient.getGisData("1234 Brooks Ave");
            gisServiceRequest.then((response) => {
                this.emit(":tell", response);
            }).catch(function () {
                console.log("Promise Rejected", response);
            });
        } else {
            // const consentToken = this.event.context.System.user.permissions.consentToken;

            if (!consentToken) {
                this.emit(":tell", "you didnt give me permission");
            }
            const deviceId = this.event.context.System.device.deviceId;
            const apiEndpoint = this.event.context.System.apiEndpoint;


            let theword = getAddressFromDevice(consentToken, deviceId, apiEndpoint).then(address => {
                let gisServiceRequest = gisServiceClient.getGisData(address);

                gisServiceRequest.then((response) => {
                    this.emit(":tell", response);
                }).catch(err => {
                    console.log("Promise Rejected", err);
                    err = err + " response error";
                    this.emit(":tell", err);
                });
            }).catch(err => {
                console.log("Promise Rejected", err);
                err = err + " response error two";
                this.emit(":tell", err);
            });
        }
    },
    'District': function () {
        var intentObj = this.event.request.intent;
        const consentToken = this.event.context.System.apiAccessToken;
        console.log('consentTOken is ', consentToken);

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
            // const consentToken = this.event.context.System.user.permissions.consentToken;
            // const consentToken = this.event.context.System.apiAccessToken;
            if (!consentToken) {
                this.emit(":tell", "you didnt give me permission");
            }
            const deviceId = this.event.context.System.device.deviceId;
            const apiEndpoint = this.event.context.System.apiEndpoint;
            getAddressFromDevice(consentToken, deviceId, apiEndpoint).then(address => {
                let gisServiceRequest = gisServiceClient.getGisData(address);
                gisServiceRequest.then((response) => {
                    this.emit(":tell", response);
                }).catch(err => {
                    err = err + "error one";
                    this.emit(":tell", err);
                });
            }).catch(err => {
                err = err + "error two";

                this.emit(":tell", err);
            });
        }
    },
    'Person': function () {
        var intentObj = this.event.request.intent;
        const consentToken = this.event.context.System.apiAccessToken;
        console.log('consentTOken is ', consentToken);
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
            // const consentToken = this.event.context.System.user.permissions.consentToken;
            // const consentToken = this.event.context.System.apiAccessToken;
            if (!consentToken) {
                this.emit(":tell", "you didnt give me permission");
            }
            const deviceId = this.event.context.System.device.deviceId;
            const apiEndpoint = this.event.context.System.apiEndpoint;
            getAddressFromDevice(consentToken, deviceId, apiEndpoint).then(address => {
                let gisServiceRequest = gisServiceClient.getGisData(address);
                gisServiceRequest.then((response) => {
                    this.emit(":tell", response);
                }).catch(err => {
                    err = err + "person error";
                    this.emit(":tell", err);
                });
            }).catch(err => {
                err = err + "person error one";

                this.emit(":tell", err);
            });
        }
    },
    'Recycling': function () {
        var intentObj = this.event.request.intent;
        const consentToken = this.event.context.System.apiAccessToken;
        console.log('consentTOken is ', consentToken);
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
            // const consentToken = this.event.context.System.user.permissions.consentToken;
            // const consentToken = this.event.context.System.apiAccessToken;
            if (!consentToken) {
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
                    err = err + "some error";
                    this.emit(":tell", err);
                });
            }).catch(err => {
                err = err + "some error one two";

                this.emit(":tell", err);
            });
        }
    },
    'SessionEndedRequest': function () {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        this.response.speak("You can try: 'alexa, hello world' or 'alexa, ask hello world my" +
            " name is awesome Aaron'");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        this.response.speak("Sorry, I didn't get that. You can try: 'alexa, hello world'" +
            " or 'alexa, ask hello world my name is awesome Aaron'");
    }
};