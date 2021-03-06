// Copyright (c) 2012 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.
/*jshint regexp:false*/

(function() {
	"use strict";

	var jake = require("jake");
	var child_process = require("child_process");
	var http = require("http");
	var fs = require("fs");
	var procfile = require("procfile");
	var serverProcess;

	exports.setUp = function(done) {
		runServer(done);
	};

	exports.tearDown = function(done) {
		if (!serverProcess) return;

		serverProcess.on("exit", function(code, signal) {
			done();
		});
		serverProcess.kill();
	};

	exports.test_canGetHomePage = function(test) {
		httpGet("http://localhost:5000", function(response, receivedData) {
			var foundHomePage = receivedData.indexOf("WeeWikiPaint home page") !== -1;
			test.ok(foundHomePage, "home page should have contained test marker");
			test.done();
		});
	};

	// TODO: Factor out common server name
	exports.test_canGet404Page = function(test) {
		httpGet("http://localhost:5000/nonexistant.html", function(response, receivedData) {
			var foundHomePage = receivedData.indexOf("WeeWikiPaint 404 page") !== -1;
			test.ok(foundHomePage, "404 page should have contained test marker");
			test.done();
		});
	};

	exports.test_userCanDrawOnPage = function(test) {
		var phantomJsProcess = child_process.spawn("node", ["node_modules/phantomjs/bin/phantomjs", "src/_phantomjs.js"], { stdio: "inherit" });
		phantomJsProcess.on("exit", function(code) {
			test.equals(code, 0, "PhantomJS test failures");
			test.done();
		});
	};

	function runServer(callback) {
		var commandLine = parseProcFile();
		serverProcess = child_process.spawn(commandLine.command, commandLine.options, {stdio: ["pipe", "pipe", process.stderr]});
		serverProcess.stdout.setEncoding("utf8");
		serverProcess.stdout.on("data", function(chunk) {
			if (chunk.trim().indexOf("Server started") !== -1) callback();
		});
	}

	function parseProcFile() {
		var fileData = fs.readFileSync("Procfile", "utf8");
		var webCommand = procfile.parse(fileData).web;
		webCommand.options = webCommand.options.map(function(element) {
			if (element === "$PORT") return "5000";
			else return element;
		});
		return webCommand;
	}

	function httpGet(url, callback) {
		var request = http.get(url);
		request.on("response", function(response) {
			var receivedData = "";
			response.setEncoding("utf8");

			response.on("data", function(chunk) {
				receivedData += chunk;
			});
			response.on("end", function() {
				callback(response, receivedData);
			});
		});
	}

}());