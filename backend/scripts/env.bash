#!/dev/null

_workbench="$( readlink -e -- . )"
_sources="${_workbench}/sources"
_scripts="${_workbench}/scripts"
_tools="${_workbench}/.tools"
_outputs="${_workbench}/../.outputs"
_npm_prefix="${_workbench}/.npm"

_PATH="${_tools}/bin:${PATH}"

_node="$( PATH="${_PATH}" type -P -- node || true )"
if test -z "${_node}" ; then
	echo "[ww] missing \`node\` (Node.JS interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	_node=node
fi

_npm="$( PATH="${_PATH}" type -P -- npm || true )"
if test -z "${_npm}" ; then
	echo "[ww] missing \`npm\` (Node.JS package manager) executable in path: \`${_PATH}\`; ignoring!" >&2
	_npm=npm
fi

_node_sources="${_sources}"
_node_args=()
_node_env=(
	PATH="${_PATH}"
	NODE_PATH="${_sources}:${_npm_prefix}/node_modules"
)

_npm_args=( --prefix "${_npm_prefix}" )
_npm_env=(
	PATH="${_PATH}"
)

_package_name=mosaic-examples-realtime-feeds
_package_version=0.1.0
_package_afs=/afs/olympus.volution.ro/people/ciprian/web/data/5e069b1ba84ae3ab9c0eb0d8cbcb0a57
