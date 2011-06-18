// ---------------------------------------

if (require.main === module)
	throw (new Error ());

// ---------------------------------------

var _debuggingLevel = 1;
var _informationLevel = 2;
var _warningLevel = 3;
var _errorLevel = 4;
var _defaultLevel = _informationLevel;

var _levels = {
	"default" : _defaultLevel,
	"debugging" : _debuggingLevel,
	"information" : _informationLevel,
	"warning" : _warningLevel,
	"error" : _errorLevel,
};

var _slugs = {
	"unknown" : "[??]",
	"debugging" : "[dd]",
	"information" : "[ii]",
	"warning" : "[ww]",
	"error" : "[ee]",
	"output" : "[>>]",
	"delimiter" : "[--]",
}

// ---------------------------------------

var path = require ("path");
var printf = require ("printf");
var util = require ("util");

// ---------------------------------------

function _create (_owner, _level) {
	_level = _levels[_level];
	if (_level === undefined)
		_level = _levels["default"];
	return (new _Transcript (_owner, _level));
}

function _Transcript (_owner, _level) {
	if ((_owner === undefined) || (_owner === null) || (typeof (_owner.filename) != "string"))
		throw (new Error ("invalid transcript owner"));
	this._identifier = path.basename (_owner.filename);
	this._level = _level;
}

_Transcript.prototype.traceDebugging = function () {
	if (this._level <= _debuggingLevel)
		_traceMessage.call (this, "debugging", arguments);
}

_Transcript.prototype.traceDebuggingObject = function () {
	if (this._level <= _debuggingLevel)
		_traceObject.call (this, "debugging", arguments);
}

_Transcript.prototype.traceInformation = function () {
	if (this._level <= _informationLevel)
		_traceMessage.call (this, "information", arguments);
}

_Transcript.prototype.traceInformationObject = function () {
	if (this._level <= _informationLevel)
		_traceObject.call (this, "information", arguments);
}

_Transcript.prototype.traceWarning = function () {
	if (this._level <= _warningLevel)
		_traceMessage.call (this, "warning", arguments);
}

_Transcript.prototype.traceWarningObject = function () {
	if (this._level <= _warningLevel)
		_traceObject.call (this, "warning", arguments);
}

_Transcript.prototype.traceError = function () {
	if (this._level <= _errorLevel)
		_traceMessage.call (this, "error", arguments);
}

_Transcript.prototype.traceErrorObject = function () {
	if (this._level <= _errorLevel)
		_traceObject.call (this, "error", arguments);
}

_Transcript.prototype.traceOutput = function () {
	_traceMessage.call (this, "output", arguments);
}

_Transcript.prototype.traceOutputObject = function () {
	_traceObject.call (this, "output", arguments);
}

function _traceMessage (_type, _arguments) {
	var _message = printf.apply (null, _arguments);
	_traceLines.call (this, _type, _message);
}

function _traceObject (_type, _arguments) {
	var _lines = [];
	if (_arguments.length > 1) {
		var _printfArguments = [];
		for (var _index = _arguments.length - 2; _index >= 0; _index--)
			_printfArguments.unshift (_arguments[_index]);
		var _printfMessage = printf.apply (null, _printfArguments);
		_lines.push (_printfMessage);
	}
	var _object = _arguments[_arguments.length - 1];
	var _object = util.inspect (_object, false, null);
	_lines.push (null);
	_lines = _lines.concat (_object.split ("\n"));
	_lines.push (null);
	_traceLines.call (this, _type, _lines);
}

function _traceLines (_type, _messageLines) {
	var _slug = _slugs[_type];
	if (_slug === undefined)
		_slug = _slugs["unknown"];
	if (typeof (_messageLines) == "string")
		_messageLines = _messageLines.split ('\n');
	var _outputLines = [];
	for (var _index in _messageLines)
		if (_messageLines[_index] === null)
			_outputLines.push (printf ("[%5d][%-16s]%s", process.pid, this._identifier, _slugs["delimiter"]));
		else
			_outputLines.push (printf ("[%5d][%-16s]%s %s", process.pid, this._identifier, _slug, _messageLines[_index]));
	_outputLines.push ("");
	var _output = _outputLines.join ("\n");
	process.stderr.write (_output);
}

// ---------------------------------------

module.exports = _create;

// ---------------------------------------
