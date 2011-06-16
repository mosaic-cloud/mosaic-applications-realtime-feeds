

var crypto = require ("crypto");
var http = require ("http");
var libxmljs = require ("libxmljs");
var printf = require ("printf");
var riak = require ("riak-js");
var timers = require ("timers");
var url = require ("url");
var util = require ("util");


function _fetchUrl (_url, _callback) {
	_url = url.parse (_url, false);
	var _options = {
		host : _url.host,
		port : _url.port,
		path : _url.pathname + _url.search,
		headers : {
			"accept" : "application/atom+xml; charset=utf-8"
		}
	};
	var _request = http.get (_options);
	_request.on ("response", function (_response) {
		_callback (_request, _response);
	});
	return (_request);
};


function _parseAtom (_request, _response, _callback__) {
	var _callback = function (_success, _outcome) {
		if (_request !== null) {
			// _request.abort ();
			_request = null;
		}
		if (_callback__ !== null) {
			_callback__ (_success, _outcome);
			_callback__ = null;
		}
	}
	if (_response.statusCode != "200") {
		_callback (false, {reason : "unexpected-status-code", status : _response.statusCode});
		return;
	}
	_contentType = _response.headers["content-type"];
	if ((_contentType != "application/atom+xml; charset=utf-8") && (_contentType != "application/atom+xml")) {
		_callback (false, {reason : "unexpected-content-type", contentType : _contentType});
		return;
	}
	var _feed = {};
	_feed["items"] = [];
	var _feedItems = _feed["items"];
	var _feedItem = null;
	var _handleDocumentStart = function () {
		return ("waiting-feed");
	};
	var _handleDocumentEnd = function (_state) {
		if (_state != "waiting-end") {
			_handleFail (_state, "end-document");
			return;
		}
		_callback (true, _feed);
	};
	var _handleElementStart = function (_state, _element, _attributes, _prefix, _uri, _namespaces) {
		switch (_state) {
			case "waiting-feed" :
				if ((_element.length == 1) && (_element[0] == "feed") && (_uri[0] == "http://www.w3.org/2005/Atom"))
					return ("waiting-entry");
				break;
			case "waiting-entry" :
				if ((_element.length == 2) && (_element[0] == "entry") && (_uri[0] == "http://www.w3.org/2005/Atom")) {
					_feedItem = {};
					return ("parsing-entry");
				} else if (_element.length >= 2)
					return (_state);
				break;
			case "parsing-entry" :
				if ((_element.length == 3) && (_uri[0] == "http://www.w3.org/2005/Atom")) {
					switch (_element[0]) {
						case "link" :
							var _linkRel = _getAttribute (_attributes[0], "rel");
							var _linkHref = _getAttribute (_attributes[0], "href");
							if ((_linkRel === undefined) || (_linkHref === undefined))
								return (_state);
							var _linkKey = "links:" + _linkRel;
							if (_feedItem[_linkKey] === undefined)
								_feedItem[_linkKey] = [];
							_feedItem[_linkKey].push (_linkHref);
							return (_state);
							break;
						default :
							return (_state);
					}
				} else if (_element.length >= 3)
					return (_state);
				break;
		}
		_handleFail (_state, "element-start:" + _element[0]);
	};
	var _handleElementEnd = function (_state, _element, _attributes, _prefix, _uri, _namespaces) {
		switch (_state) {
			case "waiting-entry" :
				if ((_element.length == 1) && (_element[0] == "feed") && (_uri[0] == "http://www.w3.org/2005/Atom"))
					return ("waiting-end");
				else if (_element.length >= 2)
					return (_state);
				break;
			case "parsing-entry" :
				if ((_element.length == 2) && (_element[0] == "entry") && (_uri[0] == "http://www.w3.org/2005/Atom")) {
					if (_feedItem != {}) {
						_feedItems.push (_feedItem);
						_feedItem = null;
					}
					return ("waiting-entry");
				} else if (_element.length >= 2)
					return (_state);
				break;
		}
		_handleFail (_state, "end-element:" + _element[0]);
	};
	var _handleElementText = function (_state, _element, _attributes, _prefix, _uri, _namespaces, _text) {
		_text = _text.trim ();
		switch (_state) {
			case "waiting-entry" :
				if ((_element.length == 2) && (_uri[0] == "http://www.w3.org/2005/Atom"))
					switch (_element[0]) {
						case "id" :
							if (_text.length > 0) {
								_feed["id"] = _text;
								return (_state);
							}
							break;
						case "updated" :
							if (_text.length > 0) {
								_feed["timestamp"] = _text;
								return (_state);
							}
							break;
						default :
							return (_state);
							break;
					}
				else if (_element.length >= 2)
					return (_state);
				break;
			case "parsing-entry" :
				if ((_element.length == 3) && (_uri[0] == "http://www.w3.org/2005/Atom"))
					switch (_element[0]) {
						case "id" :
							if (_text.length > 0) {
								_feedItem["id"] = _text;
								return (_state);
							}
							break;
						case "title" :
							var _titleType = _getAttribute (_attributes[0], "type", "text");
							if ((_text.length > 0) && ((_titleType == "text") || (_textType == "html"))) {
								_feedItem["title"] = _text;
								_feedItem["title:type"] = _titleType;
								return (_state);
							}
							break;
						case "content" :
							var _contentType = _getAttribute (_attributes[0], "type", "text");
							if ((_text.length > 0) && ((_contentType == "text") || (_contentType == "html"))) {
								_feedItem["content"] = _text;
								_feedItem["content:type"] = _contentType;
							}
							return (_state);
							break;
						case "updated" :
							if (_text.length > 0) {
								_feedItem["timestamp"] = _text;
								return (_state);
							}
							break;
						default :
							return (_state);
							break;
					}
				else if ((_element.length == 4) && (_uri[1] == "http://www.w3.org/2005/Atom") && (_uri[0] == "http://www.w3.org/2005/Atom"))
					switch (_element[1] + ":" + _element[0]) {
						case "author:name" :
							if (_text.length > 0) {
								_feedItem["author:name"] = _text;
								return (_state);
							}
							break;
						case "author:email" :
							if (_text.length > 0) {
								_feedItem["author:email"] = _text;
								return (_state);
							}
							break;
						case "author:uri" :
							if (_text.length > 0) {
								_feedItem["author:uri"] = _text;
								return (_state);
							}
							break;
						default :
							return (_state);
							break;
					}
				else if (_element.length >= 3)
					return (_state);
				break;
		}
		if ((_text != null) && (_text.length > 0))
			_handleFail (_state, "element-text:" + _element[0]);
		return (_state);
	};
	var _handleFail = function (_state, _event) {
		_callback (false, {reason : "unexpected-feed-parsing-error", state : _state, event : _event});
	};
	var _getAttribute = function (_attributes, _name, _default) {
		for (var _index in _attributes) {
			var _attribute = _attributes[_index];
			if (_attribute[0] == _name)
				return (_attribute[3]);
		}
		return (_default);
	};
	var _parser = new libxmljs.SaxPushParser (function (_parser) {
		var _state = undefined;
		var _element_stack = null;
		var _attributes_stack = null;
		var _prefix_stack = null;
		var _uri_stack = null;
		var _namespaces_stack = null;
		var _text = null;
		_parser.onStartDocument (function () {
			_element_stack = []; _attributes_stack = []; _prefix_stack = []; _uri_stack = []; _namespaces_stack = [];
			_state = _handleDocumentStart ();
		});
		_parser.onEndDocument (function () {});
		_parser.onStartElementNS (function (_element, _attributes, _prefix, _uri, _namespaces) {
			if (_state === undefined)
				return;
			if (_text !== null) {
				if (_text.length > 0)
					_state = _handleElementText (_state, _element_stack, _attributes_stack, _prefix_stack, _uri_stack, _namespaces_stack, _text.join (''));
				_text = null;
			}
			if (_state === undefined)
				return;
			_element_stack.unshift (_element);
			_attributes_stack.unshift (_attributes);
			_prefix_stack.unshift (_prefix);
			_uri_stack.unshift (_uri);
			_namespaces_stack.unshift (_namespaces);
			_state = _handleElementStart (_state, _element_stack, _attributes_stack, _prefix_stack, _uri_stack, _namespaces_stack);
		});
		_parser.onEndElementNS (function (_element, _prefix, _uri) {
			if (_state === undefined)
				return;
			if (_text !== null) {
				if (_text.length > 0)
					_state = _handleElementText (_state, _element_stack, _attributes_stack, _prefix_stack, _uri_stack, _namespaces_stack, _text.join (''));
				_text = null;
			}
			if (_state === undefined)
				return;
			_state = _handleElementEnd (_state, _element_stack, _attributes_stack, _prefix_stack, _uri_stack, _namespaces_stack);
			_element_stack.shift ();
			_attributes_stack.shift ();
			_prefix_stack.shift ();
			_uri_stack.unshift ();
			_namespaces_stack.unshift ();
			if (_element_stack.length == 0)
				_state = _handleDocumentEnd (_state);
		});
		_parser.onCharacters (function (_data) {
			if (_state === undefined)
				return;
			if (_text === null)
				_text = [];
			_text.push (_data);
		});
		_parser.onCdata (function (_data) {
			if (_state === undefined)
				return;
			if (_text === null)
				_text = [];
			_text.push (_data);
		});
		_parser.onComment (function (_data) {});
		_parser.onWarning (function (_message) {
			_callback (false, {reason : "unexpected-xml-parsing-error", message : _message});
		});
		_parser.onError (function (_message) {
			_callback (false, {reason : "unexpected-xml-parsing-error", message : _message});
		});
	});
	_response.on ("data", function (_data) {
		_parser.push (_data.toString ());
	});
	_response.on ("end", function () {
		_callback (false, {reason : "unexpected-xml-parsing-error", message : "stream ended"});
	});
}


