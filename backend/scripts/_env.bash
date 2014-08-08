#!/dev/null

set -e -E -u -o pipefail -o noclobber -o noglob +o braceexpand || exit 1
trap 'printf "[ee] failed: %s\n" "${BASH_COMMAND}" >&2' ERR || exit 1
export -n BASH_ENV

_workbench="$( readlink -e -- . )"
_sources="${_workbench}/sources"
_scripts="${_workbench}/scripts"
_tools="${pallur_tools:-${_workbench}/.tools}"
_temporary="${pallur_temporary:-${pallur_TMPDIR:-${TMPDIR:-/tmp}}}"
_outputs="${_temporary}/$( basename -- "${_workbench}" )--outputs--$( readlink -e -- "${_workbench}" | tr -d '\n' | md5sum -t | tr -d ' \n-' )"

_PATH="${pallur_PATH:-${_tools}/bin:${PATH}}"
_HOME="${pallur_HOME:-${HOME}}"
_TMPDIR="${pallur_TMPDIR:-${TMPDIR:-${_temporary}}}"

if test -n "${pallur_pkg_nodejs:-}" ; then
	_node_bin="${pallur_pkg_nodejs}/bin/node"
else
	_node_bin="$( PATH="${_PATH}" type -P -- node || true )"
fi
if test -z "${_node_bin}" ; then
	echo "[ee] missing \`node\` (Node.JS interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

if test -n "${pallur_pkg_nodejs:-}" ; then
	_npm_bin="${pallur_pkg_nodejs}/bin/npm"
else
	_npm_bin="$( PATH="${_PATH}" type -P -- npm || true )"
fi
if test -z "${_npm_bin}" ; then
	echo "[ee] missing \`npm\` (Node.JS package manager) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

_generic_env=(
		PATH="${_PATH}"
		HOME="${_HOME}"
		TMPDIR="${_TMPDIR}"
)

_node_sources="${_sources}"
_node_root="${_outputs}/node"
_node_modules="${_node_root}/node_modules"
_node_args=()
_node_env=(
		"${_generic_env[@]}"
		NODE_PATH="${_node_sources}:${_node_modules}"
)

_npm_args=()
_npm_env=(
		"${_generic_env[@]}"
)
if test -n "${pallur_pkg_nodejs:-}" ; then
	_npm_env+=( NPM_CONFIG_CACHE="${pallur_pkg_nodejs}/cache/npm" )
else
	_npm_env+=( NPM_CONFIG_CACHE="${_temporary}/nodejs--npm-cache" )
fi

_package_name="$( basename -- "$( readlink -e -- .. )" )-$( basename -- "$( readlink -e -- . )" )"
_package_version="${pallur_distribution_version:-0.7.0_dev}"
_package_scripts=( run-fetcher run-indexer run-scavanger run-leacher run-pusher node )
_artifacts_cache="${pallur_artifacts:-}"
