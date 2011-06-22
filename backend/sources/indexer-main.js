// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var configuration = require ("./configuration");
var indexer = require ("./indexer-lib");
var queue = require ("./queue-lib");
var store = require ("./store-lib");
var transcript = require ("./transcript") (module, configuration.mainTranscriptLevel);

// ---------------------------------------

function _onIndexTaskMessage (_context, _message, _callback) {
	var _url = _message.url;
	var _urlClass = _message.urlClass;
	var _data = _message.data;
	if ((_url === undefined) || (_urlClass === undefined) || (_data === undefined)) {
		transcript.traceWarningObject ("received invalid index message; ignoring!", _message);
		_callback ();
		return;
	}
	_onIndexTask (_context, _url, _urlClass, _data, _callback);
}

function _onIndexTask (_context, _url, _urlClass, _data, _callback) {
	transcript.traceDebugging ("indexing `%s` (`%s`)...", _url, _urlClass);
	indexer.indexData (_url, _data, _context,
			function (_error, _outcome) {
				if (_error !== null)
					transcript.traceWarningObject ("failed indexing `%s`; ignoring!", _url, _error);
				else
					_onIndexTaskSucceeded (_context, _url, _urlClass, _outcome);
				_callback ();
			});
}

function _onIndexTaskSucceeded (_context, _url, _urlClass, _outcome) {
	if (_outcome.items !== null) {
		transcript.traceInformation ("succeeded indexing `%s` (new items found); sending items...", _url);
		if ((_context.itemPublisher !== undefined) && (_context.itemPublisher._ready))
			for (var _itemIndex in _outcome.items) {
				var _item = _outcome.items[_itemIndex];
				_context.itemPublisher.publish (_item, _item.feed);
			}
		else
			transcript.traceWarning ("failed sending item; ignoring!");
	} else
		transcript.traceInformation ("succeeded indexing `%s` (no new items found)", _url);
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
				
				transcript.traceInformation ("indexer initializing...");
				
				_context.indexUrgentConsumer = _context.rabbit.createConsumer (
						configuration.indexTaskUrgentConsumer, configuration.indexTaskUrgentQueue,
						configuration.indexTaskUrgentBinding, configuration.indexTaskExchange);
				_context.indexUrgentConsumer.on ("consume",
						function (_message, _headers, _acknowledge) {
							if (_headers.contentType != "application/json") {
								transcript.traceError ("received invalid index message content type: `%s`; ignoring!", _headers.contentType);
								_acknowledge ();
							} else {
								if (_message.urlClass === undefined)
									_message.urlClass = "urgent";
								_onIndexTaskMessage (_context, _message, _acknowledge);
							}
						});
				
				_context.indexBatchConsumer = _context.rabbit.createConsumer (
						configuration.indexTaskBatchConsumer, configuration.indexTaskBatchQueue,
						configuration.indexTaskBatchBinding, configuration.indexTaskExchange);
				_context.indexBatchConsumer.on ("consume",
						function (_message, _headers, _acknowledge) {
							if (_headers.contentType != "application/json") {
								transcript.traceError ("received invalid index message content type: `%s`; ignoring!", _headers.contentType);
								_acknowledge ();
							} else {
								if (_message.urlClass === undefined)
									_message.urlClass = "batch";
								_onIndexTaskMessage (_context, _message, _acknowledge);
							}
						});
				
				_context.itemPublisher = _context.rabbit.createPublisher (
						null, configuration.itemExchange);
			});
	
	_context.rabbit.on ("error",
			function (_error) {
				transcript.traceErrorObject (_error);
				process.exit (1);
			});
}

module.exports.main = _main;

// ---------------------------------------
