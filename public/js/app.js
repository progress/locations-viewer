'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'ngRoute',
  'ngMap',
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'pickadate'
]).
config(function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
});
