// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

if (process.argv.length != 3)
	throw (new Error ());

// ---------------------------------------

var configuration = require ("./configuration");
var fs = require ("fs");
var queue = require ("./queue-lib");
var transcript = require ("./transcript") (module);

// ---------------------------------------

function _main () {
	
	var _urls = fs.readFileSync (process.argv[2], "ascii");
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
