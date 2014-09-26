/*
 * Serve JSON to our AngularJS client.
 */
//Rollbase setup (though https is used by both Rollbase and Mongo)
var https = require('https');
var password = 'YOUR ROLLBASE PASSWORD';
var username = 'YOUR ROLLBASE USERNAME';
var viewId = 'YOUR ROLLBASE VIEWID';
var viewId2 = 'YOUR SECOND ROLLBASE VIEWID';
var objectIntegrationName = 'YOUR OBJECT INTEGRATION NAME';
var objectIntegrationName2 = 'YOUR SECOND OBJECT INTEGRATION NAME';
var sessionId = '';

login();
// This logs back in periodically. Currently it logs in every hour, but the interval can be adjusted.
var interval = setInterval(login, 360000);

//MongoDB setup
var mongoose = require('mongoose');
var modulusUsername = 'YOUR MODULUS USERNAME';
var modulusPassword = 'YOUR MODULUS PASSWORD';
var databaseName = 'YOUR DATABASE NAME';
var collectionName = 'YOUR COLLECTION NAME';

mongoose.connect(
    'mongodb://' + modulusUsername + ':' + modulusPassword + '@proximus.modulusmongo.net:27017/' + databaseName
);
var Schema = mongoose.Schema;
var db = mongoose.connection;
var locationSchema = mongoose.Schema({
    DriverID: Number,
    EventCode: Number,
    GPSUnitIP: Number,
    Heading: Number,
    IDofLastReading: Number,
    LatLng: String,
    Location: String,
    LocationID: Number,
    Mileage: Number,
    ReadingTime: String,
    Speed: Number,
    Street: String,
    VehicleId: Number,
    _id: Schema.Types.ObjectId,
    id: String,
    processed: Number,
    townid: Number
});
var locationModel = mongoose.model(collectionName, locationSchema, collectionName);

// Function for running queries on the MongoDB
exports.getData = function(req, result) {
    var lowTime = req.params.time.substring(0, 19);
    var highTime = req.params.time.substring(19);
    var query = locationModel.find({
        'ReadingTime': {
            $gte: lowTime,
            $lte: highTime
        }
    });
    query.select('Location');
    query.limit(30);
    query.sort({
        'ReadingTime': 1
    });
    query.exec(function(err, locations) {
        var locationsData = [];
        // Screens out duplicates
        for (var i = 0; i < locations.length; i++) {
            if (locationsData.indexOf(locations[i].Location) == -1) {
                locationsData.push(locations[i].Location);
            }
        };
        // Limits result to at most 10 locations
        result.json({
            'locationData': locationsData.slice(0, 10),
            'count': locationsData.length
        });
    });
};

// Function for logging into Rollbase with credentials. It updates the sessionId token and also calls updateData to update any data. 
function login() {
    var loginOptions = {
        host: 'rollbase.com',
        port: 443,
        // Note this is password not Password like in documentation
        path: '/rest/api/login?&output=json&password=' + password + '&loginName=' + username
    };
    // do the request
    var loginGet = https.request(loginOptions, function(res) {
        var data = '';
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            var obj = JSON.parse(data);
            if (obj.status == 'ok') {
                sessionId = obj.sessionId;
            } else {
                console.log(obj.message);
            }
        })
    });
    loginGet.end();
    loginGet.on('error', function(e) {
        console.error(e);
    });
}

// Function for adding a new user into Rollbase
exports.addUser = function(req, result) {
    var data = req.params.data.split('.*.');
    var createOptions = {
        host: 'rollbase.com',
        port: 443,
        // Note this is objName not objDefName like in documentation
        // encodeURIComponent allows strings with spaces and other characters not supported by urls to be included in api calls
        path: '/rest/api/createRecord?objName=' + objectIntegrationName + '&useIds=true&email=' + data[0] + '&state=CO&city=' + encodeURIComponent(data[2]) + '&output=json&sessionId=' + sessionId + '&streetAddr1=' + encodeURIComponent(data[1]) + '&zip=' + data[3] + '&name=' + data[0]
    };
    // do the request
    var createGet = https.request(createOptions, function(res) {
        console.log("statusCode: ", res.statusCode);
        var data = '';
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            // < 400 means request probably succeeded 
            if (res.statusCode < 400) {
                result.json(true);
            } else {
                console.log('Creation failed');
                console.log(data);
                result.end();
            }
        })
    });
    createGet.end();
    createGet.on('error', function(e) {
        console.error(e);
    });
};

// Function for adding a new user into Rollbase
exports.addTree = function(req, result) {
    var createOptions = {
        host: 'rollbase.com',
        port: 443,
        // Note this is objName not objDefName like in documentation
        // encodeURIComponent allows strings with spaces and other characters not supported by urls to be included in api calls
        path: '/rest/api/createRecord?objName=' + objectIntegrationName2 + '&useIds=true&Location=' + encodeURIComponent(req.params.data) + '&output=json&sessionId=' + sessionId
    };
    // do the request
    var createGet = https.request(createOptions, function(res) {
        console.log("statusCode: ", res.statusCode);
        var data = '';
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            // < 400 means request probably succeeded 
            if (res.statusCode < 400) {
                result.json(true);
            } else {
                console.log('Creation failed');
                console.log(data);
                result.end();
            }
        })
    });
    createGet.end();
    createGet.on('error', function(e) {
        console.error(e);
    });
};

