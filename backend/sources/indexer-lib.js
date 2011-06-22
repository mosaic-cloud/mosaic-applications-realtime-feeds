// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var configuration = require ("./configuration");
var parser = require ("./parser-lib");
var store = require ("./store-lib");
var transcript = require ("./transcript") (module, configuration.libTranscriptLevel);

// ---------------------------------------

function _indexUrl (_url, _context, _callback) {
	var _task = {};
	_task.url = _url;
	_task.context = _context;
	_task.callback = _callback;
	_doIndexUrlStep1 (_task);
}

function _doIndexUrlStep1 (_task) {
	transcript.traceDebugging ("indexing `%s` (from URL) step 1 (fetching latest fetch task)...", _task.url);
	var _dataTaskKey = store.generateFeedTaskKey (_task.url, _fetchTaskType);
	store.fetchFeedTask (_task.context.riak, _dataTaskKey,
			function (_error, _dataTask, _riakMetaData) {
				if (_error !== null) {
					_task.error = _error;
					_onIndexError (_task);
				} else
					if ((_dataTask !== null) && (_dataTask.currentData !== undefined))
						_indexData (_task.url, _dataTask.currentData, _task.context, _task.callback);
					else {
						_task.error = {reason : "invalid-data-task"};
						_onIndexError (_task);
					}
			});
}

// ---------------------------------------

function _indexData (_url, _dataKey, _context, _callback) {
	var _task = {};
	_task.url = _url;
	_task.dataKey = _dataKey;
	_task.context = _context;
	_task.callback = _callback;
	_doIndexDataStep1 (_task);
}

function _doIndexDataStep1 (_task) {
	transcript.traceDebugging ("indexing `%s` (from data) step 1 (fetching latest data)...", _task.url);
	store.fetchFeedData (_task.context.riak, _task.dataKey,
			function (_error, _data, _riakMetaData) {
				if (_error !== null) {
					_task.error = _error;
					_onIndexError (_task);
				} else {
					_task.data = _data;
					_task.dataContentType = _riakMetaData.contentType;
					_task.dataRiakMetaData = _riakMetaData;
					_doIndexDataStep2 (_task);
				}
			});
}

function _doIndexDataStep2 (_task) {
	transcript.traceDebugging ("indexing `%s` (from data) step 2 (parsing latest data)...", _task.url);
	parser.parse (_task.data, _task.dataContentType,
			function (_error, _feed) {
				if (_error !== null) {
					_task.error = _error;
					_onIndexError (_task);
				} else
					_indexFeed (_task.url, _feed, _task.context, _task.callback);
			});
}

// ---------------------------------------

function _indexFeed (_url, _feed, _context, _callback) {
	var _task = {};
	_task.url = _url;
	_task.feed = _feed;
	_task.context = _context;
	_task.callback = _callback;
	_task.type = configuration.indexTaskType;
	_task.feedKey = store.generateFeedKey (_task.url);
	_task.taskKey = store.generateFeedTaskKey (_task.url, _task.type);
	_doIndexFeedStep1 (_task);
}

function _doIndexFeedStep1 (_task) {
	transcript.traceDebugging ("indexing `%s` step 1 (fetching latest meta-data)...", _task.url);
	store.fetchFeedMetaData (_task.context.riak, _task.feedKey,
			function (_error, _previousMetaData, _riakMetaData) {
				if (_error !== null) {
					_task.error = _error;
					_onIndexError (_task);
				} else {
					_task.previousMetaData = _previousMetaData;
					if ((_task.previousMetaData !== null)
							&& ((_task.previousMetaData.sequence === undefined)
								|| (_task.previousMetaData.timestamp === undefined)
								|| (_task.previousMetaData.timelines === undefined)))
						_task.previousMetaData = null;
					_task.metaDataRiakMetaData = _riakMetaData;
					_doIndexFeedStep2 (_task);
				}
			});
}

