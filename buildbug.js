//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var buildbug        = require("buildbug");


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var buildProject    = buildbug.buildProject;
var buildProperties = buildbug.buildProperties;
var buildTarget     = buildbug.buildTarget;
var enableModule    = buildbug.enableModule;
var parallel        = buildbug.parallel;
var series          = buildbug.series;
var targetTask      = buildbug.targetTask;


//-------------------------------------------------------------------------------
// Enable Modules
//-------------------------------------------------------------------------------

var aws             = enableModule("aws");
var bugpack         = enableModule('bugpack');
var bugunit         = enableModule('bugunit');
var core            = enableModule('core');
var nodejs          = enableModule('nodejs');
var uglifyjs        = enableModule("uglifyjs");


//-------------------------------------------------------------------------------
// Declare Properties
//-------------------------------------------------------------------------------

buildProperties({
    bugpackNode: {
        packageJson: {
            name: "bugpack",
            version: "0.0.6",
            main: "./lib/BugPackApi.js",
            private: true
        },
        sourcePaths: [
            "./projects/bugpack-node/js/src"
        ]
    },
    bugpackRegistry: {
        packageJson: {
            name: "bugpack-registry",
            version: "0.0.6",
            main: "./scripts/bugpack-registry-module.js",
            private: true,
            dependencies: {
                bugpack: 'https://s3.amazonaws.com/airbug/bugpack-0.0.5.tgz'
            }
        },
        sourcePaths: [
            "../bugjs/projects/buganno/js/src",
            "../bugjs/projects/bugflow/js/src",
            "../bugjs/projects/bugfs/js/src",
            "../bugjs/projects/bugjs/js/src",
            "../bugjs/projects/bugmeta/js/src",
            "../bugjs/projects/bugtrace/js/src",
            "../bugunit/projects/bugdouble/js/src",
            "../bugunit/projects/bugunit/js/src",
            "./projects/bugpack-registry/js/src"
        ],
        scriptPaths: [
            "../bugjs/projects/buganno/js/scripts",
            "../bugunit/projects/bugunit/js/scripts",
            "./projects/bugpack-registry/js/scripts"
        ],
        testPaths: [
            "../bugjs/projects/buganno/js/test",
            "../bugjs/projects/bugflow/js/test",
            "../bugjs/projects/bugjs/js/test"
        ]
    },
    bugpackWeb: {
        name: "bugpack",
        version: "0.0.6",
        sourcePaths: [
            "./projects/bugpack-client/js/src/BugPackKey.js",
            "./projects/bugpack-client/js/src/BugPackPackage.js",
            "./projects/bugpack-client/js/src/BugPackLibrary.js",
            "./projects/bugpack-client/js/src/BugPackSource.js",
            "./projects/bugpack-client/js/src/BugPackRegistryEntry.js",
            "./projects/bugpack-client/js/src/BugPackRegistry.js",
            "./projects/bugpack-client/js/src/BugPackRegistryFile.js",
            "./projects/bugpack-client/js/src/BugPackContext.js",
            "./projects/bugpack-client/js/src/BugPackApi.js"
        ],
        outputFile: "{{distPath}}/{{bugpackWeb.name}}-{{bugpackWeb.version}}.js",
        outputMinFile: "{{distPath}}/{{bugpackWeb.name}}-{{bugpackWeb.version}}.min.js"
    }
});


//-------------------------------------------------------------------------------
// Declare Tasks
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
// Declare Flows
//-------------------------------------------------------------------------------


// Clean Flow
//-------------------------------------------------------------------------------

buildTarget("clean").buildFlow(
    targetTask("clean")
);


// Local Flow
//-------------------------------------------------------------------------------

buildTarget("local").buildFlow(

    series([

        // TODO BRN: This "clean" task is temporary until we"re not modifying the build so much. This also ensures that
        // old source files are removed. We should figure out a better way of doing that.

        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackNode.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackNode.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{bugpackNode.packageJson.name}}",
                        packageVersion: "{{bugpackNode.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackNode.packageJson.name"),
                            buildProject.getProperty("bugpackNode.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                })
            ]),
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackRegistry.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackRegistry.sourcePaths"),
                        scriptPaths: buildProject.getProperty("bugpackRegistry.scriptPaths"),
                        testPaths: buildProject.getProperty("bugpackRegistry.testPaths")
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{bugpackRegistry.packageJson.name}}",
                        packageVersion: "{{bugpackRegistry.packageJson.version}}"
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath()
                        });
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
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
                        sources: buildProject.getProperty("bugpackWeb.sourcePaths"),
                        outputFile: "{{bugpackWeb.outputFile}}"
                    }
                }),
                parallel([
                    targetTask("s3PutFile", {
                        properties: {
                            file:  "{{bugpackWeb.outputFile}}",
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
                                sources: ["{{bugpackWeb.outputFile}}"],
                                outputFile: "{{bugpackWeb.outputMinFile}}"
                            }
                        }),
                        targetTask("s3PutFile", {
                            properties: {
                                file:  "{{bugpackWeb.outputMinFile}}",
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


// Prod Flow
//-------------------------------------------------------------------------------

buildTarget("prod").buildFlow(

    series([

        // TODO BRN: This "clean" task is temporary until we"re not modifying the build so much. This also ensures that
        // old source files are removed. We should figure out a better way of doing that.

        targetTask("clean"),
        parallel([
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackNode.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackNode.sourcePaths")
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{bugpackNode.packageJson.name}}",
                        packageVersion: "{{bugpackNode.packageJson.version}}"
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackNode.packageJson.name"),
                            buildProject.getProperty("bugpackNode.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: "airbug"
                    }
                })
            ]),
            series([
                targetTask("createNodePackage", {
                    properties: {
                        packageJson: buildProject.getProperty("bugpackRegistry.packageJson"),
                        sourcePaths: buildProject.getProperty("bugpackRegistry.sourcePaths"),
                        scriptPaths: buildProject.getProperty("bugpackRegistry.scriptPaths"),
                        testPaths: buildProject.getProperty("bugpackRegistry.testPaths")
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask("packNodePackage", {
                    properties: {
                        packageName: "{{bugpackRegistry.packageJson.name}}",
                        packageVersion: "{{bugpackRegistry.packageJson.version}}"
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath()
                        });
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("bugpackRegistry.packageJson.name"),
                            buildProject.getProperty("bugpackRegistry.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: "airbug"
                    }
                })
            ]),
            series([
                targetTask("concat", {
                    properties: {
                        sources: buildProject.getProperty("bugpackWeb.sourcePaths"),
                        outputFile: "{{bugpackWeb.outputFile}}"
                    }
                }),
                parallel([
                    targetTask("s3PutFile", {
                        properties: {
                            file:  "{{bugpackWeb.outputFile}}",
                            options: {
                                acl: 'public-read',
                                gzip: true
                            },
                            bucket: "airbug"
                        }
                    }),
                    series([
                        targetTask("uglifyjsMinify", {
                            properties: {
                                sources: ["{{bugpackWeb.outputFile}}"],
                                outputFile: "{{bugpackWeb.outputMinFile}}"
                            }
                        }),
                        targetTask("s3PutFile", {
                            properties: {
                                file:  "{{bugpackWeb.outputMinFile}}",
                                options: {
                                    acl: 'public-read',
                                    gzip: true
                                },
                                bucket: "airbug"
                            }
                        })
                    ])
                ])
            ])
        ])
    ])
);

