angular.module('myApp', ['ui.router'])
  .provider('Weather', function() {
    var apiKey = '';

    this.setApiKey = function(key) {
      if (key) { this.apiKey = key; }
    };

    this.getUrl = function(type, ext) {
      return "http://api.wunderground.com/api/" + this.apiKey + "/" + type + "/q/" + ext + '.json';
    };

    // this.$get = function($http) {
    //   return {
    //     // Service object
    //   }
    // };

    // Returning our own promises that we can resolve in the view
    this.$get = function($q, $http) {
      var self = this;
      return {
        getWeatherForecast: function(city) {
          var d = $q.defer();
          $http({
            method: 'GET',
            url: self.getUrl("forecast", city),
            cache: true
          })
            .success(function(data) {
              // The wunderground API returns the
              // object that nests the forecasts inside
              // the forecast.simpleforecast key
              d.resolve(data.forecast.simpleforecast);
            })
            .error(function(err) {
              d.reject(err);
            });
          return d.promise;
        },
        getCityDetails: function(query) {
          var d = $q.defer(),
            url = 'http://autocomplete.wunderground.com/aq?query=' + query;

          $http.get(url)
            .success(function(data) {
              d.resolve(data.RESULTS);
            })
            .error(function(err) {
              d.reject(err);
            });

          return d.promise;
        }
      } 
    };
  })
  // WeatherProvider is automatically created when doing .provider('Weather')
  .config(function(WeatherProvider) {
    WeatherProvider.setApiKey('743d9e791c6ab72c');
  })
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'templates/home.html',
        controller: 'MainController'
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController'
      });
  })
  .controller('MainController', function($scope, $timeout, Weather, UserService) {
    // Build the date object
    $scope.date = {};

    // Update function
    var updateTime = function() {
      $scope.date.raw = new Date();
      $timeout(updateTime, 1000);
    }

    // Kick off the update function
    updateTime();

    $scope.user = UserService.user;
    $scope.weather = {};
    // Hardcode San_Francisco for now
    Weather.getWeatherForecast($scope.user.location)
      .then(function(data) {
        $scope.weather.forecast = data;
      });
  })
  .controller('SettingsController', function($scope, UserService, Weather) {
    $scope.user = UserService.user;

    $scope.save = function() {
      UserService.save();
    }

    $scope.fetchCities = Weather.getCityDetails;
  })
  .factory('UserService', function() {
    var defaults = {
      location: 'autoip'
    },
      service = {
        user: {},
        save: function() {
          sessionStorage.presently = angular.toJson(service.user);
        },
        restore: function() {
          // Pull from sessionStorage
          service.user = angular.fromJson(sessionStorage.presently) || defaults;
          return service.user;
        }
      };

    // Immediately call restore so we have the user data
    service.restore();
    return service;
  });
