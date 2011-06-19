// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

// ---------------------------------------

var fs = require ("fs");

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
	
	var _urls = fs.readFileSync (process.env["_mosaic_feeds_pusher_urls"], "ascii");
	_urls = _urls.split ("\n");
	
	var _rabbit = queue.createConnector (configuration.rabbit);
	_rabbit.on ("ready",
			function () {
				var _publisher = _rabbit.createPublisher (configuration.fetchTaskUrgentPublisher, configuration.fetchTaskExchange);
				_publisher.on ("ready",
						function () {
							for (var _urlIndex in _urls) {
								var _url = _urls[_urlIndex];
								_url = _url.trim ();
								if (_url != "") {
									transcript.traceInformation ("pushing `%s`...", _url);
									_publisher.publish ({url : _url});
								}
							}
							_rabbit.destroy ();
						});
			});
}

_main ();

// ---------------------------------------
