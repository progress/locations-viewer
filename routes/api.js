/*
 * Serve JSON to our AngularJS client.
 */
//Rollbase setup (though https is used by both Rollbase and Mongo)
var https = require('https');
var password = 'YOUR ROLLBASE PASSWORD';
var username = 'YOUR ROLLBASE USERNAME';
var viewId = 'YOUR ROLLBASE VIEWID';
var sessionId = '';
login();
// This logs back in periodically. Currently it logs in every hour, but the interval can be adjusted.
var interval = setInterval(login, 360000);


//MongoDB setup
var mongoose = require('mongoose');
var modulusUsername = 'YOUR MODULUS USERNAME';
var modulusPassword = 'YOUR MODULUS PASSWORD';
var databaseName = 'YOUR DATABASE NAME';
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
var locations1 = mongoose.model('locations1', locationSchema, 'locations1');

// Function for running queries on the MongoDB
exports.getData = function(req, result) {
    var lowTime = req.params.time.substring(0, 19);
    var highTime = req.params.time.substring(19);
    console.log(lowTime);
    console.log(highTime);
    var query = locations1.find({
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
        console.log(err);
        var locationsData = [];
        for (var i = 0; i < locations.length; i++) {
            if (locationsData.indexOf(locations[i].Location) == -1) {
                locationsData.push(locations[i].Location);
            }
        };
        console.log(locationsData.length);
        result.json({
            'locationData': locationsData.slice(0,10),
            'count': locationsData.length
        });
    });
};


// Function for logging in with credentials. It updates the sessionId token and also calls updateData to update any data. 
function login() {
    var loginOptions = {
        host: 'rollbase.com',
        port: 443,
        // Note this is password not Password like in documentation
        path: '/rest/api/login?&output=json&password=' + password + '&loginName=' + username
    };

    console.info('Options prepared:');
    console.info(loginOptions);
    console.info('Do the Login');
    // do the request
    var loginGet = https.request(loginOptions, function(res) {
        console.log("statusCode: ", res.statusCode);
        var data = '';

        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            console.info('Login result:');
            console.log(data);
            var obj = JSON.parse(data);
            if (obj.status == 'ok') {
                console.log(obj.sessionId);
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

//Function for returning the most recent information from Rollbase. 
exports.getInfo = function(req, result) {
    var getOptions = {
        host: 'rollbase.com',
        port: 443,
        // My viewId for the posts view was found at Application Setup > Objects > Post > All Posts
        path: '/rest/api/getPage?&output=json&sessionId=' + sessionId + '&viewId=' + viewId
    };
    // do the request
    var getInfo = https.request(getOptions, function(res) {
        console.log("statusCode: ", res.statusCode);
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
                    if (locations.indexOf(obj[i].Location) == -1) {
                        locations.push(obj[i].Location);
                    }
                }
                console.log(locations);
                result.json({
                    'locationData': locations
                });
            } else {
                // Will try logging in again and returning results if it fails
                var loginOptions = {
                    host: 'rollbase.com',
                    port: 443,
                    // Note this is password not Password like in documentation
                    path: '/rest/api/login?&output=json&password=' + password + '&loginName=' + username
                };

                console.info('Options prepared:');
                console.info(loginOptions);
                console.info('Do the Login');
                // do the request
                var loginGet = https.request(loginOptions, function(res1) {
                    console.log("statusCode: ", res1.statusCode);
                    var data1 = '';

                    res1.on('data', function(d) {
                        data1 += d;
                    });
                    res1.on('end', function() {
                        console.info('Login result:');
                        console.log(data1);
                        var obj1 = JSON.parse(data1);
                        if (obj1.status == 'ok') {
                            console.log(obj1.sessionId);
                            sessionId = obj1.sessionId;
                            var get2Options = {
                                host: 'rollbase.com',
                                port: 443,
                                // My viewId for the posts view was found at Application Setup > Objects > Post > All Posts
                                path: '/rest/api/get2Page?&output=json&sessionId=' + sessionId + '&viewId=' + viewId
                            };
                            // do the request
                            var get2Info = https.request(get2Options, function(res2) {
                                console.log("statusCode: ", res2.statusCode);
                                var data2 = '';
                                res2.on('data', function(d) {
                                    data2 += d;
                                });
                                res2.on('end', function() {
                                    // < 400 means request probably succeeded 
                                    if (res2.statusCode < 400) {
                                        var obj2 = JSON.parse(data2);
                                        var locations = [];
                                        for (var i = 0; i < obj2.length; i++) {
                                            if (locations.indexOf(obj2[i].Location) == -1) {
                                                locations.push(obj2[i].Location);
                                            }
                                        }
                                        console.log(locations);
                                        result.json({
                                            'locationData': locations
                                        });
                                    } else {
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