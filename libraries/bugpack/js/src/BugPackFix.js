/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Context
//-------------------------------------------------------------------------------

(function() {

    //-------------------------------------------------------------------------------
    // Declare Class
    //-------------------------------------------------------------------------------

    /**
     * @constructor
     * @param {Object.<string, *>} modules
     */
    var BugPackFix = function(modules) {

        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {Object.<string, *>}
         */
        this.modules = modules;
    };


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    /**
     * @return {Object.<string, *>}
     */
    BugPackFix.prototype.getModules = function() {
        return this.modules;
    };


    //-------------------------------------------------------------------------------
    // Public Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {{
     *      exports: *
     * }} module
     * @param {string} moduleName
     * @param {function(*)} moduleContext
     */
    BugPackFix.prototype.fix = function(module, moduleName, moduleContext) {
        if (!module) {
            module = new ModuleFix(this.getModules(), moduleName);
        }
        moduleContext(module);
    };


    //-------------------------------------------------------------------------------
    // Static Properties
    //-------------------------------------------------------------------------------

    /**
     * @static
     * @private
     * @type {BugPackFix}
     */
    BugPackFix.instance = null;


    //-------------------------------------------------------------------------------
    // Static Methods
    //-------------------------------------------------------------------------------

    /**
     * @static
     * @param {{
     *      exports: *
     * }} module
     * @param {string} moduleName
     * @param {function(*)} moduleContext
     */
    BugPackFix.fix = function(module, moduleName, moduleContext) {
        return BugPackFix.getInstance().fix(module, moduleName, moduleContext);
    };

    /**
     * @static
     * @return {BugPackFix}
     */
    BugPackFix.getInstance = function() {
        if (BugPackFix.instance === null) {
            BugPackFix.instance = new BugPackFix(require.modules);
        }
        return BugPackFix.instance;
    };


    //-------------------------------------------------------------------------------
    // Declare Sub Class
    //-------------------------------------------------------------------------------

    /**
     * @constructor
     * @param {Object.<string, *>} modules
     * @param {string} moduleName
     */
    var ModuleFix = function(modules, moduleName) {

        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {*}
         */
        this._exports       = null;

        /**
         * @private
         * @type {string}
         */
        this.moduleName     = moduleName;

        /**
         * @private
         * @type {Object.<string, *>}
         */
        this.modules        = modules;
    };


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    ModuleFix.prototype = {
        get exports() {
            return this._exports;
        },
        set exports(exports){
            this._exports = exports;
            this.modules[this.moduleName] = exports;
        }
    };

    /**
     * @return {string}
     */
    ModuleFix.prototype.getModuleName = function() {
        return this.moduleName;
    };

    /**
     * @return {Object.<string, *>}
     */
    ModuleFix.prototype.getModules = function() {
        return this.modules;
    };


    //-------------------------------------------------------------------------------
    // Exports
    //-------------------------------------------------------------------------------

    if (module) {
        module.exports = BugPackFix;
    } else {
        require.modules["./BugPackFix"] = BugPackFix;
    }
})();