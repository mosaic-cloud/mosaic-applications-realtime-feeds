// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var _riak = {
		host : "127.0.0.1",
		port : 24637,
};

var _rabbit = {
		host : "127.0.0.1",
		port : 21688,
};

module.exports.riak = _riak;
module.exports.rabbit = _rabbit;

// ---------------------------------------

var _taskUrgentPrefetchCount = 1;
var _taskBatchPrefetchCount = 16;

// ---------------------------------------

var _fetchTaskExchange = {
		type : "topic",
		name : "feeds.fetch-data",
		durable : true,
		autoDelete : false,
		passive : false,
};

var _fetchTaskUrgentQueue = {
		name : _fetchTaskExchange.name + ".urgent",
		durable : _fetchTaskExchange.durable,
		exclusive : false,
		autoDelete : _fetchTaskExchange.autoDelete,
		passive : _fetchTaskExchange.passive,
};

var _fetchTaskBatchQueue = {
		name : _fetchTaskExchange.name + ".batch",
		durable : _fetchTaskExchange.durable,
		exclusive : false,
		autoDelete : _fetchTaskExchange.autoDelete,
		passive : _fetchTaskExchange.passive,
};

var _fetchTaskUrgentRoutingKey = "urgent";
var _fetchTaskBatchRoutingKey = "batch";

var _fetchTaskUrgentBinding = {
		exchange : _fetchTaskExchange.name,
		routingKey : _fetchTaskUrgentRoutingKey,
};

var _fetchTaskBatchBinding = {
		exchange : _fetchTaskExchange.name,
		routingKey : _fetchTaskBatchRoutingKey,
};

var _fetchTaskUrgentConsumer = {
		noAck : true,
		prefetchCount : _taskUrgentPrefetchCount,
};

var _fetchTaskBatchConsumer = {
		noAck : true,
		prefetchCount : _taskBatchPrefetchCount,
};

var _fetchTaskUrgentPublisher = {
		routingKey : _fetchTaskUrgentRoutingKey,
};

var _fetchTaskBatchPublisher = {
		routingKey : _fetchTaskBatchRoutingKey,
};

module.exports.fetchTaskExchange = _fetchTaskExchange;
module.exports.fetchTaskUrgentQueue = _fetchTaskUrgentQueue;
module.exports.fetchTaskUrgentRoutingKey = _fetchTaskUrgentRoutingKey;
module.exports.fetchTaskUrgentBinding = _fetchTaskUrgentBinding;
module.exports.fetchTaskUrgentConsumer = _fetchTaskUrgentConsumer;
module.exports.fetchTaskUrgentPublisher = _fetchTaskUrgentPublisher;
module.exports.fetchTaskBatchQueue = _fetchTaskBatchQueue;
module.exports.fetchTaskBatchRoutingKey = _fetchTaskBatchRoutingKey;
module.exports.fetchTaskBatchBinding = _fetchTaskBatchBinding;
module.exports.fetchTaskBatchConsumer = _fetchTaskBatchConsumer;
module.exports.fetchTaskBatchPublisher = _fetchTaskBatchPublisher;

// ---------------------------------------

var _indexTaskExchange = {
		type : "topic",
		name : "feeds.index-data",
		durable : true,
		autoDelete : false,
		passive : false,
};

var _indexTaskUrgentQueue = {
		name : _indexTaskExchange.name + ".urgent",
		durable : _indexTaskExchange.durable,
		exclusive : false,
		autoDelete : _indexTaskExchange.autoDelete,
		passive : _indexTaskExchange.passive,
};

var _indexTaskBatchQueue = {
		name : _indexTaskExchange.name + ".batch",
		durable : _indexTaskExchange.durable,
		exclusive : false,
		autoDelete : _indexTaskExchange.autoDelete,
		passive : _indexTaskExchange.passive,
};

var _indexTaskUrgentRoutingKey = "urgent";
var _indexTaskBatchRoutingKey = "batch";

var _indexTaskUrgentBinding = {
		exchange : _indexTaskExchange.name,
		routingKey : _indexTaskUrgentRoutingKey,
};

var _indexTaskBatchBinding = {
		exchange : _indexTaskExchange.name,
		routingKey : _indexTaskBatchRoutingKey,
};

var _indexTaskUrgentConsumer = {
		noAck : true,
		prefetchCount : _taskUrgentPrefetchCount,
};

var _indexTaskBatchConsumer = {
		noAck : true,
		prefetchCount : _taskBatchPrefetchCount,
};

var _indexTaskUrgentPublisher = {
		routingKey : _indexTaskUrgentRoutingKey,
};

var _indexTaskBatchPublisher = {
		routingKey : _indexTaskBatchRoutingKey,
};

module.exports.indexTaskExchange = _indexTaskExchange;
module.exports.indexTaskUrgentQueue = _indexTaskUrgentQueue;
module.exports.indexTaskUrgentRoutingKey = _indexTaskUrgentRoutingKey;
module.exports.indexTaskUrgentBinding = _indexTaskUrgentBinding;
module.exports.indexTaskUrgentConsumer = _indexTaskUrgentConsumer;
module.exports.indexTaskUrgentPublisher = _indexTaskUrgentPublisher;
module.exports.indexTaskBatchQueue = _indexTaskBatchQueue;
module.exports.indexTaskBatchRoutingKey = _indexTaskBatchRoutingKey;
module.exports.indexTaskBatchBinding = _indexTaskBatchBinding;
module.exports.indexTaskBatchConsumer = _indexTaskBatchConsumer;
module.exports.indexTaskBatchPublisher = _indexTaskBatchPublisher;

// ---------------------------------------

var _itemExchange = {
		type : "topic",
		name : "feeds.items",
		durable : true,
		autoDelete : false,
		passive : false,
};

module.exports.itemExchange = _itemExchange;

// ---------------------------------------

var _fetchTaskType = "fetch-data";
var _indexTaskType = "index-data";

module.exports.fetchTaskType = _fetchTaskType;
module.exports.indexTaskType = _indexTaskType;

// ---------------------------------------

var _feedMetaDataBucket = "feed-metadata";
var _feedDataBucket = "feed-data";
var _feedTimelineBucket = "feed-timelines";
var _feedItemBucket = "feed-items";
var _feedTaskBucket = "feed-tasks";

module.exports.feedMetaDataBucket = _feedMetaDataBucket;
module.exports.feedDataBucket = _feedDataBucket;
module.exports.feedTimelineBucket = _feedTimelineBucket;
module.exports.feedItemBucket = _feedItemBucket;
module.exports.feedTaskBucket = _feedTaskBucket;

// ---------------------------------------

_feedTestUrls = [
		// "http://feeds.feedburner.com/ThinkFault?format=xml",
		"http://search.twitter.com/search.atom?q=%23nextfriday",
		"http://search.twitter.com/search.atom?q=%23somebodytellmewhy",
		"http://search.twitter.com/search.atom?q=%23howtopleaseahoodrat",
]

module.exports.feedTestUrls = _feedTestUrls;

// ---------------------------------------
