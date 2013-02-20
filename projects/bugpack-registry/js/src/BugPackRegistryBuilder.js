//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var child_process = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryBuilder = function(absoluteSourceRoot) {

    /**
     * @private
     * @type {string}
     */
    this.absoluteSourceRoot = absoluteSourceRoot;

    /**
     * @private
     * @type {number}
     */
    this.numberComplete = 0;

    /**
     * @private
     * @type {Object}
     */
    this.registry = null;

    /**
     * @private
     * @type {Array}
     */
    this.registryBuildProcesses = [];

    /**
     * @private
     * @type {number}
     */
    this.roundRobinIndex = 0;

    /**
     * @private
     * @type {Array<string>}
     */
    this.sourceFiles = [];
};


//-------------------------------------------------------------------------------
// Public Methods
//-------------------------------------------------------------------------------

/**
 * @param {function()} callback
 */
BugPackRegistryBuilder.prototype.build = function(callback) {
    this.callback = callback;
    this.registry = {};
    this.startProcesses();
    this.findSourceFiles();
    this.processSourceFiles();
};


//-------------------------------------------------------------------------------
// Private Methods
//-------------------------------------------------------------------------------

/**
 * @private
 */
BugPackRegistryBuilder.prototype.checkComplete = function() {
    if (this.numberComplete === this.sourceFiles.length) {
        this.stopProcesses();
        this.callback(null, this.registry);
    }
};

/**
 * @private
 * @param {Array.<{name: string, arguments: Array.<(string|number)>}>} annotations
 * @return {Array.<string>}
 */
BugPackRegistryBuilder.prototype.findExports = function(annotations) {
    var exports = [];
    annotations.forEach(function(annotation) {
        var name = annotation.name;
        var arguments = annotation.arguments;
        if (name === 'Export') {
            var exportName = arguments[0];
            exports.push(exportName);
        }
    });
    return exports;
};

/**
 * @private
 * @param {Array.<{name: string, arguments: Array.<(string|number)>}>} annotations
 * @param {string} sourceFile
 * @return {string}
 */
BugPackRegistryBuilder.prototype.findPackage = function(annotations, sourceFile) {
    var packageFound = false;
    var packageName = null;
    annotations.forEach(function(annotation) {
        var name = annotation.name;
        var args = annotation.arguments;
        if (name === 'Package') {
            if (args && args.length > 0) {
                packageName = args[0];
                if (packageName) {
                    if (!packageFound) {
                        packageFound = true;
                    } else {
                        throw new Error("Duplicate package declaration '" + packageName + "' in source file '" + sourceFile + "'");
                    }
                } else {
                    throw new Error("Package name is required for package declaration in source file '" + sourceFile + "'");
                }
            } else {
                throw new Error("Package name is required for package declaration in source file '" + sourceFile + "'");
            }
        }
    });
    return packageName;
};

/**
 * @private
 * @param {Array.<{name: string, arguments: Array.<(string|number)>}>} annotations
 * @return {Array.<string>}
 */
BugPackRegistryBuilder.prototype.findRequires = function(annotations) {
    var requires = [];
    annotations.forEach(function(annotation) {
        var name = annotation.name;
        var arguments = annotation.arguments;
        if (name === 'Require') {
            var requireName = arguments[0];
            requires.push(requireName);
        }
    });
    return requires;
};

/**
 * @private
 */
BugPackRegistryBuilder.prototype.findSourceFiles = function() {
    this.sourceFiles = this.scanDirectoryForSourceFiles(this.absoluteSourceRoot, true);
};

/**
 * @private
 * @param {string} sourceFile
 * @param {Array.<{name: string, arguments: Array.<(string|number)>}>} annotations
 * @return {{name: string, path: string, annotations: Array.<*>}}
 */
BugPackRegistryBuilder.prototype.generatePack = function(sourceFile, annotations) {
    var pack = {
        path: path.relative(this.absoluteSourceRoot, sourceFile),
        exports: this.findExports(annotations),
        package: this.findPackage(annotations, sourceFile),
        requires: this.findRequires(annotations),
        annotations: annotations
    };
    return pack;
};

/**
 * @private
 */
BugPackRegistryBuilder.prototype.processSourceFiles = function() {
    var _this = this;
    if (this.sourceFiles.length > 0) {
        this.sourceFiles.forEach(function(sourceFile) {
            var registryBuilderProcess = _this.roundRobinNextProcess();
            registryBuilderProcess.send({sourceFile: sourceFile});
        });
    } else {
        console.log("Did not find any source files during bugpack registry build...");
        this.checkComplete();
    }
};

/**
 * @private
 * @param {string} symlinkPath
 * @return {string}
 */
BugPackRegistryBuilder.prototype.resolveSymlink = function(symlinkPath) {
    var symlinkedPathString = fs.readlinkSync(symlinkPath);
    var stat = fs.lstatSync(symlinkedPathString);
    if (stat.isSymbolicLink()) {
        return this.resolveSymlink(symlinkedPathString);
    } else {
        return symlinkedPathString;
    }
};

