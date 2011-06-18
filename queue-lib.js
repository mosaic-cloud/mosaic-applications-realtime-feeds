// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var amqp = require ("amqp");
var events = require ("events");
var sys = require ("sys");

var transcript = require ("./transcript") (module);

// ---------------------------------------

var Connector = function (_configuration) {
	events.EventEmitter.call (this);
	this._connection = amqp.createConnection (_configuration);
	this._connection.on ("connect", _boundedMethod (this, this._onConnect));
	this._connection.on ("ready", _boundedMethod (this, this._onReady));
	this._connection.on ("close", _boundedMethod (this, this._onClose));
	this._connection.on ("error", _boundedMethod (this, this._onError));
};

sys.inherits (Connector, events.EventEmitter);

Connector.prototype.createConsumer = function (_consumerConfiguration, _queueConfiguration, _bindingConfiguration, _exchangeConfiguration) {
	var _this = this;
	
	if (_consumerConfiguration === null)
		_consumerConfiguration = {ack : false};
	else if (typeof (_consumerConfiguration) === "boolean")
		_consumerConfiguration = {noAck : _consumerConfiguration};
	else if (typeof (_consumerConfiguration) !== "object")
		throw (new Error ("consumer configuration is mandatory either a boolean or a dictionary"));
	
	if ((_queueConfiguration === null) && (_bindingConfiguration !== undefined))
		_queueConfiguration = {name : "", exclusive : true, autoDelete : true};
	else if (typeof (_queueConfiguration) === "string")
		_queueConfiguration = {name : _queueConfiguration};
	else if (typeof (_queueConfiguration) !== "object")
		throw (new Error ("queue configuration is mandatory either a string or a dictionary"));
	
	if ((typeof (_bindingConfiguration) === "string") && (_exchangeConfiguration !== undefined))
		_bindingConfiguration = {routingKey : _bindingConfiguration};
	else if ((_bindingConfiguration !== undefined) && (typeof (_bindingConfiguration) !== "object"))
		throw (new Error ("binding configuration is optionally a dictionary"));
	
	if (typeof (_exchangeConfiguration) === "string")
		_exchangeConfiguration = {name : _exchangeConfiguration};
	else if ((_exchangeConfiguration !== undefined) && (typeof (_exchangeConfiguration) !== "object"))
		throw (new Error ("exchange configuration is optionally either a string or a dictionary"));
	
	if ((_exchangeConfiguration !== undefined) && (_bindingConfiguration === undefined))
		throw (new Error ("exchange configuration implies binding configuration"));
	
	var _consumer = new events.EventEmitter ();
	_consumer._consumerConfiguration = _consumerConfiguration;
	_consumer._queueConfiguration = _queueConfiguration;
	_consumer._bindingConfiguration = _bindingConfiguration;
	_consumer._exchangeConfiguration = _exchangeConfiguration;
	_consumer._ready = false;
	
	_this._connection.on ("error", function (_error) {
		_consumer._ready = false;
		_consumer.emit ("error", _error);
	});
	
	var _declareQueue = function () {
		_consumer._queue = _this._connection.queue (_consumer._queueConfiguration.name,
				{passive : _consumer._queueConfiguration.passive, durable : _consumer._queueConfiguration.durable,
						exclusive : _consumer._queueConfiguration.exclusive, autoDelete : _consumer._queueConfiguration.autoDelete},
				function (_queueName, _messagesCount, _consumersCount) {
					_consumer._queueName = _queueName;
					if (_consumer._exchangeConfiguration !== undefined)
						_declareExchange ();
					else if (_consumer._bindingConfiguration !== undefined)
						_bindQueue ();
					else
						_subscribeQueue ();
				});
	};
	
	var _declareExchange = function () {
		_consumer._exchange = _this._connection.exchange (_consumer._exchangeConfiguration.name,
				{type : _consumer._exchangeConfiguration.type, passive : _consumer._exchangeConfiguration.passive,
						durable : _consumer._exchangeConfiguration.durable, autoDelete : _consumer._exchangeConfiguration.autoDelete},
				function () { _bindQueue (); });
	};
	
	var _bindQueue = function () {
		var _exchangeName = _consumer._bindingConfiguration.exchange;
		if (_exchangeName === undefined)
			_exchangeName = _consumer._exchangeConfiguration.name;
		_consumer._queue.bind (_exchangeName, _consumer._bindingConfiguration.routingKey);
		_consumer._queue.on ("queueBindOk", function () { _subscribeQueue (); });
	};
	
	var _subscribeQueue = function () {
		_consumer._queue.subscribeRaw (
				{ack : _consumer._consumerConfiguration.noAck, prefetchCount : _consumer._consumerConfiguration.prefetchCount},
				_consume);
		_consumer._queue.on ("basicConsumeOk", function () {
			_consumer._ready = true;
			_consumer.emit ("ready");
		});
	};
	
	var _consume = function (_message) {
		
		var _buffers = [];
		
		var _acknowledge = function () {
			_message.acknowledge ();
		}
		
		var _dispatch = function (_data) {
			var _headers = {};
			var _value = _message.data;
			if (_message.contentType == "application/json")
				try {
					_value = JSON.parse (_value);
				} catch (_error) {
					_message.contentType = "application/json-invalid";
				}
			_headers.contentType = _message.contentType;
			_consumer.emit ("consume", _value, _headers, _acknowledge);
		}
		
		_message.on ("data",
				function (_data) {
					_buffers.push (_data);
				});
		
		_message.on ("end",
				function () {
					var _bufferSize = 0;
					for (var _bufferIndex in _buffers)
						_bufferSize += _buffers[_bufferIndex].length;
					var _buffer = new Buffer (_bufferSize);
					var _bufferOffset = 0;
					for (var _bufferIndex in _buffers) {
						var _bufferItem = _buffers[_bufferIndex];
						_bufferItem.copy (_buffer, _bufferOffset);
						_bufferOffset += _bufferItem.length;
					}
					_message.data = _buffer;
					_dispatch ();
				});
	};
	
	_declareQueue ();
	
	return (_consumer);
};

