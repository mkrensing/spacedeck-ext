"use strict"
var fs = require("fs");
var path = require("path");
var process = require("process");
var Module = require("module");
const { exec } = require('child_process');
console.log("Starting Spacedeck in ", process.env.NODE_ENV);
// var spacedeck_open_folder = __dirname + "/../../spacedeck-open";
var spacedeck_home = "/app";
var spacedeck_ext_home = "/spacedeck-ext";
var spacedeck_public_folder = spacedeck_home + "/public";
var spacedeck_views_folder = spacedeck_home + "/views";
var spacedeck_routes_folder = spacedeck_home + "/routes";

// Bugfix in Spacedeck. Dort wrid anstelel von "catch" auch "error" genutzt
(function(Promise) {

    var originalCatch = Promise.prototype.catch;
    Promise.prototype.error = function() {
        return originalCatch.apply(this, arguments);
    };

})(Promise);

var originalRequire = Module.prototype.require;
Module.prototype.require = function() {
    return originalRequire.apply(this, arguments);
}

// Anpassung des Konfigurationsverzeichnisses:
process.env.NODE_CONFIG_DIR = spacedeck_home + "/config"

fs.copyFile(__dirname + "/public/javascripts/extension_point.js", spacedeck_public_folder + "/javascripts/extension_point.js", (err)  => {
  if(err) throw err;
  console.log("Extension-Point [extension_point.js] installed!");
});

fs.copyFile(__dirname + "/views/spacedeck.ejs", spacedeck_views_folder + "/spacedeck.ejs", (err)  => {
    if(err) throw err;
    console.log("Extension-Point [spacedeck.ejs] installed!");
  });

fs.copyFile(__dirname + "/routes/proxy.js", spacedeck_routes_folder + "/proxy.js", (err)  => {
    if(err) throw err;
    console.log("Extension-Point [proxy.js] installed!");
});  

fs.readFile(spacedeck_home + "/spacedeck.js", "utf-8", (err, data) => {
    const searchPattern = "app.use('/', require('./routes/root'));"
    const replacedText = "app.use('/', require('./routes/root'));\napp.use('/proxy', require('./routes/proxy.js'));"
    const content = data.replace(searchPattern, replacedText);

    fs.writeFile(spacedeck_home + "/spacedeck.js", content, "utf-8", (err) => {
      if(err) throw err;
      console.log("Proxy [proxy.js] registered.");
      module.paths.push(spacedeck_home);
      process.chdir(spacedeck_home);
      var spacedeckMain = require('spacedeck.js');
      
      console.log("Starting spacedeck.js");
      eval(spacedeckMain);      
    });
});

