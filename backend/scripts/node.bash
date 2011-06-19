#!/dev/null

if test "${#}" -ge 1 ; then
	_node_args+=( "${@}" )
fi

_node_env+=(
		NODE_PATH="${_sources}:${_node_path}"
)

exec env "${_node_env}" exec "${_node}" "${_node_args}"
