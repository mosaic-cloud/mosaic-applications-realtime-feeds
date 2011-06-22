// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var timers = require ("timers");

var configuration = require ("./configuration");
var fetcher = require ("./fetcher-lib");
var queue = require ("./queue-lib");
var store = require ("./store-lib");
var transcript = require ("./transcript") (module, configuration.mainTranscriptLevel);

// ---------------------------------------

function _onFetchTaskMessage (_context, _message, _callback) {
	var _url = _message.url;
	var _urlClass = _message.urlClass;
	if ((_url === undefined) || (_urlClass === undefined)) {
		transcript.traceWarningObject ("received invalid fetch message; ignoring!", _message);
		_callback ();
		return;
	}
	_onFetchTask (_context, _url, _urlClass, _callback);
}

function _onFetchTask (_context, _url, _urlClass, _callback) {
	transcript.traceDebugging ("fetching `%s` (`%s`)...", _url, _urlClass);
	fetcher.fetch (_url, _context,
			function (_error, _outcome) {
				if (_error !== null)
					if (_error.reason == "unexpected-status-code")
						if (_error.statusCode != 420)
							transcript.traceWarning ("failed fetching `%s` (status code: %d); ignoring!", _url, _error.statusCode);
						else
							transcript.traceDebugging ("failed fetching `%s` (status code: %d); ignoring!", _url, _error.statusCode);
					else if (_error.reason == "rejected")
						transcript.traceDebugging ("failed fetching `%s` (rejected: %s); ignoring!", _url, _error.cause);
					else
						transcript.traceWarningObject ("failed fetching `%s`; ignoring!", _url, _error);
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
					transcript.traceWarning ("failed sending urgent index task; ignoring!");
				break;
			case "batch" :
			case "push" :
				if ((_context.indexBatchPublisher !== undefined) && (_context.indexBatchPublisher._ready))
					_context.indexBatchPublisher.publish (_message);
				else
					transcript.traceWarning ("failed sending batch index task; ignoring!");
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
		transcript.traceError ("invalid arguments; aborting!");
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
						configuration.fetchTaskUrgentConsumer, configuration.fetchTaskUrgentQueue,
						configuration.fetchTaskUrgentBinding, configuration.fetchTaskExchange);
				_context.fetchUrgentConsumer.on ("consume",
						function (_message, _headers, _acknowledge) {
							if (_headers.contentType != "application/json") {
								transcript.traceError ("received invalid fetch message content type: `%s`; ignoring!", _headers.contentType);
								_acknowledge ();
							} else {
								if (_message.urlClass === undefined)
									_message.urlClass = "urgent";
								_onFetchTaskMessage (_context, _message, _acknowledge);
							}
						});
				
				_context.fetchBatchConsumer = _context.rabbit.createConsumer (
						configuration.fetchTaskBatchConsumer, configuration.fetchTaskBatchQueue,
						configuration.fetchTaskBatchBinding, configuration.fetchTaskExchange);
				_context.fetchBatchConsumer.on ("consume",
						function (_message, _headers, _acknowledge) {
							if (_headers.contentType != "application/json") {
								transcript.traceError ("received invalid fetch message content type: `%s`; ignoring!", _headers.contentType);
								_acknowledge ();
							} else {
								if (_message.urlClass === undefined)
									_message.urlClass = "batch";
								_onFetchTaskMessage (_context, _message, _acknowledge);
							}
						});
				
				_context.fetchPushConsumer = _context.rabbit.createConsumer (
						configuration.fetchTaskPushConsumer, configuration.fetchTaskPushQueue,
						configuration.fetchTaskPushBinding, configuration.fetchTaskExchange);
				_context.fetchPushConsumer.on ("consume",
						function (_message, _headers, _acknowledge) {
							if (_headers.contentType != "application/json") {
								transcript.traceError ("received invalid fetch message content type: `%s`; ignoring!", _headers.contentType);
								_acknowledge ();
							} else {
								if (_message.urlClass === undefined)
									_message.urlClass = "push";
								_onFetchTaskMessage (_context, _message,
										function () {
											if (configuration.fetcherPushDelay > 0)
												timers.setTimeout (_acknowledge, configuration.fetcherPushDelay);
											else
												_acknowledge ();
										});
							}
						});
				
				_context.indexUrgentPublisher = _context.rabbit.createPublisher (
						configuration.indexTaskUrgentPublisher, configuration.indexTaskExchange);
				_context.indexBatchPublisher = _context.rabbit.createPublisher (
						configuration.indexTaskBatchPublisher, configuration.indexTaskExchange);
			});
	
	_context.rabbit.on ("error",
			function (_error) {
				transcript.traceErrorObject (_error);
				process.exit (1);
			});
}

module.exports.main = _main;

// ---------------------------------------
