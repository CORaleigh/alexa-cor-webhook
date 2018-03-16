'use strict';

const Https = require('https');
const geocodeUrl = "https://maps.raleighnc.gov";
class GisServiceClient {
    constructor(id, field, speech) {
        this.id = id;
        this.field = field;
        this.speech = speech;
    }

    getGisData(address) {
        let requestOptions = this.__getRequestOptions('/arcgis/rest/services/Locators/CompositeLocator/GeocodeServer/findAddressCandidates?f=json&outSR=4326&SingleLine=' + encodeURIComponent(address)); //{'f': 'json', 'SingleLine': address, 'outSR': 4326};        
        return new Promise((fulfill, reject) => {
            this.__geocodeAddress(requestOptions, fulfill, reject).then(location => {
                if (!location) {
                    reject("Your address was not found");
                }
                this.__getGisAttribute(location, fulfill, reject).then(attribute => {
                    if (!attribute) {
                        reject("I could not find information for your address");
                    }
                    fulfill(this.speech + attribute);
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });

        });
    }

    __geocodeAddress(requestOptions, fulfill, reject) {
        return new Promise((fulfill, reject) => {
            Https.get(requestOptions, function (response) {
                response.on('data', (data) => {

                    let responsePayloadObject = JSON.parse(data);
                    if (responsePayloadObject.candidates.length > 0) {
                        let location = responsePayloadObject.candidates[0].location;
                        fulfill(location);
                    } else {
                        fulfill({
                            found: false,
                            location: null
                        });
                    }
                });
            });
        });
    }
    __getGisAttribute(location, fulfill, reject) {
        return new Promise((fulfill, reject) => {
            let requestOptions = this.__getRequestOptions('/arcgis/rest/services/Services/PortalServices/MapServer/' + this.id + '/query?f=json&geometry=' + JSON.stringify(location) + '&inSR=4326&geometryType=esriGeometryPoint&returnGeometry=false&outFields=' + this.field);
            console.log(requestOptions);
            let field = this.field;
            Https.get(requestOptions, function (response) {
                response.on('data', (data) => {
                    let responsePayloadObject = JSON.parse(data);
                    console.log('response = ', responsePayloadObject);
                        if (responsePayloadObject.features.length > 0) {
                            let attribute = responsePayloadObject.features[0].attributes[field];
                            fulfill(attribute);
                        } else {
                            reject("Sorry I could not find information for your address. Your address does not appear to be inside Raleigh city limits");
                        }
                    
                });
            });
        });
    }
    __getRequestOptions(path) {
        return {
            hostname: 'maps.raleighnc.gov',
            path: path,
            method: 'GET'
        };
    }
}

module.exports = GisServiceClient;