function _hash (_data) {
	var _hasher = new crypto.Hash ("md5");
	_hasher.update (_data);
	return (_hasher.digest ("hex"));
}


function _storeFeed (_timeline, _riak) {
	var _feedKey = _hash (_timeline["url"]);
	_riak.head ("feeds", _feedKey, function (_error, _feed, _feedMetaData) {
		if (_error === undefined)
			_storeFeed_ (_timeline, _riak);
		else {
			var _feed = {
				"sequence" : 0,
				"url" : _timeline["url"]
			}
			_riak.save ("feeds", _feedKey, _feed, {contentType : "application/json"}, function (_error) {
				if (_error === undefined)
					_storeFeed_ (_timeline, _riak);
				else
					console.log (printf ("error -> %s/%s :: %s", "feeds", _feedKey, _error));
			});
		}
	});
}


function _storeFeed_ (_timeline, _riak) {
	var _feedKey = _hash (_timeline["url"]);
	_riak.get ("feeds", _feedKey, {contentType : "application/json"}, function (_error, _feed, _feedMetaData) {
		if (_error === undefined) {
			_feed = JSON.parse (_feed);
			_feed["sequence"] += 1;
			var _feedSequence = _feed["sequence"];
			var _feedTimestamp = _feed["timestamp"];
			if (_feedTimestamp !== undefined)
				_feedTimestamp = new Date (_feedTimestamp);
			var _timelineItems = [];
			var _maxItemTimestamp = undefined;
			for (var _itemIndex in _timeline["items"]) {
				var _item = _timeline["items"][_itemIndex];
				var _itemKey = _hash (printf ("%s:%s", _feedKey, _item["id"]));
				var _itemTimestamp = _item["timestamp"];
				if (_itemTimestamp !== undefined)
					_itemTimestamp = new Date (_itemTimestamp);
				if ((_feedTimestamp === undefined) || (_itemTimestamp === undefined) || (_itemTimestamp > _feedTimestamp)) {
					if (_maxItemTimestamp === undefined)
						_maxItemTimestamp = _itemTimestamp;
					else if (_itemTimestamp > _maxItemTimestamp)
						_maxItemTimestamp = _itemTimestamp;
					_timelineItems.push (_itemKey);
					(function (_item, _itemKey) {
						_item["key"] = _itemKey;
						_timeline["items"][_itemIndex] = _itemKey;
						_riak.save ("feed-items", _itemKey, _item, {contentType : "application/json"}, function (_error) {
							if (_error === undefined)
								console.log (printf ("ok -> %s/%s", "feed-items", _itemKey));
							else
								console.log (printf ("error -> %s/%s :: %s", "feed-items", _itemKey, _error));
						});
					}) (_item, _itemKey);
				}
			}
			if (_timelineItems.length > 0) {
				_feed["timestamp"] = _maxItemTimestamp.toISOString ();
				_riak.save ("feeds", _feedKey, _feed, _feedMetaData, function (_error) {
					if (_error === undefined)
						console.log (printf ("ok -> %s/%s", "feeds", _feedKey));
					else
						console.log (printf ("error -> %s/%s :: %s", "feeds", _feedKey, _error));
				});
				var _timelineKey = _hash (printf ("%s:%08x", _feedKey, _feedSequence));
				_timeline["key"] = _timelineKey;
				_riak.save ("feed-timelines", _timelineKey, _timeline, {contentType : "application/json"}, function (_error) {
					if (_error === undefined)
						console.log (printf ("ok -> %s/%s", "feed-timelines", _timelineKey));
					else
						console.log (printf ("error -> %s/%s :: %s", "feed-timelines", _timelineKey, _error));
				});
			}
		} else
			console.log (printf ("error -> %s/%s :: %s", "feeds", _feedKey, _error));
	});
}


function _failFeed (_error, _riak) {
	console.log (printf ("error -> %s", _error));
}


function _indexFeed (_url, _riak) {
	console.log (printf ("index -> %s", _url));
	_fetchUrl (_url, function (_request, _response) {
		_parseAtom (_request, _response, function (_succeeded, _outcome) {
			if (_succeeded) {
				_outcome["url"] = _url;
				_storeFeed (_outcome, _riak);
			} else {
				_outcome["url"] = _url;
				_failFeed (_outcome, _riak);
			}
		});
	});
}


function _indexLoop (_url, _riak) {
	_indexFeed (_url, _riak);
	timers.setTimeout (_indexLoop, 5 * 1000, _url, _riak);
}


function _main (_urls) {
	_riak = riak.getClient ({host : "127.0.0.1", port : "24637", api : "http", responseEncoding : "binary", debug : false});
	for (var _urlIndex in _urls)
		_indexLoop (_urls[_urlIndex], _riak);
}


if (require.main === module) {
	if (process.argv.length > 2)
		_main (process.argv.splice (2));
	else {
		console.log ("error -> invalid arguments");
		process.exit (1);
	}
}
