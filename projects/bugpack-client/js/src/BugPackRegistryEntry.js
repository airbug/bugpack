//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var BugPackRegistryEntry = function(registryPath, registryEntryJson) {
    this.validate(registryEntryJson);

    /**
     * @private
     * @type {string}
     */
    this.path = registryEntryJson.path;

    /**
     * @private
     * @type {string}
     */
    this.registryPath = registryPath;

    /**
     * @private
     * @type {string}
     */
    this.sourceFilePath = registryPath + "/" + this.path;

    /**
     * @private
     * @type {BugPackSource}
     */
    this.bugPackSource = new BugPackSource(this.sourceFilePath);

    /**
     * @private
     * @type {string}
     */
    this.packageName = registryEntryJson.package || ".";

    /**
     * @private
     * @type {Array.<string>}
     */
    this.exportNames = registryEntryJson.exports || [];

    /**
     * @private
     * @type {Array.<string>}
     */
    this.annotations = registryEntryJson.annotations || [];

    /**
     * @private
     * @type {Array.<string>}
     */
    this.requires = registryEntryJson.requires || [];
};


//-------------------------------------------------------------------------------
// Getters and Setters
//-------------------------------------------------------------------------------

/**
 * @return {string}
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
 * @return {string}
 */
BugPackRegistryEntry.prototype.getPackageName = function() {
    return this.packageName;
};

/**
 * @return {Array.<string>}
 */
BugPackRegistryEntry.prototype.getExportNames = function() {
    return this.exportNames;
};

/**
 * @return {Array.<string>}
 */
BugPackRegistryEntry.prototype.getAnnotations = function() {
    return this.annotations;
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

