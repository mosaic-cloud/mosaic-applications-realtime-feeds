#!/dev/null

_scripts="$( readlink -e -- ./scripts || true )"
_tools="$( readlink -f -- ./.tools || true )"
_sources="$( readlink -f -- ./sources || true )"
_node_modules="$( readlink -f -- ./.node_modules || true )"

_PATH="${_tools}/bin:${PATH}"

_node="$( PATH="${_PATH}" type -P -- node || true )"
if test -z "${_node}" ; then
	echo "[ww] missing \`node\` (Node.JS interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	_erl=erl
fi

_npm="$( PATH="${_PATH}" type -P -- npm || true )"
if test -z "${_npm}" ; then
	echo "[ww] missing \`npm\` (Node.JS package manager) executable in path: \`${_PATH}\`; ignoring!" >&2
	_erl=erl
fi

_node_path="${_node_modules}"
_node_args=()
_node_env=()
