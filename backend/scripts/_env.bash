#!/dev/null

_workbench="$( readlink -e -- . )"
_sources="${_workbench}/sources"
_scripts="${_workbench}/scripts"
_tools="${_workbench}/.tools"
_outputs="${_workbench}/.outputs"
_npm_prefix="${_workbench}/.npm"

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

_mvn_bin="$( PATH="${_PATH}" type -P -- mvn || true )"
if test -z "${_mvn_bin}" ; then
	echo "[ee] missing \`mvn\` (Java Maven tool) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

_node_sources="${_sources}"
_node_args=()
_node_env=(
		PATH="${_PATH}"
		NODE_PATH="${_sources}:${_npm_prefix}/node_modules"
)

_npm_args=(
		--prefix "${_npm_prefix}"
)
_npm_env=(
		PATH="${_PATH}"
)

_mvn_pkg_pom="${_outputs}/package.mvn/pom.xml"
_mvn_args=(
		--errors --quiet
)
_mvn_env=(
		PATH="${_PATH}"
)

_package_name="$( basename -- "$( readlink -e -- .. )" )-$( basename -- "$( readlink -e -- . )" )"
_package_version=0.2.0_mosaic_dev
_package_scripts=( run-{fetcher,indexer,scavanger,leacher,pusher} node )
_package_cook=cook@agent1.builder.mosaic.ieat.ro.
