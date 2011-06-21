// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var fs = require ("fs");
var timers = require ("timers");

var configuration = require ("./configuration");
var queue = require ("./queue-lib");
var transcript = require ("./transcript") (module, "debugging" || configuration.mainTranscriptLevel);

// ---------------------------------------

function _main () {
	
	if (process.argv.length != 2) {
		transcript.traceError ("invalid arguments; aborting!");
		process.exit (1);
		return;
	}
	
	if (process.env["_mosaic_feeds_pusher_urls"] === undefined) {
		transcript.traceError ("missing environment variable `_mosaic_feeds_pusher_urls`; aborting!");
		process.exit (1);
		return;
	}
	
	var _context = {};
	
	_context.urls = fs.readFileSync (process.env["_mosaic_feeds_pusher_urls"], "ascii") .split ("\n");
	
	_context.rabbit = queue.createConnector (configuration.rabbit);
	_context.rabbit.on ("ready",
			function () {
				_context.publisher = _context.rabbit.createPublisher (
						configuration.fetchTaskPushPublisher, configuration.fetchTaskExchange);
				_context.publisher.on ("ready",
						function () {
							process.nextTick (_onPush);
						});
			});
	
	_context.loopUrls = [];
	_context.loopIndex = 0;
	
	function _onPush () {
		var _url = _context.loopUrls.pop ();
		if (_url === undefined) {
			_context.loopIndex += 1;
			if (_context.loopIndex <= configuration.pusherLoopCount) {
				transcript.traceInformation ("starting push loop...");
				_context.loopUrls = _context.urls.slice ();
				if ((configuration.pusherLoopDelay > 0) && (_context.loopIndex > 1))
					timers.setTimeout (_onPush, configuration.pusherLoopDelay);
				else
					process.nextTick (_onPush);
			} else
				_context.rabbit.destroy ();
		} else {
			_url = _url.trim ();
			if (_url != "") {
				transcript.traceDebugging ("pushing `%s`...", _url);
				_context.publisher.publish ({url : _url});
				if (configuration.pusherPushDelay > 0)
					timers.setTimeout (_onPush, configuration.pusherPushDelay);
				else
					process.nextTick (_onPush);
			} else
				process.nextTick (_onPush);
		}
	}
}

module.exports.main = _main;

// ---------------------------------------
