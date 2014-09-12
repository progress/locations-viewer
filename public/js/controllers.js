'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
controller('AppCtrl', function($scope, $http) {
    $scope.isUpdating = true;
    $scope.addresses = [];
    $scope.displayType = 'map';
    $scope.error = 'noerror';
    var map, date, time;
    var interval = setInterval(update, 120000);

    //This function is called when the user switches to current information.
    $scope.realtime = function() {
        $scope.error = 'noerror';
        $scope.displayType = 'hidemap';
        $scope.isUpdating = true;
        update();
    };

    // This function updates information by calling api.js, which in turn calls Rollbase.
    function update() {
        if ($scope.isUpdating) {
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
        $scope.error = 'noerror';
        var time = $scope.timeInput.input.$viewValue;
        var time2 = $scope.timeInput2.input2.$viewValue;
        var date = $scope.date;
        var date2 = $scope.date2;
        if (time.length < 1 || time2.length < 1 || typeof date == 'undefined' ||  typeof date2 == 'undefined') {
            $scope.error = 'incomplete';
            return;
        }
        $scope.isUpdating = false;
        $scope.displayType = 'hidemap';
        $http.post('/api/getData' + date + ' ' + time + ':00' + date2 + ' ' + time2 + ':59').
        success(function(data) {
            console.log(data);
            $scope.addresses = [];
            // This is to change the formatting for Google maps
            for (var i = 0; i < data.locationData.length; i++) {
                $scope.addresses.push('position=' + data.locationData[i].replace(/-/g, " "));
            }
            $scope.start = $scope.addresses[0];
            $scope.end = $scope.addresses[$scope.addresses.length - 1];
            if(data.count == 0) {
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