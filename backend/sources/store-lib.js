// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var crypto = require ("crypto");
var printf = require ("printf");
var riak = require ("riak-js");

var configuration = require ("./configuration")
var transcript = require ("./transcript") (module);

// ---------------------------------------

function _createConnector (_configuration) {
	return (riak.getClient (_configuration));
}

function _generateFeedKey (_url) {
	return (new crypto.Hash ("md5") .update (_url) .digest ("hex"));
}

function _generateFeedItemKey (_url, _id) {
	return (new crypto.Hash ("md5") .update (_url) .update ("#") .update (_id) .digest ("hex"));
}

function _generateFeedTimelineKey (_url, _sequence) {
	return (new crypto.Hash ("md5") .update (_url) .update ("#") .update (printf ("%08x", _sequence)) .digest ("hex"));
}

function _generateFeedDataKey (_url, _data) {
	return (new crypto.Hash ("md5") .update (_data) .digest ("hex"));
}

function _generateFeedTaskKey (_url, _type) {
	return (new crypto.Hash ("md5") .update (_url) .update ("#") .update (_type) .digest ("hex"));
}

// ---------------------------------------

function _createFeedMetaData (_riak, _key, _callback) {
	var _feedMetaData = {
		key : _key,
		sequence : 0
	};
	_update (_riak, configuration.feedMetaDataBucket, _key, _feedMetaData, {contentType : "application/json"}, _callback);
}

function _fetchFeedMetaData (_riak, _key, _callback) {
	_fetch (_riak, configuration.feedMetaDataBucket, _key, null,
			function (_error, _feedMetaData, _riakMetaData) {
				if (_error !== null)
					if (_feedMetaData === null)
						_createFeedMetaData (_riak, _key, _callback);
					else
						_callback (_error, undefined, undefined);
				else
					_callback (null, _feedMetaData, _riakMetaData);
			});
}

function _updateFeedMetaData (_riak, _key, _feedMetaData, _riakMetaData, _callback) {
	if (_riakMetaData) {
		_riakMetaData.contentType = "application/json";
		_riakMetaData.contentEncoding = undefined;
	}
	_update (_riak, configuration.feedMetaDataBucket, _key, _feedMetaData, _riakMetaData, _callback);
}

// ---------------------------------------

function _createFeedTimeline (_riak, _key, _feedTimeline, _callback) {
	_update (_riak, configuration.feedTimelineBucket, _key, _feedTimeline, {contentType : "application/json"}, _callback);
}

// ---------------------------------------

function _createFeedItem (_riak, _key, _feedItem, _callback) {
	_update (_riak, configuration.feedItemBucket, _key, _feedItem, {contentType : "application/json"}, _callback);
}

// ---------------------------------------

function _fetchFeedData (_riak, _key, _callback) {
	_fetch (_riak, configuration.feedDataBucket, _key, {responseEncoding : "binary"}, _callback);
}

function _updateFeedData (_riak, _key, _feedData, _riakMetaData, _callback) {
	_update (_riak, configuration.feedDataBucket, _key, _feedData, _riakMetaData, _callback);
}

// ---------------------------------------

function _fetchFeedTask (_riak, _key, _callback) {
	_fetch (_riak, configuration.feedTaskBucket, _key, null, _callback);
}

function _updateFeedTask (_riak, _key, _feedTask, _riakMetaData, _callback) {
	if (_riakMetaData) {
		_riakMetaData.contentType = "application/json";
		_riakMetaData.contentEncoding = undefined;
	}
	_update (_riak, configuration.feedTaskBucket, _key, _feedTask, _riakMetaData, _callback);
}

// ---------------------------------------

function _fetch (_riak, _bucket, _key, _riakMetaData, _callback) {
	transcript.traceDebugging ("fetching `%s/%s`...", _bucket, _key);
	_riak.get (_bucket, _key, _riakMetaData,
			function (_error, _value, _riakMetaData) {
				if (_error)
					if ((_riakMetaData !== undefined) && (_riakMetaData.statusCode == 404)) {
						_riakMetaData.contentType = undefined;
						_riakMetaData.contentEncoding = undefined;
						_riakMetaData.contentRange = undefined;
						_riakMetaData.etag = undefined;
						_callback (null, null, _riakMetaData);
					} else {
						transcript.traceWarning ("failed fetching `%s/%s`: %s...", _bucket, _key, _error.toString ());
						_callback ({reason : "unexpected-reak-error", message : _error.toString (), bucket : _bucket, key : _key, riakMetaData : _riakMetaData});
					}
				else {
					transcript.traceDebugging ("succeeded fetching `%s/%s`", _bucket, _key);
					_callback (null, _value, _riakMetaData);
				}
			});
}

function _update (_riak, _bucket, _key, _value, _riakMetaData, _callback) {
	transcript.traceDebugging ("updating `%s/%s`...", _bucket, _key);
	if (_riakMetaData) {
		_riakMetaData.headers = undefined;
		_riakMetaData.etag = undefined;
		_riakMetaData.contentRange = undefined;
	}
	_riak.save (_bucket, _key, _value, _riakMetaData,
			function (_error, _riakMetaData) {
				if (_error) {
					transcript.traceWarning ("failed updating `%s/%s`: %s", _bucket, _key, _error.toString ());
					_callback ({reason : "unexpected-reak-error", message : _error.toString (), bucket : _bucket, key : _key, riakMetaData : _riakMetaData});
				} else {
					transcript.traceDebugging ("succeeded updating `%s/%s`", _bucket, _key);
					_callback (null, _value, _riakMetaData);
				}
			});
}

// ---------------------------------------

module.exports.createConnector = _createConnector;
module.exports.generateFeedKey = _generateFeedKey;
module.exports.generateFeedTimelineKey = _generateFeedTimelineKey;
module.exports.generateFeedItemKey = _generateFeedItemKey;
module.exports.generateFeedDataKey = _generateFeedDataKey;
module.exports.generateFeedTaskKey = _generateFeedTaskKey;
module.exports.fetchFeedMetaData = _fetchFeedMetaData;
module.exports.updateFeedMetaData = _updateFeedMetaData;
module.exports.createFeedTimeline = _createFeedTimeline;
module.exports.createFeedItem = _createFeedItem;
module.exports.fetchFeedData = _fetchFeedData;
module.exports.updateFeedData = _updateFeedData;
module.exports.fetchFeedTask = _fetchFeedTask;
module.exports.updateFeedTask = _updateFeedTask;

// ---------------------------------------
