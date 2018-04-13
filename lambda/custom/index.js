'use strict';

var Alexa = require('alexa-sdk');
const moment = require('moment');
const AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');
const GisServiceClient = require('./GisServiceClient');
const APP_ID = 'amzn1.ask.skill.84133546-b779-459d-83fb-8ab46f16aa99';
// const ALL_ADDRESS_PERMISSION = "read::alexa:device:all:address";
// const PERMISSIONS = [ALL_ADDRESS_PERMISSION];


exports.handler = function (event, context, callback) {
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
            switch (addressResponse.statusCode) {
                case 200:
                    const address = addressResponse.address;
                    console.log('address from device is ', address);
                    console.log('typeof address from device is ', typeof address.city);
                    if (address.city !== null) {
                        if (address.city.toUpperCase() != "RALEIGH") {
                            console.log('address city is not in Raleigh');
                            return 'address city is not in Raleigh';
                            // this.response.speak('address is not in raleigh');
                            // this.emit(':responseReady');
                        }
                    } else {
                        console.log('address is null and hasnt been setup in Alexa app');
                        fulfill('Sorry I could not find information for your address. Make sure you have entered a valid address in the settings of your Alexa app and that it is within Raleigh city limits');
                        return 'Sorry I could not find information for your address. Make sure you have entered a valid address in the settings of your Alexa app and that it is within Raleigh city limits';
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
                    reject("Sorry I could not find information for your address. Make sure you have entered a valid address in the settings of your Alexa app and that it is within Raleigh city limits");
                    break;
                case 403:
                    console.log("The consent token we had wasn't authorized to access the user's address.");
                    reject("Permission to obtain device address denied. Make you you have enable address permissions in the skill settings");
                    break;
                default:
                    reject("Failed to obtain device address");
            }
        });
    });
}

var handlers = {
    'LaunchRequest': function () {
        // CHF - in order to get the address you have to get deviceId and api token (which is returned in every alexa response)
        this.emitWithState('SayHello');
    },
    'SayHello': function () {
        this.response.speak('Welcome to City of Raleigh on Alexa. You can ask for information such as what is my trash day or is this my recycling week, or who is my council member, or what CAC district am I in')
            .cardRenderer('Welcome to City of Raleigh on Alexa', 'You can ask for information such as what is my trash day or is this my recycling week.');
        this.emit(':responseReady');
        // this.emit('GetDeviceAddress');
    },
    'Menu': function () {
        this.response.speak('You can ask about the following city services, what is my trash day, who is my city council person, is this my recycling week.')
            .cardRenderer('Welcome to City of Raleigh on Alexa', 'You can ask for information such as what is my trash day or is this my recycling week.');
        this.emit(':responseReady');
        // this.emit('GetDeviceAddress');
    },
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
                    err = err;
                    this.emit(":tell", err);
                });
            }).catch(err => {
                console.log("Promise Rejected", err);
                err = err;
                this.emit(":tell", err);
            });
            // if (typeof theword === 'undefined'){
            //     this.response.speak("You haven't setup your address for your alexa device in the alexa app settings, please tell me your address");
            //     this.emitWithState('SayHello');
            // }
        }
    },
    'District': function () {
        var intentObj = this.event.request.intent;
        const consentToken = this.event.context.System.apiAccessToken;
        console.log('consentTOken is ', consentToken);
        console.log('inside District - toLowerCase error', intentObj.slots.districttype.value);
        if (typeof intentObj.slots.districttype.value !== 'undefined') {
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
        // console.log('slot for prompted addres is ', intentObj.slots.promptedAddress.value);

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
                console.log('getAddressFromDevice address = ', address);
                console.log('typeof address', typeof address);
                
                
                let gisServiceRequest = gisServiceClient.getGisData(address);
                gisServiceRequest.then((response) => {
                    console.log('response of recycle week features', response);
                    if (response !== 'Sorry I could not find information for your address. Make sure you have entered a valid address in the settings of your Alexa app and that it is within Raleigh city limits') {
                        // if (response.features.length > 0) {
                            let isOdd = (moment().week() % 2) == 1;
                            if (response === 'B' && isOdd) {
                                this.emit(":tell", 'No this is not your recycling week');
                            }
                            else if (response === 'B' && isOdd == 0) {
                                this.emit(":tell", "Yes this is your recycling week");
                            }
                            else if (response === 'A' && isOdd) {
                                this.emit(":tell", "Yes this is your recycling week");
                            }
                            else if (response === 'A' && isOdd == 0) {
                                this.emit(":tell", "No this is not your recycling week");
                            }
                        // } else {
                        //     console.log('no response came back for recycling week');
                        // }
                    } else {
                        this.response.speak('Sorry I could not find information for your address. Make sure you have entered a valid address in the settings of your Alexa app and that it is within Raleigh city limits');
                        this.emit(':responseReady');
                        // console.log('slot for prompted addres is ', intentObj.slots.promptedAddress.value);

                    }


                }).catch(err => {
                    err = err;
                    this.emit(":tell", err);
                });
            }).catch(err => {
                err = err;
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
        this.response.speak("You can try: 'Ask City of Raleigh what is my trash day', or 'Ask City of Raleigh is it my recycling week', or 'Ask City of Raleigh who is my council person'");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        this.response.speak("Sorry, I didn't get that. You can try: 'Ask City of Raleigh what is my trash day', or 'Ask City of Raleigh is it my recycling week', or 'Ask City of Raleigh who is my council person'");
    }
};