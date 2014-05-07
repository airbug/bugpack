//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var buildbug            = require("buildbug");


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var buildProject        = buildbug.buildProject;
var buildProperties     = buildbug.buildProperties;
var buildTarget         = buildbug.buildTarget;
var enableModule        = buildbug.enableModule;
var parallel            = buildbug.parallel;
var series              = buildbug.series;
var targetTask          = buildbug.targetTask;


//-------------------------------------------------------------------------------
// Enable Modules
//-------------------------------------------------------------------------------

var aws                 = enableModule("aws");
var bugpack             = enableModule('bugpack');
var bugunit             = enableModule('bugunit');
var core                = enableModule('core');
var nodejs              = enableModule('nodejs');
var uglifyjs            = enableModule("uglifyjs");


//-------------------------------------------------------------------------------
// Values
//-------------------------------------------------------------------------------

var version             = "0.1.12";


//-------------------------------------------------------------------------------
// Declare Properties
//-------------------------------------------------------------------------------

buildProperties({
    node: {
        packageJson: {
            name: "bugpack",
            version: version,
            description: "Package manager and loader to help make browser and node js package loading consistent and easier",
            main: "./lib/BugPackApi.js",
            author: "Brian Neisler <brian@airbug.com>",
            repository: {
                type: "git",
                url: "https://github.com/airbug/bugpack.git"
            },
            bugs: {
                url: "https://github.com/airbug/bugpack/issues"
            },
            licenses: [
                {
                    type : "MIT",
                    url : "https://raw.githubusercontent.com/airbug/bugpack/master/LICENSE"
                }
            ]
        },
        sourcePaths: [
            "./projects/bugpack-node/js/src"
        ],
        readmePath: "./README.md"
    },
    web: {
        name: "bugpack",
        version: version,
        sourcePaths: [
            "./projects/bugpack-client/js/src/BugPackKey.js",
            "./projects/bugpack-client/js/src/BugPackPackage.js",
            "./projects/bugpack-client/js/src/BugPackLibrary.js",
            "./projects/bugpack-client/js/src/BugPackSource.js",
            "./projects/bugpack-client/js/src/BugPackSourceProcessor.js",
            "./projects/bugpack-client/js/src/BugPackRegistryEntry.js",
            "./projects/bugpack-client/js/src/BugPackRegistry.js",
            "./projects/bugpack-client/js/src/BugPackRegistryFile.js",
            "./projects/bugpack-client/js/src/BugPackContext.js",
            "./projects/bugpack-client/js/src/BugPackApi.js"
        ],
        outputFile: "{{distPath}}/{{web.name}}-{{web.version}}.js",
        outputMinFile: "{{distPath}}/{{web.name}}-{{web.version}}.min.js"
    }
});


//-------------------------------------------------------------------------------
// BuildTargets
//-------------------------------------------------------------------------------


// Clean BuildTarget
//-------------------------------------------------------------------------------

buildTarget("clean").buildFlow(
    targetTask("clean")
);


// Local BuildTarget
//-------------------------------------------------------------------------------

buildTarget("local").buildFlow(

    series([
        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("node.packageJson"),
                        readmePath: buildProject.getProperty("node.readmePath"),
                        sourcePaths: buildProject.getProperty("node.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{local-bucket}}"
                    }
                })
            ]),
            series([
                targetTask("concat", {
                    properties: {
                        sources: buildProject.getProperty("web.sourcePaths"),
                        outputFile: "{{web.outputFile}}"
                    }
                }),
                parallel([
                    targetTask("s3PutFile", {
                        properties: {
                            file:  "{{web.outputFile}}",
                            options: {
                                acl: 'public-read',
                                gzip: true
                            },
                            bucket: "{{local-bucket}}"
                        }
                    }),
                    series([
                        targetTask("uglifyjsMinify", {
                            properties: {
                                sources: ["{{web.outputFile}}"],
                                outputFile: "{{web.outputMinFile}}"
                            }
                        }),
                        targetTask("s3PutFile", {
                            properties: {
                                file:  "{{web.outputMinFile}}",
                                options: {
                                    acl: 'public-read',
                                    gzip: true
                                },
                                bucket: "{{local-bucket}}"
                            }
                        })
                    ])
                ])
            ])
        ])
    ])
).makeDefault();


// Prod BuildTarget
//-------------------------------------------------------------------------------

buildTarget("prod").buildFlow(
    series([
        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("node.packageJson"),
                        readmePath: buildProject.getProperty("node.readmePath"),
                        sourcePaths: buildProject.getProperty("node.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("node.packageJson.name"),
                            buildProject.getProperty("node.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read',
                                encrypt: true
                            }
                        });
                    },
                    properties: {
                        bucket: "{{public-bucket}}"
                    }
                }),
                targetTask('npmConfigSet', {
                    properties: {
                        config: buildProject.getProperty("npmConfig")
                    }
                }),
                targetTask('npmAddUser'),
                targetTask('publishNodePackage', {
                    properties: {
                        packageName: "{{node.packageJson.name}}",
                        packageVersion: "{{node.packageJson.version}}"
                    }
                })
            ]),
            series([
                targetTask("concat", {
                    properties: {
                        sources: buildProject.getProperty("web.sourcePaths"),
                        outputFile: "{{web.outputFile}}"
                    }
                }),
                parallel([
                    targetTask("s3PutFile", {
                        properties: {
                            file:  "{{web.outputFile}}",
                            options: {
                                acl: 'public-read',
                                gzip: true,
                                cacheControl: "max-age=31536000, public"
                            },
                            bucket: "{{public-bucket}}"
                        }
                    }),
                    series([
                        targetTask("uglifyjsMinify", {
                            properties: {
                                sources: ["{{web.outputFile}}"],
                                outputFile: "{{web.outputMinFile}}"
                            }
                        }),
                        targetTask("s3PutFile", {
                            properties: {
                                file:  "{{web.outputMinFile}}",
                                options: {
                                    acl: 'public-read',
                                    gzip: true,
                                    cacheControl: "max-age=31536000, public"
                                },
                                bucket: "{{public-bucket}}"
                            }
                        })
                    ])
                ])
            ])
        ])
    ])
);
