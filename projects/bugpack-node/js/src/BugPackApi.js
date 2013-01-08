//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');

var BugPackContext = require('./BugPackContext');
var PathUtil = require('./PathUtil');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackApi = {};


//-------------------------------------------------------------------------------
// Static Variables
//-------------------------------------------------------------------------------

/**
 * @private
 * @type {BugPackContext}
 */
BugPackApi.currentContext = null;

/**
 * @private
 * @type {Object}
 */
BugPackApi.moduleTopDirToContext = {};


//-------------------------------------------------------------------------------
// Static Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @param {BugPackContext} context
 */
BugPackApi.setCurrentContext = function(context) {
    BugPackApi.currentContext = context;
};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {Module} module
 * @return {BugPackContext}
 */
BugPackApi.context = function(module) {

    // NOTE BRN: Only packs in THIS node module will be autoloaded. We should not try to find EVERY module and load
    // all the registries.

    if (module) {
        BugPackApi.currentContext = BugPackApi.generateContext(module);
    }

    return BugPackApi.currentContext;
};


//-------------------------------------------------------------------------------
// Private Static Methods
//-------------------------------------------------------------------------------

/**
 * @private
 * @param module
 * @return {string}
 */
BugPackApi.findModuleTopDir = function(module) {
    var moduleDir =  path.dirname(module.filename);
    var parts = moduleDir.split(path.sep);
    for (var size = parts.length, i = size - 1; i > 0; i--) {
        var dir = parts.slice(0, i + 1).join(path.sep);
        if (BugPackApi.isNodeModuleDirSync(dir)) {
            return dir;
        }
    }
    return moduleDir;
};

/**
 * @param {Module} module
 * @return {BugPackContext}
 */
BugPackApi.generateContext = function(module) {
    var moduleTopDir = BugPackApi.findModuleTopDir(module);
    var context = BugPackApi.getContextForModuleTopDir(moduleTopDir);
    if (!context) {
        context = new BugPackContext(moduleTopDir, this);
        context.generate();
        BugPackApi.putContextForModuleTopDir(moduleTopDir, context);
    }
    return context;
};

/**
 *
 * @param moduleTopDir
 */
BugPackApi.getContextForModuleTopDir = function(moduleTopDir) {
    if (BugPackApi.hasContextForModuleTopDir(moduleTopDir)) {
        return BugPackApi.moduleTopDirToContext[moduleTopDir];
    }
    return null;
};

/**
 * @private
 * @param {string} moduleTopDir
 * @return {boolean}
 */
BugPackApi.hasContextForModuleTopDir  = function(moduleTopDir) {
    return Object.prototype.hasOwnProperty.call(BugPackApi.moduleTopDirToContext, moduleTopDir);
};

/**
 * @private
 * @param {string} path
 */
BugPackApi.isNodeModuleDirSync = function(path) {
    return (PathUtil.isFileSync(path + "/bugpack-registry.json")
        || PathUtil.isFileSync(path + "/package.json")
        || PathUtil.isDirectorySync(path + "/node_modules")
        || PathUtil.isFileSync(path + "/index.node")
        || PathUtil.isFileSync(path + "/index.js"));
};

/**
 * @private
 * @param moduleTopDir
 * @param context
 */
BugPackApi.putContextForModuleTopDir = function(moduleTopDir, context) {
    BugPackApi.moduleTopDirToContext[moduleTopDir] = context;
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackApi;
