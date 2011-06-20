// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

// ---------------------------------------

var fs = require ("fs");
var timers = require ("timers");

var configuration = require ("./configuration");
var queue = require ("./queue-lib");
var transcript = require ("./transcript") (module);

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
				_context.publisher.on ("ready", _onPush);
			});
	
	function _onPush () {
		var _url = _context.urls.pop ();
		if (_url === undefined) {
			_context.rabbit.destroy ();
			return;
		}
		_url = _url.trim ();
		if (_url != "") {
			transcript.traceInformation ("pushing `%s`...", _url);
			_context.publisher.publish ({url : _url});
			if (configuration.pusherInterval > 0)
				timers.setTimeout (_onPush, configuration.pusherInterval);
			else
				process.nextTick (_onPush);
		} else
			_onPush ();
	}
}

_main ();

// ---------------------------------------
