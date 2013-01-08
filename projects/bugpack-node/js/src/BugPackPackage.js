//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackPackage = function(name) {

    /**
     * @private
     * @type {Object}
     */
    this.exports = {};

    /**
     * @private
     * @type {string}
     */
    this.name = name;
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {string}
 */
BugPackPackage.prototype.getName = function() {
    return this.name;
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} exportName
 * @param {*} bugPackExport
 */
BugPackPackage.prototype.export = function(exportName, bugPackExport) {
    if (!this.hasExport(exportName)) {
        this.addExport(exportName, bugPackExport);
    } else {
        throw new Error("Package '" + this.name + "' already has export '" + exportName + "'");
    }
};

/**
 * @param {string} exportName
 * @return {*}
 */
BugPackPackage.prototype.require = function(exportName) {
    if (this.hasExport(exportName)) {
        return this.getExport(exportName);
    } else {
        throw new Error("Could not find export '" + exportName + "' in package '" + this.name + "'");
    }
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param {string} exportName
 * @param {*} bugPackExport
 */
BugPackPackage.prototype.addExport = function(exportName, bugPackExport) {
    this.exports[exportName] = bugPackExport;
};

/**
 * @private
 * @param {string} exportName
 * @return {*}
 */
BugPackPackage.prototype.getExport = function(exportName) {
    if (this.hasExport(exportName)) {
        return this.exports[exportName];
    }
    return null;
};

/**
 * @private
 * @return {boolean}
 */
BugPackPackage.prototype.hasExport = function(exportName) {
    return Object.prototype.hasOwnProperty.call(this.exports, exportName);
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackPackage;
