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
 * @return {string}
 */
BugPackRegistryBuilder.prototype.findPackage = function(annotations) {
    var packageFound = false;
    var packageName = null;
    annotations.forEach(function(annotation) {
        var name = annotation.name;
        var arguments = annotation.arguments;
        if (name === 'Package') {
            packageName = arguments[0];
            if (packageName) {
                if (!packageFound) {
                    packageFound = true;
                } else {
                    throw new Error("Duplicate package declaration '" + packageName + "' in file.");
                }
            } else {
                throw new Error("Package name is required for package declaration.");
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
        package: this.findPackage(annotations),
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
    this.sourceFiles.forEach(function(sourceFile) {
        var registryBuilderProcess = _this.roundRobinNextProcess();
        registryBuilderProcess.send({sourceFile: sourceFile});
    });
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
 * @return {Array<string>}
 */
BugPackRegistryBuilder.prototype.scanDirectoryForSourceFiles = function(directoryPathString, scanRecursively) {
    if (scanRecursively === undefined) {
        scanRecursively = true;
    }
    var sourcePathArray = [];
    var fileStringArray = fs.readdirSync(directoryPathString);
    for (var i = 0, size = fileStringArray.length; i < size; i++) {
        var pathString = directoryPathString + "/" + fileStringArray[i];
        var stat = fs.statSync(pathString);
        if (stat.isDirectory()) {
            if (scanRecursively) {
                var childModulePathArray = this.scanDirectoryForSourceFiles(pathString);
                sourcePathArray = sourcePathArray.concat(childModulePathArray);
            }
        } else if (stat.isFile()) {
            if (pathString.lastIndexOf('.js') === pathString.length - 3) {
                sourcePathArray.push(pathString);
            }
        }
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
    } else if (this.numberComplete === this.sourceFiles.length) {
        this.stopProcesses();
        this.callback(null, this.registry);
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
