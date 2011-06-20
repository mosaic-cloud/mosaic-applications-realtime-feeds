#!/dev/null

if test "${#}" -ge 1 ; then
	_node_args+=( "${@}" )
fi

_node_env+=(
		NODE_PATH="${_sources}:${_node_path}"
)

if test "${#_node_args[@]}" -ge 1 ; then
	exec env "${_node_env[@]}" "${_node}" "${_node_args[@]}"
else
	exec env "${_node_env[@]}" "${_node}"
fi
