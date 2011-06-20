// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

// ---------------------------------------

var timers = require ("timers");

// ---------------------------------------

var component = require ("./component-lib");
var configuration = require ("./configuration");
var transcript = require ("./transcript") (module, configuration.mainTranscriptLevel);

// ---------------------------------------

var _component = null;

function _onTerminate () {
	transcript.traceWarning ("terminating...");
	process.exit (0);
	return;
}

function _onCall (_operation, _correlation, _inputs, _data) {
	transcript.traceWarningObject ("received invalid call request `%s`; ignoring!", _operation, _inputs);
	_component.callReturn (_correlation, false, "invalid-request", "");
}

function _onCast (_operation, _inputs, _data) {
	transcript.traceWarningObject ("received invalid cast request `%s`; ignoring!", _operation, _inputs);
}

function _onCallReturn (_correlation, _ok, _outputsOrError, _data) {
	transcript.traceWarningObject ("received invalid call-return; ignoring!");
}

// ---------------------------------------

function _main () {
	
	if (process.argv.length != 3) {
		transcript.traceError ("invalid arguments; aborting!");
		process.exit (1);
		return;
	}
	var _module = process.argv[2];
	process.argv = [process.argv[0], process.argv[1]];
	
	switch (_module) {
		case "fetcher" :
		case "indexer" :
		case "scavanger" :
		case "leacher" :
		case "pusher" :
			_module = "./" + _module + "-main";
			break;
		default :
			_module = undefined;
			transcript.traceError ("invalid module; aborting!");
			process.exit (1);
			return;
	}
	
	_module = require (_module);
	
	if (process.env["mosaic_component_identifier"] === undefined) {
		process.nextTick (_module.main);
		return;
	}
	
	_component = component.initialize ();
	
	var _rabbitResolveCorrelation = component.generateCorrelation ();
	var _riakResolveCorrelation = component.generateCorrelation ();
	
	_component.on ("error",
			function (_error) {
				transcript.traceError ("unexpected error: %s; aborting!", _error.toString ());
				process.exit (1);
			});
	
	_component.on ("call", _onCall);
	_component.on ("cast", _onCast);
	
	_component.on ("callReturn",
			function (_correlation, _ok, _outputsOrError, _data) {
				if ((_correlation != _rabbitResolveCorrelation) && (_correlation != _riakResolveCorrelation))
					return (_onCallReturn (_correlation, _ok, _outputsOrError, _data));
				if (!_ok) {
					transcript.traceErrorObject ("failed resolving required resources (error); aborting!", _outputsOrError);
					process.exit (1);
					return;
				}
				var _outputs = _outputsOrError;
				var _ip = _outputs.ip;
				var _port = _outputs.port;
				if (_correlation == _rabbitResolveCorrelation) {
					transcript.traceInformation ("revolved Rabbit on `%s:%d`", _ip, _port);
					configuration.rabbit.host = _ip;
					configuration.rabbit.port = _port;
					_rabbitResolveCorrelation = null;
				} else if (_correlation == _riakResolveCorrelation) {
					transcript.traceInformation ("revolved Riak on `%s:%d`", _ip, _port);
					configuration.riak.host = _ip;
					configuration.riak.port = _port;
					_riakResolveCorrelation = null;
				} else
					throw (new Error ());
				if ((_rabbitResolveCorrelation == null) && (_riakResolveCorrelation == null))
					process.nextTick (_module.main);
			});
	
	_component.call (configuration.rabbitGroup, "mosaic-rabbitmq:get-broker-endpoint", _rabbitResolveCorrelation, null, "");
	_component.call (configuration.riakGroup, "mosaic-riak-kv:get-store-http-endpoint", _riakResolveCorrelation, null, "");
	
	timers.setTimeout (
			function () {
				if ((_rabbitResolveCorrelation !== null) || (_riakResolveCorrelation !== null)) {
					transcript.traceError ("failed resolving required resources (timeout); aborting!");
					process.exit (1);
				}
			}, 120 * 1000);
}

_main ();

// ---------------------------------------