Connector.prototype.createPublisher = function (_publisherConfiguration, _exchangeConfiguration) {
	var _this = this;
	
	if (_publisherConfiguration === null)
		_publisherConfiguration = {};
	else if (typeof (_publisherConfiguration) !== "object")
		throw (new Error ("publisher configuration is mandatory a dictionary"));
	
	if (typeof (_exchangeConfiguration) === "string")
		_exchangeConfiguration = {name : _exchangeConfiguration};
	else if (typeof (_exchangeConfiguration) !== "object")
		throw (new Error ("exchange configuration is mandatory either a string or a dictionary"));
	
	var _publisher = new events.EventEmitter ();
	_publisher._publisherConfiguration = _publisherConfiguration;
	_publisher._exchangeConfiguration = _exchangeConfiguration;
	_publisher._ready = false;
	
	_this._connection.on ("error", function (_error) {
		_publisher._ready = false;
		_publisher.emit ("error", _error);
	});
	
	_publisher.publish = function (_message, _routingKey, _options) {
		if (!_publisher._ready)
			throw (new Error ("publisher not ready"));
		if (_routingKey === undefined)
			_routingKey = _publisher._publisherConfiguration.routingKey;
		if (typeof (_routingKey) != "string")
			throw (new Error ("routing key is mandatory a string"));
		var _mergedOptions = {};
		if (_options !== undefined)
			for (var _optionName in _options)
				_mergedOptions[_optionName] = _options[_optionName];
		for (var _optionName in _publisher._publisherConfiguration)
			if (_mergedOptions[_optionName] === undefined)
				_mergedOptions[_optionName] = _publisher._publisherConfiguration[_optionName];
		if ((typeof (_message) != "string") && !(_message instanceof Buffer)) {
			_message = JSON.stringify (_message);
			if (_mergedOptions.contentType === undefined)
				_mergedOptions.contentType = "application/json";
		}
		_publisher._exchange.publish (_routingKey, _message, _mergedOptions);
	};
	
	var _declareExchange = function () {
		_publisher._exchange = _this._connection.exchange (_publisher._exchangeConfiguration.name,
				{type : _publisher._exchangeConfiguration.type, passive : _publisher._exchangeConfiguration.passive,
						durable : _publisher._exchangeConfiguration.durable, autoDelete : _publisher._exchangeConfiguration.autoDelete});
		_publisher._exchange.on ("open", function () {
			_publisher._ready = true;
			_publisher.emit ("ready");
		});
	};
	
	_declareExchange ();
	
	return (_publisher);
};

Connector.prototype._onConnect = function () {
	this.emit ("connect");
};

Connector.prototype._onReady = function () {
	this.emit ("ready");
};

Connector.prototype._onClose = function (_failed) {
	this.emit ("closed");
};

Connector.prototype._onError = function (_error) {
	this.emit ("error", _error);
};

// ---------------------------------------

function _boundedMethod (_this, _function) {
	if (_this === undefined)
		throw (new Error ());
	if (_function === undefined)
		throw (new Error ());
	return (function () {
		return (_function.apply (_this, arguments));
	});
};

// ---------------------------------------

module.exports.createConnector = function (_configuration) {
	return (new Connector (_configuration));
};

// ---------------------------------------
