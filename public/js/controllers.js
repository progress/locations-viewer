'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
controller('AppCtrl', function($scope, $http) {
    var isUpdating = true;
    $scope.addresses = [];
    $scope.displayType = 'map';
    var map, date, time;
    var interval = setInterval(update, 120000);

    //This function is called when the user switches to current information.
    $scope.realtime = function() {
        $scope.displayType = 'hidemap';
        isUpdating = true;
        update();
    };

    // This function updates information by calling api.js, which in turn calls Rollbase.
    function update() {
        if (isUpdating) {
            map.markers = [];
            $http.get('/api/getInfo').
            success(function(data) {
                $scope.addresses = [];
                // This is to change the formatting for Google maps
                for (var i = 0; i < data.locationData.length; i++) {
                    $scope.addresses.push(data.locationData[i].replace(/-/g, " "));
                }
                $scope.displayType = 'map';
            });
        }
    };

    // This function queries api.js, which in turn queries Mongo. 
    $scope.oldData = function() {
        console.log($scope);
        var time = $scope.timeInput.input.$viewValue;
        var date = $scope.date;
        if (time.length < 1 || typeof date == 'undefined') {
            return;
        }
        isUpdating = false;
        $scope.displayType = 'hidemap';
        $http.post('/api/getData' + date + ' ' + time).
        success(function(data) {
            console.log(data);
            $scope.addresses = [];
            // This is to change the formatting for Google maps
            for (var i = 0; i < data.locationData.length; i++) {
                $scope.addresses.push(data.locationData[i].replace(/-/g, " "));
            }
            $scope.displayType = 'map';
        });
    };

    $scope.$on('mapsInitialized', function(e, maps) {
        map = maps[0];
        if (isUpdating) {
            update();
        }
    });
});