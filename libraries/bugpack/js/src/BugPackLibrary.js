/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('./BugPackFix').fix(module, "./BugPackLibrary", function(module) {

    //-------------------------------------------------------------------------------
    // Requires
    //-------------------------------------------------------------------------------

    var BugPackPackage = require('./BugPackPackage');


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @constructor
     */
    var BugPackLibrary = function() {

        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugPackPackage}
         */
        this.corePackage    = new BugPackPackage("");

        /**
         * @private
         * @type {Object}
         */
        this.packages       = {};
    };


    //-------------------------------------------------------------------------------
    // Public Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} packageName
     * @return {BugPackPackage}
     */
    BugPackLibrary.prototype.createPackage = function(packageName) {
        var _this = this;
        var packageParts = packageName.split(".");
        var currentPackageString = "";
        var first = true;
        var parentPackage = this.corePackage;
        packageParts.forEach(function(packagePart) {
            if (first) {
                first = false;
            } else {
                currentPackageString += ".";
            }
            currentPackageString += packagePart;
            if (!_this.hasPackage(currentPackageString)) {
                var bugPackPackage = new BugPackPackage(currentPackageString);
                _this.packages[bugPackPackage.getName()] = bugPackPackage;
                parentPackage.addSubPackage(bugPackPackage);
                parentPackage = bugPackPackage;
            }
        });
        return parentPackage;
    };

    /**
     * @param {string} packageName
     * @return {BugPackPackage}
     */
    BugPackLibrary.prototype.getPackage = function(packageName) {
        if (packageName === "") {
            return this.corePackage;
        } else if (this.hasPackage(packageName)) {
            return this.packages[packageName];
        }
        return null;
    };

    /**
     * @param {string} packageName
     * @return {boolean}
     */
    BugPackLibrary.prototype.hasPackage = function(packageName) {
        if (packageName === "") {
            return true;
        } else {
            return Object.prototype.hasOwnProperty.call(this.packages, packageName);
        }
    };

    /**
     * @param {string} packageName
     * @param {string} exportName
     * @param {*} bugPackExport
     */
    BugPackLibrary.prototype.registerExport = function(packageName, exportName, bugPackExport) {
        var bugPackPackage = this.getPackage(packageName);
        if (!bugPackPackage) {
            bugPackPackage = this.createPackage(packageName);
        }
        bugPackPackage.export(exportName, bugPackExport);
    };


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    module.exports = BugPackLibrary;
});
