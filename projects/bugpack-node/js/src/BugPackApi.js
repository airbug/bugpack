/*
 * Copyright (c) 2014 airbug inc. http://airbug.com
 *
 * bugpack may be freely distributed under the MIT license.
 */


//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var fs                  = require('fs');
var path                = require('path');

var BugPackContext      = require('./BugPackContext');
var PathUtil            = require('./PathUtil');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackApi = {};


//-------------------------------------------------------------------------------
// Static Properties
//-------------------------------------------------------------------------------

/**
 * @static
 * @private
 * @type {BugPackContext}
 */
BugPackApi.currentContext           = null;

/**
 * @static
 * @private
 * @type {Object}
 */
BugPackApi.moduleTopDirToContext    = {};


//-------------------------------------------------------------------------------
// Static Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @static
 * @param {BugPackContext} context
 */
BugPackApi.setCurrentContext = function(context) {
    BugPackApi.currentContext = context;
};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @static
 * @param {(Module|string)} contextQuery
 * @param {function(BugPackContext)=} contextFunction
 * @return {BugPackContext}
 */
BugPackApi.context = function(contextQuery, contextFunction) {
    if (contextQuery && contextQuery !== "*") {
        var moduleTopDir = BugPackApi.findModuleTopDir(contextQuery);
        var foundContext = BugPackApi.getContextForModuleTopDir(moduleTopDir);
        if (foundContext) {
            BugPackApi.setCurrentContext(foundContext);
        } else {
            Error.stackTraceLimit = Infinity;
            throw new Error("No context loaded for '" + contextQuery + "'");
        }
    } else if (!BugPackApi.currentContext) {
        BugPackApi.setCurrentContext(BugPackApi.generateContext("*"));
    }
    if (contextFunction) {
        contextFunction(BugPackApi.currentContext);
    }
    return BugPackApi.currentContext;
};

/**
 * @static
 * @param {(Module|string)} contextQuery
 * @param {function(Error, BugPackContext=)} callback
 */
BugPackApi.loadContext = function(contextQuery, callback) {
    var moduleTopDir = BugPackApi.findModuleTopDir(contextQuery);
    if (!BugPackApi.hasContextForModuleTopDir(moduleTopDir)) {
        var context = BugPackApi.generateContext(contextQuery);
        context.loadContext(function(error) {
            if (!error) {
                callback(null, context);
            } else {
                callback(error);
            }
        });
    } else {
        callback(null, BugPackApi.getContextForModuleTopDir(moduleTopDir));
    }
};

/**
 * @static
 * @param {(Module|string)} contextQuery
 * @return {BugPackContext}
 */
BugPackApi.loadContextSync = function(contextQuery) {
    var moduleTopDir = BugPackApi.findModuleTopDir(contextQuery);
    if (!BugPackApi.hasContextForModuleTopDir(moduleTopDir)) {
        var context = BugPackApi.generateContext(contextQuery);
        context.loadContextSync();
        return context;
    } else {
        return BugPackApi.getContextForModuleTopDir(moduleTopDir);
    }
};


//-------------------------------------------------------------------------------
// Private Static Methods
//-------------------------------------------------------------------------------

/**
 * @static
 * @private
 * @param {(Module|string)} moduleOrPath
 * @return {string}
 */
BugPackApi.findModuleTopDir = function(moduleOrPath) {
    var startPath = moduleOrPath;
    if (typeof moduleOrPath === "object") {
        startPath = path.dirname(moduleOrPath.filename);
    }
    startPath = path.resolve(startPath);
    var parts = startPath.split(path.sep);
    for (var size = parts.length, i = size - 1; i > 0; i--) {
        var dir = parts.slice(0, i + 1).join(path.sep);
        if (BugPackApi.isNodeModuleDirSync(dir)) {
            return dir;
        }
    }
    return null;
};

/**
 * @static
 * @private
 * @param {(Module|string)} moduleOrPath
 * @return {BugPackContext}
 */
BugPackApi.generateContext = function(moduleOrPath) {
    var moduleTopDir = BugPackApi.findModuleTopDir(moduleOrPath);
    var context = BugPackApi.getContextForModuleTopDir(moduleTopDir);
    if (!context) {
        context = new BugPackContext(moduleTopDir, this);
        BugPackApi.putContextForModuleTopDir(moduleTopDir, context);
    }
    return context;
};

/**
 * @static
 * @private
 * @param {string} moduleTopDir
 * @return {BugPackContext}
 */
BugPackApi.getContextForModuleTopDir = function(moduleTopDir) {
    if (BugPackApi.hasContextForModuleTopDir(moduleTopDir)) {
        return BugPackApi.moduleTopDirToContext[moduleTopDir];
    }
    return null;
};

/**
 * @static
 * @private
 * @param {string} moduleTopDir
 * @return {boolean}
 */
BugPackApi.hasContextForModuleTopDir  = function(moduleTopDir) {
    return Object.prototype.hasOwnProperty.call(BugPackApi.moduleTopDirToContext, moduleTopDir);
};

/**
 * @static
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
 * @static
 * @private
 * @param {string} moduleTopDir
 * @param {BugPackContext} context
 */
BugPackApi.putContextForModuleTopDir = function(moduleTopDir, context) {
    BugPackApi.moduleTopDirToContext[moduleTopDir] = context;
};


//-------------------------------------------------------------------------------
// Global
//-------------------------------------------------------------------------------

// NOTE BRN: We store the BugPackApi in global context so that we can cross load BugPackContexts in the same process.
// We can't do this simply through the require() mechanism because each file loads its BugPack based on
// what dependency is relative to the current node js module. So if you are cross loading contexts, you end up with
// an entirely different BugPackApi that has no contexts at all in memory.

//TODO BRN: Add a version check to throw an error when different versions of bugpack cross load.

if (!global.BugPackApi) {
    global.BugPackApi = BugPackApi;
}


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = global.BugPackApi;
