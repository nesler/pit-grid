window.pitControls = {};

// Declare app level module which depends on filters, and services
var pitServices = angular.module('pitControls.services', []);
var pitDirectives = angular.module('pitControls.directives', []);
var pitFilters = angular.module('pitControls.filters', []);
// initialization of services into the main module
angular.module('pitControls', ['pitControls.services', 'pitControls.directives', 'pitControls.filters']);