/**
 * @private
 */
BugPackRegistryBuilder.prototype.roundRobinNextProcess = function() {
    var numberProcesses = this.registryBuildProcesses.length;
    if (numberProcesses > 0) {
        this.roundRobinIndex++;
        if (this.roundRobinIndex >= numberProcesses) {
            this.roundRobinIndex = 0;
        }
        return this.registryBuildProcesses[this.roundRobinIndex];
    }
    return undefined;
};

/**
 * @private
 * @param {string} directoryPathString
 * @param {boolean} scanRecursively (defaults to true)
 * @return {Array.<string>}
 */
BugPackRegistryBuilder.prototype.scanDirectoryForSourceFiles = function(directoryPathString, scanRecursively) {
    if (scanRecursively === undefined) {
        scanRecursively = true;
    }
    var sourcePathArray = [];
    var fileStringArray = fs.readdirSync(directoryPathString);
    for (var i = 0, size = fileStringArray.length; i < size; i++) {
        var pathString = directoryPathString + "/" + fileStringArray[i];
        sourcePathArray = sourcePathArray.concat(this.scanPathForSourceFiles(pathString, scanRecursively));
    }
    return sourcePathArray;
};

/**
 * @private
 * @param {string} pathString
 * @param {boolean} scanRecursively
 * @return {Array.<string>}
 */
BugPackRegistryBuilder.prototype.scanPathForSourceFiles = function(pathString, scanRecursively) {
    var sourcePathArray = [];
    var stat = fs.lstatSync(pathString);
    if (stat.isDirectory()) {
        if (scanRecursively) {
            var childModulePathArray = this.scanDirectoryForSourceFiles(pathString);
            sourcePathArray = sourcePathArray.concat(childModulePathArray);
        }
    } else if (stat.isFile()) {
        if (pathString.lastIndexOf('.js') === pathString.length - 3) {
            sourcePathArray.push(pathString);
        }
    } else if (stat.isSymbolicLink()) {
        sourcePathArray = sourcePathArray.concat(this.scanSymlinkForSourceFiles(pathString, scanRecursively));
    }
    return sourcePathArray;
};

BugPackRegistryBuilder.prototype.scanSymlinkForSourceFiles = function(symlinkPathString, scanRecursively) {
    var sourcePathArray = [];
    var resolvedPath = this.resolveSymlink(symlinkPathString);
    var stat = fs.lstatSync(resolvedPath);
    if (stat.isDirectory()) {
        if (scanRecursively) {
            var childModulePathArray = this.scanDirectoryForSourceFiles(resolvedPath);
            for (var i = 0, size = childModulePathArray.length; i < size; i++) {
                var childModulePath = childModulePathArray[i];
                childModulePathArray[i] = childModulePath.replace(resolvedPath, symlinkPathString);
            }
            sourcePathArray = sourcePathArray.concat(childModulePathArray);
        }
    } else if (stat.isFile()) {
        if (resolvedPath.lastIndexOf('.js') === resolvedPath.length - 3) {
            sourcePathArray.push(symlinkPathString);
        }
    } else {
        throw new Error("Resolved Path '" + resolvedPath + "' is an unknown type.");
    }
    return sourcePathArray;
};

/**
 * @private
 */
BugPackRegistryBuilder.prototype.startProcesses = function() {
    var _this = this;
    var numCPUs = os.cpus().length;
    for (var i = 0; i < numCPUs; i++) {
        var childProcess = child_process.fork(__dirname + '/registry_builder_process_boot.js');
        childProcess.on('message', function(message) {
            _this.handleChildMessage(message);
        });
        this.registryBuildProcesses.push(childProcess);
    }
};

/**
 * @private
 */
BugPackRegistryBuilder.prototype.stopProcesses = function() {
    while (this.registryBuildProcesses.length > 0) {
        var registryBuildProcess = this.registryBuildProcesses.pop();
        registryBuildProcess.kill();
    }
};

/**
 * @private
 * @param message
 */
BugPackRegistryBuilder.prototype.handleChildMessage = function(message) {
    var error = null;
    this.numberComplete++;

    if (!message.error) {
        var sourceFile = message.sourceFile;
        var sourceFileRegistry = this.generatePack(sourceFile, message.annotations);
        this.registry[sourceFileRegistry.path] = sourceFileRegistry;
    } else {
        error = new Error(message.message);
    }

    if (error) {
        this.callback(error, null);
    } else {
        this.checkComplete();
    }
};


//-------------------------------------------------------------------------------
// Static Methods
//-------------------------------------------------------------------------------

/**
 * @param {string} sourceRoot
 * @param {function()} callback
 */
BugPackRegistryBuilder.buildRegistry = function(sourceRoot, callback) {
    var registryBuilder = new BugPackRegistryBuilder(sourceRoot);
    registryBuilder.build(callback);
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

module.exports = BugPackRegistryBuilder;
