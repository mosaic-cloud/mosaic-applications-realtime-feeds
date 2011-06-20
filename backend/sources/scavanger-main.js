// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var timers = require ("timers");

var configuration = require ("./configuration");
var indexer = require ("./indexer-lib");
var queue = require ("./queue-lib");
var store = require ("./store-lib");
var transcript = require ("./transcript") (module, configuration.mainTranscriptLevel);

// ---------------------------------------

function _scavange (_context, _callback) {
	var _task = {};
	_task.context = _context;
	_task.callback = _callback;
	_onScavangeStep1 (_task);
}

function _onScavangeStep1 (_task) {
	transcript.traceDebugging ("scavanging step 1 (searching stale feeds)...");
	_task.context.riak
			.add (configuration.feedTaskBucket)
			.map (
					function (_values, _key, _arguments) {
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
						if ((_fetch === null) && (_fetchAge <= _arguments[0]))
							_fetch = [false, "fetchAge <=", _fetchAge];
						if ((_fetch === null) && (_fetchAge >= _arguments[1]))
							_fetch = [true, "fetchAge >="];
						if ((_fetch === null) && (_staleAge <= (_fetchAge * _arguments[2])))
							_fetch = [true, "updateAge <="];
						if (_fetch === null)
							_fetch = [false, "default"];
						if (_fetch && _fetch[0]) {
							var _outcome = {
									url : _value.url,
									fetch : _fetch[0],
									fetchReason : _fetch[1],
									fetchMetrics : {
											fetchAge : _fetchAge,
											staleAge : _staleAge,
									},
							};
							return ([_outcome]);
						} else
							return ([]);
					},
					[configuration.scavangerMinFetchAge, configuration.scavangerMaxFetchAge, configuration.scavangerMaxStaleAgeMultiplier])
			.run (
					function (_error, _outcomes) {
						if (_error) {
							_task.error = {reason : "unexpected-riak-error", message : _error.toString ()};
							_onScavangeError (_task);
						} else
							_onScavangeStep2 (_task, _outcomes);
					});
}

function _onScavangeStep2 (_task, _outcomes) {
	transcript.traceDebugging ("scavanging step 2 (sending fetch tasks)...");
	var _ignored = _outcomes.length;
	var _pushed = 0;
	if ((_task.context.fetchBatchPublisher !== undefined) && (_task.context.fetchBatchPublisher._ready)) {
		for (var _outcomeIndex in _outcomes) {
			var _outcome = _outcomes[_outcomeIndex];
			if (_outcome.fetch) {
				transcript.traceDebugging ("sending fetch task for `%s` with `%s`...", _outcome.url, _outcome.fetchReason);
				_task.context.fetchBatchPublisher.publish ({url : _outcome.url});
				_pushed++;
				_ignored--;
			} else
				transcript.traceDebugging ("ignoring `%s`...", _outcome.url, _outcome.fetchReason);
		}
	}
	transcript.traceInformation ("succeeded scavanging (pushed %d, ignored %d)", _pushed, _ignored);
	_task.callback (null);
}

function _onScavangeError (_task) {
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
					timers.setTimeout (_onScavange, configuration.scavangerInterval);
				});
	}
	
	_onScavange ();
}

module.exports.main = _main;

// ---------------------------------------
