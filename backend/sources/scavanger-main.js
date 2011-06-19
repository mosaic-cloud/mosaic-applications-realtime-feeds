// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

// ---------------------------------------

var timers = require ("timers");

var configuration = require ("./configuration");
var indexer = require ("./indexer-lib");
var queue = require ("./queue-lib");
var store = require ("./store-lib");
var transcript = require ("./transcript") (module, "information");

// ---------------------------------------

function _scavange (_context, _callback) {
	var _task = {};
	_task.context = _context;
	_task.callback = _callback;
	_onScavangeStep1 (_task);
}

function _onScavangeStep1 (_task) {
	transcript.traceInformation ("scavanging step 1 (searching stale feeds)...");
	_task.context.riak
			.add (configuration.feedTaskBucket)
			.map (
					function (_values, _key, _argument) {
						var _value = Riak.mapValuesJson (_values) [0];
						delete _value.outcome;
						if (_value.type !== "fetch-data")
							return ([]);
						if ((typeof (_value.currentTimestamp) != "number") || (typeof (_value.updatedTimestamp) != "number"))
							return ([]);
						var _now = new Date () .getTime ();
						var _fetchAge = _now - _value.currentTimestamp;
						var _staleAge = _value.currentTimestamp - _value.updatedTimestamp;
						var _fetch = null;
						if ((_fetch === null) && (_fetchAge <= (6 * 1000)))
							_fetch = false;
						if ((_fetch === null) && (_fetchAge >= (30 * 1000)))
							_fetch = true;
						if ((_fetch === null) && (_staleAge >= (_fetchAge / 4)))
							_fetch = true;
						if (!_fetch)
							return ([]);
						return ([_value.url]);
					})
			.run (
					function (_error, _urls) {
						if (_error) {
							_task.error = {reason : "unexpected-riak-error", message : _error.toString ()};
							_onScavangeError (_task);
						} else
							_onScavangeStep2 (_task, _urls);
					});
}

function _onScavangeStep2 (_task, _urls) {
	transcript.traceInformation ("scavanging step 2 (sending fetch tasks)...");
	if ((_task.context.fetchBatchPublisher !== undefined) && (_task.context.fetchBatchPublisher._ready)) {
		for (var _urlIndex in _urls) {
			var _url = _urls[_urlIndex];
			transcript.traceInformation ("sending fetch task for `%s`...", _url);
			_task.context.fetchBatchPublisher.publish ({url : _url});
		}
	}
	transcript.traceInformation ("succeeded scavanging");
	_task.callback (null);
}

function _onSravangeError (_task) {
	transcript.traceWarningObject ("failed scavanging", _task.error);
	_task.callback (_task.error);
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
				
				transcript.traceInformation ("scavanger initializing...");
				
				_context.fetchUrgentPublisher = _context.rabbit.createPublisher (
						configuration.fetchTaskUrgentPublisher, configuration.fetchTaskExchange);
				_context.fetchBatchPublisher = _context.rabbit.createPublisher (
						configuration.fetchTaskBatchPublisher, configuration.fetchTaskExchange);
			});
	
	_context.rabbit.on ("error",
			function (_error) {
				transcript.traceErrorObject (_error);
				process.exit (1);
			});
	
	function _onScavange () {
		_scavange (_context,
				function () {
					timers.setTimeout (_onScavange, configuration.scavangeInterval);
				});
	}
	
	_onScavange ();
}

_main ();

// ---------------------------------------
