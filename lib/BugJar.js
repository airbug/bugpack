//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugJar = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

BugJar.jars = {};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

BugJar.export = function(jarName, jar) {
    BugPackage.jars[jarName] = jar;
};

BugJar.hasJar = function(jarName) {
    return Object.prototype.hasOwnProperty.call(BugJar.jars, jarName);
};

BugJar.require = function(jarName) {
    if (BugJar.hasJar(jarName)) {
        return BugJar.jars[jarName];
    } else {
        throw new Error("Unknown bug jar '" + jarName + "'");
    }
};
