// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var libxmljs = require ("libxmljs");

// ---------------------------------------

function _parse (_data, _contentType, _callback__) {
	
	var _callback = function (_error, _timeline) {
		if (_callback__ !== null) {
			_callback__ (_error, _timeline);
			_callback__ = null;
		}
	}
	
	if ((_contentType != "application/atom+xml; charset=utf-8") && (_contentType != "application/atom+xml")) {
		_callback ({reason : "unexpected-content-type", contentType : _contentType}, undefined);
		return;
	}
	
	var _timeline = {
		id : null,
		url : null,
		timestamp : null,
		items : []
	};
	var _items = _timeline["items"];
	var _item = null;
	
	var _handleDocumentStart = function () {
		return ("waiting-feed");
	};
	
	var _handleDocumentEnd = function (_state) {
		if (_state != "waiting-end") {
			_handleFail (_state, "end-document");
			return;
		}
		_callback (null, _timeline);
	};
	
	var _handleElementStart = function (_state, _element, _attributes, _prefix, _uri, _namespaces) {
		switch (_state) {
			case "waiting-feed" :
				if ((_element.length == 1) && (_element[0] == "feed") && (_uri[0] == "http://www.w3.org/2005/Atom"))
					return ("waiting-entry");
				break;
			case "waiting-entry" :
				if ((_element.length == 2) && (_element[0] == "entry") && (_uri[0] == "http://www.w3.org/2005/Atom")) {
					_item = {};
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
							if (_item[_linkKey] === undefined)
								_item[_linkKey] = [];
							_item[_linkKey].push (_linkHref);
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
					if (_item != {}) {
						_items.push (_item);
						_item = null;
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
								_timeline["id"] = _text;
								return (_state);
							}
							break;
						case "updated" :
							if (_text.length > 0) {
								_timeline["timestamp"] = new Date (_text) .getTime ();
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
								_item["id"] = _text;
								return (_state);
							}
							break;
						case "title" :
							var _titleType = _getAttribute (_attributes[0], "type", "text");
							if ((_text.length > 0) && ((_titleType == "text") || (_textType == "html"))) {
								_item["title"] = _text;
								_item["title:type"] = _titleType;
								return (_state);
							}
							break;
						case "content" :
							var _contentType = _getAttribute (_attributes[0], "type", "text");
							if ((_text.length > 0) && ((_contentType == "text") || (_contentType == "html"))) {
								_item["content"] = _text;
								_item["content:type"] = _contentType;
							}
							return (_state);
							break;
						case "updated" :
							if (_text.length > 0) {
								_item["timestamp"] = new Date (_text) .getTime ();
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
								_item["author:name"] = _text;
								return (_state);
							}
							break;
						case "author:email" :
							if (_text.length > 0) {
								_item["author:email"] = _text;
								return (_state);
							}
							break;
						case "author:uri" :
							if (_text.length > 0) {
								_item["author:uri"] = _text;
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
		_callback ({reason : "unexpected-parser-event", event : _event, state : _state});
	};
	
	var _getAttribute = function (_attributes, _name, _default) {
		for (var _index in _attributes) {
			var _attribute = _attributes[_index];
			if (_attribute[0] == _name)
				return (_attribute[3]);
		}
		return (_default);
	};
	
	var _parser = new libxmljs.SaxParser (function (_parser) {
		
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
		
		_parser.onEndDocument (function () {
			_handleDocumentEnd (_state);
		});
		
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
			_callback ({reason : "unexpected-xml-parsing-error", message : _message});
		});
		
		_parser.onError (function (_message) {
			_callback ({reason : "unexpected-xml-parsing-error", message : _message});
		});
	});
	
	_parser.parseString (_data.toString ());
}

// ---------------------------------------

module.exports.parse = _parse;

// ---------------------------------------
