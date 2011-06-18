// ---------------------------------------

if (require.main !== module)
	throw (new Error ());

// ---------------------------------------

var printf = require ("printf");
var util = require ("util");

var indexer = require ("./indexer-lib");
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
			transcript.traceErrorObject ("failed indexing `%s`", _url, _error);
		else
			if (_outcome.items !== null) {
				transcript.traceInformation ("succeeded indexing `%s` (new items found)", _url);
				for (var _itemIndex in _outcome.items) {
					var _item = _outcome.items[_itemIndex];
					transcript.traceOutput ("%s", _item.title);
				}
			} else
				transcript.traceInformation ("succeeded indexing `%s` (no new items found)", _url);
	}
	
	function _index (_url) {
		indexer.indexUrl (_url, _context, function (_error, _outcome) { _callback (_url, _error, _outcome); });
	}
	
	_index ("http://search.twitter.com/search.atom?q=%23nextfriday");
	_index ("http://search.twitter.com/search.atom?q=%23somebodytellmewhy");
}

_main ();

// ---------------------------------------
