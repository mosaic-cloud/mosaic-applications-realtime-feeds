#!/dev/null

if test "${#}" -ge 1 ; then
	_node_args+=( "${@}" )
fi

if test "${#_node_args[@]}" -eq 0 ; then
	exec env "${_node_env[@]}" "${_node}"
else
	exec env "${_node_env[@]}" "${_node}" "${_node_args[@]}"
fi
