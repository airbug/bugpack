/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


var require = (function() {
    var modules     = {};
    var oldRequire  = require || undefined;
    var require     = function(requireName) {
        if (modules[requireName]) {
            return modules[requireName];
        } else if (oldRequire !== undefined) {
            return oldRequire(requireName);
        } else {
            throw new Error("unknown require name '" + requireName + "'");
        }
    };
    require.modules = modules;
    return require;
})();
var module = null;