// This runs a sqlQuery when given a zip code to get emails in that zip code.
exports.getEmails = function(req, result) {
    // encodeURIComponent allows strings with spaces and other characters not supported by urls to be included in api calls
    var sqlQuery = encodeURIComponent('SELECT email, uuid FROM ' + objectIntegrationName + ' WHERE zip =' + req.params.data);
    var emailOptions = {
        host: 'rollbase.com',
        port: 443,
        path: '/rest/api/selectQuery?&sessionId=' + sessionId + '&maxRows=25&output=json&query=' + sqlQuery
    };
    // do the request
    var emailsGet = https.request(emailOptions, function(res) {
        var data = '';
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            // < 400 means request probably succeeded 
            if (res.statusCode < 400) {
                var obj = JSON.parse(data);
                var emails = [];
                var uuids = [];
                for (var i = 0; i < obj.length; i++) {
                    emails.push(obj[i][0]);
                    if (obj[i][1]) {
                        uuids.push(obj[i][1]);
                    }
                };
                result.json({
                    'emails': emails,
                    'uuids': uuids
                });
            } else {
                console.log('Query failed');
                console.log(data);
                result.json(false);
            }
        })
    });
    emailsGet.end();
    emailsGet.on('error', function(e) {
        console.error(e);
    });
}

// Function for returning the most recent information from Rollbase. If the query fails, it logs in and tries again. 
// If you don't want to log in again, you can instead use the shorter commented out code at the end.
exports.getInfo = function(req, result) {
    var getOptions = {
        host: 'rollbase.com',
        port: 443,
        path: '/rest/api/getPage?&output=json&sessionId=' + sessionId + '&viewId=' + viewId
    };
    // do the request
    var getInfo = https.request(getOptions, function(res) {
        var data = '';
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            // < 400 means request probably succeeded 
            if (res.statusCode < 400) {
                var obj = JSON.parse(data);
                var locations = [];
                for (var i = 0; i < obj.length; i++) {
                    // Screens out duplicates
                    if (locations.indexOf(obj[i].Location) == -1) {
                        locations.push(obj[i].Location);
                    }
                }
                result.json({
                    'locationData': locations
                });
            } else {
                // Will try logging in again and returning results if it fails
                var loginOptions = {
                    host: 'rollbase.com',
                    port: 443,
                    path: '/rest/api/login?&output=json&password=' + password + '&loginName=' + username
                };
                var loginGet = https.request(loginOptions, function(res1) {
                    var data1 = '';
                    res1.on('data', function(d) {
                        data1 += d;
                    });
                    res1.on('end', function() {
                        var obj1 = JSON.parse(data1);
                        if (obj1.status == 'ok') {
                            sessionId = obj1.sessionId;
                            var get2Options = {
                                host: 'rollbase.com',
                                port: 443,
                                path: '/rest/api/getPage?&output=json&sessionId=' + sessionId + '&viewId=' + viewId
                            };
                            var get2Info = https.request(get2Options, function(res2) {
                                var data2 = '';
                                res2.on('data', function(d) {
                                    data2 += d;
                                });
                                res2.on('end', function() {
                                    if (res2.statusCode < 400) {
                                        var obj2 = JSON.parse(data2);
                                        var locations = [];
                                        for (var i = 0; i < obj2.length; i++) {
                                            if (locations.indexOf(obj2[i].Location) == -1) {
                                                locations.push(obj2[i].Location);
                                            }
                                        }
                                        result.json({
                                            'locationData': locations
                                        });
                                    } else {
                                        console.log(obj2);
                                        result.json({
                                            'locationData': []
                                        });
                                    }
                                })
                            });
                            get2Info.end();
                            get2Info.on('error', function(e) {
                                console.error(e);
                            });
                        } else {
                            console.log(obj1.message);
                            result.json({
                                'locationData': []
                            });
                        }
                    })
                });
                loginGet.end();
                loginGet.on('error', function(e) {
                    console.error(e);
                });
            }
        })
    });
    getInfo.end();
    getInfo.on('error', function(e) {
        console.error(e);
    });
}
exports.inform = function(req, result) {
    //req.body is the list of uuids
    console.log(req.body);
}
exports.getTreeInfo = function(req, result) {
    console.log('called');
    var getOptions = {
        host: 'rollbase.com',
        port: 443,
        path: '/rest/api/getPage?&output=json&sessionId=' + sessionId + '&viewId=' + viewId2
    };
    var getInfo = https.request(getOptions, function(res) {
        console.log("statusCode: ", res.statusCode);
        var data = '';
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            if (res.statusCode < 400) {
                var obj = JSON.parse(data);
                var locations = [];
                for (var i = 0; i < obj.length; i++) {
                    if (locations.indexOf(obj[i].Location) == -1) {
                        locations.push(obj[i].Location);
                    }
                }
                result.json({
                    'locationData': locations
                });
            } else {
                console.log(data);
                result.json({
                    'locationData': []
                });
            }
        })
    });
    getInfo.end();
    getInfo.on('error', function(e) {
        console.error(e);
    });
}