function _doIndexFeedStep2 (_task) {
	transcript.traceDebugging ("indexing `%s` step 2 (diff-ing latest feed)...", _task.url);
	
	_task.minItemTimestamp = undefined;
	if (_task.previousMetaData !== null)
		_task.minItemTimestamp = _task.previousMetaData.timestamp;
	if (_task.minItemTimestamp === undefined)
		_task.minItemTimestamp = null;
	_task.maxItemTimestamp = _task.minItemTimestamp;
	_task.currentItems = [];
	
	for (var _itemIndex in _task.feed.items) {
		var _item = _task.feed.items[_itemIndex];
		if ((_task.minItemTimestamp == null) || (_item.timestamp > _task.minItemTimestamp)) {
			_task.currentItems.push (_item);
			if ((_task.maxItemTimestamp == null) || (_item.timestamp > _task.maxItemTimestamp))
				_task.maxItemTimestamp = _item.timestamp;
		}
	}
	
	if (_task.currentItems.length > 0) {
		
		_task.currentMetaData = {};
		_task.currentMetaData.key = _task.feedKey;
		_task.currentMetaData.url = _task.url;
		_task.currentMetaData.feed = _task.feedKey;
		_task.currentMetaData.id = _task.feed.id;
		_task.currentMetaData.timestamp = _task.maxItemTimestamp;
		if (_task.previousMetaData !== null)
			_task.currentMetaData.sequence = _task.previousMetaData.sequence;
		if (_task.currentMetaData.sequence === undefined)
			_task.currentMetaData.sequence = 0;
		_task.currentMetaData.sequence += 1;
		
		_task.currentTimeline = {}
		_task.currentTimeline.key = store.generateFeedTimelineKey (_task.url, _task.currentMetaData.sequence);
		_task.currentTimeline.url = _task.url;
		_task.currentTimeline.feed = _task.feedKey;
		_task.currentTimeline.id = _task.feed.id;
		_task.currentTimeline.timestamp = _task.feed.timestamp;
		_task.currentTimeline.items = [];
		
		for (var _itemIndex in _task.currentItems) {
			var _item = _task.currentItems[_itemIndex];
			_item.key = store.generateFeedItemKey (_task.url, _item.id);
			_item.url = _task.url;
			_item.feed = _task.feedKey;
			_task.currentTimeline.items.push (_item.key);
		}
		
		//if (_task.previousMetaData)
		//	_task.currentMetaData.timelines = _task.previousMetaData.timelines.concat ([_task.currentTimeline.key]);
		//else
			_task.currentMetaData.timelines = [_task.currentTimeline.key];
		transcript.traceOutputObject (_task.currentMetaData);
    
		_doIndexFeedStep3a1 (_task);
		
	} else {
		
		_task.currentItems = null;
		_task.currentMetaData = null;
		_task.currentTimeline = null;
		
		_doIndexFeedStep3b (_task);
	}
}

function _doIndexFeedStep3a1 (_task) {
	transcript.traceDebugging ("indexing `%s` step 3a1 (updating timeline and items)...", _task.url);
	
	for (var _itemIndex in _task.currentItems) {
		var _item = _task.currentItems[_itemIndex];
		store.createFeedItem (_task.context.riak, _item.key, _item, function () {});
	}
	
	store.createFeedTimeline (_task.context.riak, _task.currentTimeline.key, _task.currentTimeline,
			function (_error, _riakMetaData) {
				if (_error !== null) {
					_task.error = _error;
					_onIndexError (_task);
				} else {
					_task.timelineRiakMetaData = _riakMetaData;
					_doIndexFeedStep3a2 (_task);
				}
			});
}

function _doIndexFeedStep3a2 (_task) {
	transcript.traceDebugging ("indexing `%s` step 3a2 (updating meta-data)...", _task.url);
	store.updateFeedMetaData (_task.context.riak, _task.feedKey, _task.currentMetaData, _task.metaDataRiakMetaData,
			function (_error, _riakMetaData) {
				if (_error !== null) {
					_task.error = _error;
					_onIndexError (_task);
				} else {
					_task.metaDataRiakMetaData = _riakMetaData;
					_doIndexFeedStep4 (_task);
				}
			});
}

function _doIndexFeedStep3b (_task) {
	_doIndexFeedStep4 (_task);
}

function _doIndexFeedStep4 (_task) {
	transcript.traceDebugging ("indexing `%s` step 4 (updating index task)...", _task.url);
	_task.currentTaskOutcome = {
		key : _task.taskKey,
		type : _task.type,
		feed : _task.feedKey,
		url : _task.url,
		currentMetaData : _task.currentMetaData,
		previousMetaData : _task.previousMetaData,
		timeline : _task.currentTimeline,
		items : _task.currentItems,
		error : null
	};
	store.updateFeedTask (_task.context.riak, _task.taskKey, _task.currentTaskOutcome, {contentType : "application/json"},
			function (_error, _riakMetaData) {
				if (_error !== null) {
					_task.error = _error;
					_onIndexError (_task);
				} else {
					transcript.traceDebugging ("succeeded indexing `%s`", _task.url);
					_task.taskRiakMetaData = _riakMetaData;
					_task.callback (null, _task.currentTaskOutcome);
				}
			});
}

// ---------------------------------------

function _onIndexError (_task) {
	transcript.traceDebuggingObject ("failed indexing `%s`", _task.url, _task.error);
	_task.callback (_task.error, undefined);
}

// ---------------------------------------

module.exports.indexUrl = _indexUrl;
module.exports.indexData = _indexData;
module.exports.indexFeed = _indexFeed;

// ---------------------------------------
