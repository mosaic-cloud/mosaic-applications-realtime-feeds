#!/dev/null
## chunk::81daef3426e46c59ead66c589ef919d7::begin ##

if test "${#}" -ge 1 ; then
	_node_args+=( "${@}" )
fi

if test "${#_node_args[@]}" -eq 0 ; then
	exec env "${_node_env[@]}" "${_node_bin}"
else
	exec env "${_node_env[@]}" "${_node_bin}" "${_node_args[@]}"
fi

exit 1
## chunk::81daef3426e46c59ead66c589ef919d7::end ##
