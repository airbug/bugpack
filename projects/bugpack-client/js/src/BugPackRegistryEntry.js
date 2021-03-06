/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

require('./BugPackFix').fix(module, "./BugPackRegistryEntry", function(module) {

    //-------------------------------------------------------------------------------
    // Requires
    //-------------------------------------------------------------------------------

    var BugPackSource   = require('./BugPackSource');


    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @constructor
     * @param {string} registryPath
     * @param {{}} registryEntryJson
     */
    var BugPackRegistryEntry = function(registryPath, registryEntryJson) {
        this.validate(registryEntryJson);

        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {boolean}
         */
        this.autoload           = registryEntryJson.autoload;

        /**
         * @private
         * @type {string}
         */
        this.path               = registryEntryJson.path;

        /**
         * @private
         * @type {string}
         */
        this.registryPath       = registryPath;

        /**
         * @private
         * @type {string}
         */
        this.sourceFilePath     = registryPath + "/" + this.path;

        /**
         * @private
         * @type {BugPackSource}
         */
        this.bugPackSource      = new BugPackSource(this.sourceFilePath);

        /**
         * @private
         * @type {Array.<string>}
         */
        this.exports            = registryEntryJson.exports || [];

        /**
         * @private
         * @type {Array.<string>}
         */
        this.requires           = registryEntryJson.requires || [];
    };


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    /**
     * @return {boolean}
     */
    BugPackRegistryEntry.prototype.getAutoload = function() {
        return this.autoload;
    };

    /**
     * @return {BugPackSource}
     */
    BugPackRegistryEntry.prototype.getBugPackSource = function() {
        return this.bugPackSource;
    };

    /**
     * @return {string}
     */
    BugPackRegistryEntry.prototype.getRegistryPath = function() {
        return this.registryPath;
    };

    /**
     * @return {string}
     */
    BugPackRegistryEntry.prototype.getSourceFilePath = function() {
        return this.sourceFilePath;
    };

    /**
     * @return {Array.<string>}
     */
    BugPackRegistryEntry.prototype.getExports = function() {
        return this.exports;
    };

    /**
     * @return {Array.<string>}
     */
    BugPackRegistryEntry.prototype.getRequires = function() {
        return this.requires;
    };


    //-------------------------------------------------------------------------------
    // Public Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {Object} registryEntryJson
     */
    BugPackRegistryEntry.prototype.validate = function(registryEntryJson) {
        if (!registryEntryJson.path) {
            throw new Error("Path is required for registry entries. " + JSON.stringify(registryEntryJson));
        }

        //TODO BRN: Validate the package name using regex
        //TODO BRN: Validate the export names using regex
    };


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    module.exports = BugPackRegistryEntry;
});
