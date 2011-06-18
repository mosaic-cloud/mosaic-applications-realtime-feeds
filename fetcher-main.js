// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

// ---------------------------------------

var printf = require ("printf");
var timers = require ("timers");

var configuration = require ("./configuration");
var fetcher = require ("./fetcher-lib");
var queue = require ("./queue-lib");
var store = require ("./store-lib");
var transcript = require ("./transcript") (module, "warning");

// ---------------------------------------

function _onFetchTaskMessage (_context, _message, _callback) {
	var _url = _message.url;
	var _urlClass = _message.urlClass;
	if ((_url === undefined) || (_urlClass === undefined)) {
		transcript.traceWarningObject ("received invalid urgent fetch message; ignoring!", _message);
		_callback ();
		return;
	}
	_onFetchTask (_context, _url, _urlClass, _callback);
}

function _onFetchTask (_context, _url, _urlClass, _callback) {
	transcript.traceInformation ("fetching `%s` (`%s`)...", _url, _urlClass);
	fetcher.fetch (_url, _context,
			function (_error, _outcome) {
				if (_error !== null)
					transcript.traceWarning ("failed fetching `%s`; ignoring!", _url);
				else
					_onFetchTaskSucceeded (_context, _url, _urlClass, _outcome);
				_callback ();
			});
}

function _onFetchTaskSucceeded (_context, _url, _urlClass, _outcome) {
	if (_outcome.currentData != _outcome.previousData) {
		transcript.traceInformation ("succeeded fetching `%s` (new data found); sending index task...", _url);
		var _message = {
				url : _url,
				urlClass : _urlClass,
				data : _outcome.currentData,
		};
		switch (_urlClass) {
			case null :
				break;
			case "urgent" :
				if ((_context.indexUrgentPublisher !== undefined) && (_context.indexUrgentPublisher._ready))
					_context.indexUrgentPublisher.publish (_message);
				else
					transcript.traceWarning ("failed pushing urgent index task; ignoring!");
				break;
			case "batch" :
				if ((_context.indexBatchPublisher !== undefined) && (_context.indexBatchPublisher._ready))
					_context.indexBatchPublisher.publish (_message);
				else
					transcript.traceWarning ("failed pushing batch index task; ignoring!");
				break;
			default :
				transcript.traceError ("invalid URL class `%s`; ignoring!", _urlClass);
				break;
		}
	} else
		transcript.traceInformation ("succeeded fetching `%s` (no new data found)", _url);
}

// ---------------------------------------

function _main () {
	
	if (process.argv.length != 2) {
		console.log ("error: invalid arguments");
		process.exit (1);
		return;
	}
	
	var _context = {};
	_context.riak = store.createConnector (configuration.riak);
	_context.rabbit = queue.createConnector (configuration.rabbit);
	
	_context.rabbit.on ("ready",
			function () {
				
				transcript.traceInformation ("fetcher initializing...");
				
				_context.fetchUrgentConsumer = _context.rabbit.createConsumer (
						{noAck : true}, configuration.fetchTaskUrgentQueue, configuration.fetchTaskUrgentBinding, configuration.fetchTaskExchange);
				_context.fetchUrgentConsumer.on ("consume",
						function (_message, _headers) {
							if (_message.urlClass === undefined)
								_message.urlClass = "urgent";
							_onFetchTaskMessage (_context, _message,
									function () {
										_context.fetchUrgentConsumer.acknowledge ();
									});
						});
				
				_context.fetchBatchConsumer = _context.rabbit.createConsumer (
						{noAck : true}, configuration.fetchTaskBatchQueue, configuration.fetchTaskBatchBinding, configuration.fetchTaskExchange);
				_context.fetchBatchConsumer.on ("consume",
						function (_message, _headers) {
							if (_message.urlClass === undefined)
								_message.urlClass = "batch";
							_onFetchTaskMessage (_context, _message,
									function () {
										_context.fetchBatchConsumer.acknowledge ();
									});
						});
				
				_context.indexUrgentPublisher = _context.rabbit.createPublisher (
						{routingKey : configuration.indexTaskUrgentRoutingKey}, configuration.indexTaskExchange);
				_context.indexBatchPublisher = _context.rabbit.createPublisher (
						{routingKey : configuration.indexTaskBatchRoutingKey}, configuration.indexTaskExchange);
			});
	
	_context.rabbit.on ("error",
			function (_error) {
				transcript.traceErrorObject (_error);
				process.exit (1);
			});
	
	_context.rabbit.on ("ready",
			function () {
				_context.fetchBatchPublisher = _context.rabbit.createPublisher (
						{routingKey : configuration.fetchTaskBatchRoutingKey}, configuration.fetchTaskExchange);
				_context.fetchBatchPublisher.on ("ready",
						function () {
							timers.setInterval (
									function () {
										for (var _index in configuration.feedTestUrls) {
											var _url = configuration.feedTestUrls[_index];
											transcript.traceDebugging ("sending fetch task for `%s`...", _url);
											_context.fetchBatchPublisher.publish ({url : _url});
										}
									}, 1000);
						});
			});
}

_main ();

// ---------------------------------------
