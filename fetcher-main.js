// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

// ---------------------------------------

var _fetchTaskType = "fetch-data";

// ---------------------------------------

var printf = require ("printf");
var util = require ("util");

var fetcher = require ("./fetcher-lib");
var store = require ("./store-lib");
var transcript = require ("./transcript") (module, "warning");

// ---------------------------------------

function _main () {
	
	if (process.argv.length != 2) {
		console.log ("error: invalid arguments");
		process.exit (1);
		return;
	}
	
	var _context = {
		riak : store.createConnector ("127.0.0.1", 24637)
	};
	
	function _callback (_url, _error, _outcome) {
		if (_error !== null)
			transcript.traceErrorObject ("failed fetching `%s`", _error);
		else
			transcript.traceInformation ("succeeded fetching `%s`", _url);
	}
	
	function _fetch (_url) {
		fetcher.fetch (_url, _context, function (_error, _outcome) { _callback (_url, _error, _outcome); });
	}
	
	_fetch ("http://feeds.feedburner.com/ThinkFault?format=xml");
	_fetch ("http://search.twitter.com/search.atom?q=%23nextfriday");
	_fetch ("http://search.twitter.com/search.atom?q=%23somebodytellmewhy");
}

_main ();

// ---------------------------------------
