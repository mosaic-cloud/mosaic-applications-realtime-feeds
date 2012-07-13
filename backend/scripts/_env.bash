#!/dev/null

_workbench="$( readlink -e -- . )"
_sources="${_workbench}/sources"
_scripts="${_workbench}/scripts"
_tools="${_workbench}/.tools"
_outputs="${_workbench}/.outputs"

_PATH="${_tools}/bin:${PATH}"

_node_bin="$( PATH="${_PATH}" type -P -- node || true )"
if test -z "${_node_bin}" ; then
	echo "[ee] missing \`node\` (Node.JS interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

_npm_bin="$( PATH="${_PATH}" type -P -- npm || true )"
if test -z "${_npm_bin}" ; then
	echo "[ee] missing \`npm\` (Node.JS package manager) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

_node_sources="${_sources}"
_node_args=()
_node_env=(
		PATH="${_PATH}"
		NODE_PATH="${_sources}:${_workbench}/node_modules"
)

_npm_args=(
)
_npm_env=(
		PATH="${_PATH}"
)

_package_name="$( basename -- "$( readlink -e -- .. )" )-$( basename -- "$( readlink -e -- . )" )"
_package_scripts=( run-{fetcher,indexer,scavanger,leacher,pusher} node )
_package_version="${mosaic_distribution_version:-0.2.1_mosaic_dev}"
_package_cook="${mosaic_distribution_cook:-cook@agent1.builder.mosaic.ieat.ro}"
