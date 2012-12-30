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

var RegistryBuilder = function(absoluteSourceRoot) {

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
RegistryBuilder.prototype.build = function(callback) {
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
RegistryBuilder.prototype.findSourceFiles = function() {
    this.sourceFiles = this.scanDirectoryForSourceFiles(this.absoluteSourceRoot, true);
};

/**
 * @private
 */
RegistryBuilder.prototype.processSourceFiles = function() {
    var _this = this;
    this.sourceFiles.forEach(function(sourceFile) {
        var registryBuilderProcess = _this.roundRobinNextProcess();
        registryBuilderProcess.send({sourceFile: sourceFile});
    });
};

/**
 * @private
 */
RegistryBuilder.prototype.roundRobinNextProcess = function() {
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
RegistryBuilder.prototype.scanDirectoryForSourceFiles = function(directoryPathString, scanRecursively) {
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
RegistryBuilder.prototype.startProcesses = function() {
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
RegistryBuilder.prototype.stopProcesses = function() {
    while (this.registryBuildProcesses.length > 0) {
        var registryBuildProcess = this.registryBuildProcesses.pop();
        registryBuildProcess.kill();
    }
};

RegistryBuilder.prototype.handleChildMessage = function(message) {
    var error = null;
    this.numberComplete++;

    if (!message.error) {
        var sourceFile = message.sourceFile;
        var packName = path.basename(sourceFile);
        if (message.packName) {
            packName = message.packName;
        }
        var pack = {
            name: packName,
            path: path.relative(this.absoluteSourceRoot, sourceFile)
        };
        if (message.options) {
            pack.options = message.options;
        }
        this.registry[packName] = pack;
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
// Exports
//-------------------------------------------------------------------------------

module.exports = RegistryBuilder;
