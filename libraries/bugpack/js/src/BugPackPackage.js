/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('./BugPackFix').fix(module, "./BugPackPackage", function(module) {

    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @constructor
     * @param {string} name
     */
    var BugPackPackage = function(name) {

        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {Object}
         */
        this.exports        = {};

        /**
         * @private
         * @type {string}
         */
        this.name           = name;

        /**
         * @private
         * @type {Array.<BugPackPackage>}
         */
        this.subPackages    = [];
    };


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    /**
     * @return {Object}
     */
    BugPackPackage.prototype.getExports = function() {
        return this.exports;
    };

    /**
     * @return {string}
     */
    BugPackPackage.prototype.getName = function() {
        return this.name;
    };

    /**
     * @return {Array.<BugPackPackage>}
     */
    BugPackPackage.prototype.getSubPackages = function() {
        return this.subPackages;
    };


    //-------------------------------------------------------------------------------
    // Public Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {BugPackPackage} bugPackPackage
     */
    BugPackPackage.prototype.addSubPackage = function(bugPackPackage) {
        this.subPackages.push(bugPackPackage);
    };

    /**
     * @param {string} exportName
     * @param {*} bugPackExport
     */
    BugPackPackage.prototype.export = function(exportName, bugPackExport) {
        if (!this.hasExport(exportName)) {
            this.addExport(exportName, bugPackExport);
        } else {
            Error.stackTraceLimit = Infinity;
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
            Error.stackTraceLimit = Infinity;
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
        this.markExport(exportName, bugPackExport);
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

    /**
     * @private
     * @param {string} exportName
     * @param {*} bugPackExport
     */
    BugPackPackage.prototype.markExport = function(exportName, bugPackExport) {
        if (bugPackExport !== null && bugPackExport !== undefined) {
            if (!bugPackExport._bugPack) {
                Object.defineProperty(bugPackExport, "_bugPack", {
                    value : {
                        packageName: this.name,
                        exportName: exportName,
                        bugPackKey: this.name ? this.name + "." + exportName : exportName
                    },
                    writable : false,
                    enumerable : false,
                    configurable : false
                });
            } else {
                Error.stackTraceLimit = Infinity;
                throw new Error("Trying to mark a bugpack export that is already marked. Are you exporting the same value more than once?");
            }
        }
    };


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    module.exports = BugPackPackage;
});
