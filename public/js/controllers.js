'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
controller('AppCtrl', function($scope, $http, $timeout) {
    var uuids;
    $scope.showEmails = 'hide';
    $scope.isUpdating = true;
    $scope.addresses = [];
    $scope.displayType = 'map';
    $scope.error = 'noerror';
    $scope.types = [{
        option: 'Snowplow & Tree Locations'
    }, {
        option: 'Add Affected User'
    }, {
        option: 'Add Fallen Tree'
    }];
    $scope.type = $scope.types[0];
    var map;
    var interval = setInterval(update, 5000);

    // Clears errors and updates necessary information when updating
    $scope.$watch('type', function() {
        $scope.error = 'noerror';
    });

    // This function is called when the user switches to current information.
    $scope.realtime = function() {
        $scope.showEmails = 'hide';
        $scope.error = 'noerror';
        $scope.displayType = 'hidemap';
        if (!$scope.isUpdating) {
            $scope.isUpdating = true;
            update();
        } else {
            $scope.displayType = 'map';
        }
    };

    // This function is called when a marker is clicked
    $scope.markerClicked = function(address) {
        $scope.showEmails = 'hide';
        var lat = address.latLng.k;
        var lng = address.latLng.B;
        var latlng = new google.maps.LatLng(lat, lng);
        var geocoder = new google.maps.Geocoder();
        // Code for getting zip code and passing it to api
        geocoder.geocode({
            'latLng': latlng
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    for (var j = 0; j < results[0].address_components.length; j++) {
                        if (results[0].address_components[j].types[0] == 'postal_code') {
                            var zip = results[0].address_components[j].short_name;
                            $http.post('/api/getEmails' + zip).
                            success(function(data) {
                                $scope.showEmails = 'show';
                                $scope.emails = data.emails;
                                uuids = data.uuids;
                            });
                        }
                    }
                }
            }
        });
    }

    $scope.inform = function() {
        $http.post('/api/inform', uuids);
    }

    // This adds a user
    $scope.addUser = function() {
        $scope.showEmails = 'hide';
        $scope.error = 'noerror';
        var info = $scope.$$childTail;
        var userInfo = {};
        //This was an easy way to pass information between the frontend and backend after switching from Express 2 to 4.
        $http.post('/api/addUser' + info.email + '.*.' + info.address + '.*.' + info.city + '.*.' + info.zip).
        success(function(data) {
            if (data) {
                $scope.type = $scope.types[0];
            } else {
                $scope.error = 'nosave';
            }
        });
    };

    // This adds a fallen tree
    $scope.addTree = function() {
        $scope.showEmails = 'hide';
        $scope.error = 'noerror';
        var info = $scope.$$childTail;
        var userInfo = {};
        //This was an easy way to pass information between the frontend and backend after switching from Express 2 to 4.
        $http.post('/api/addTree' + info.address2 + ', ' + info.city2 + ', CO ' + info.zip2).
        success(function(data) {
            if (data) {
                $scope.type = $scope.types[0];
            } else {
                $scope.error = 'nosave';
            }
        });
    };

    // This function updates information by calling api.js, which in turn calls Rollbase.
    function update() {
        if ($scope.isUpdating) {
            map.markers = [];
            $scope.addresses = [];
            $scope.addresses2 = [];
            var addresses = [];
            var addresses2 = [];
            $http.get('/api/getInfo').
            success(function(data) {
                $http.get('/api/getTreeInfo').
                success(function(data2) {
                    // This is to change the formatting for Google maps
                    for (var i = 0; i < data2.locationData.length; i++) {
                        addresses2.push(data2.locationData[i].replace(/-/g, " "));
                        if (i == 2) break;
                    }
                    // This is to change the formatting for Google maps
                    for (var i = 0; i < data.locationData.length; i++) {
                        if (addresses2.indexOf(data.locationData[i].replace(/-/g, " ")) == -1)
                            addresses.push(data.locationData[i].replace(/-/g, " "));
                        if (i == 5) break;
                    }
                    $scope.addresses = addresses;
                    $scope.addresses2 = addresses2;
                    console.log(addresses2);
                    console.log(addresses);
                    $scope.displayType = 'map';
                });
            });
        }
    };

    // This function queries api.js, which in turn queries Mongo for events in an interval.
    $scope.oldData = function() {
        $scope.showEmails = 'hide';
        $scope.error = 'noerror';
        var info = $scope.$$childTail;
        var time = info.timeInput.input.$viewValue;
        var time2 = info.timeInput2.input2.$viewValue;
        var date = info.date;
        var date2 = info.date2;
        if (time.length < 1 || time2.length < 1 || typeof date == 'undefined' || typeof date2 == 'undefined') {
            $scope.error = 'incomplete';
            return;
        }
        $scope.isUpdating = false;
        $scope.displayType = 'hidemap';
        $http.post('/api/getData' + date + ' ' + time + ':00' + date2 + ' ' + time2 + ':59').
        success(function(data) {
            $scope.addresses = [];
            $scope.addresses2 = [];
            // This is to change the formatting for Google maps
            for (var i = 0; i < data.locationData.length; i++) {
                $scope.addresses.push(data.locationData[i].replace(/-/g, " "));
            }
            $scope.start = $scope.addresses[0];
            $scope.end = $scope.addresses[$scope.addresses.length - 1];
            // This sets errors if there are a lot of results or no results.
            if (data.count == 0) {
                $scope.error = 'toofew';
            } else if (data.count > 10) {
                $scope.error = 'toomany';
            }
            $scope.displayType = 'map';
        });
    };

    $scope.$on('mapsInitialized', function(e, maps) {
        map = maps[0];
        if ($scope.isUpdating) {
            update();
        }
    });
});