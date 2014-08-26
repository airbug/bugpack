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
