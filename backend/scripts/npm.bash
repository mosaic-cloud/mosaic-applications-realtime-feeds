#!/dev/null

if test "${#}" -ge 1 ; then
	_npm_args+=( "${@}" )
fi

cd -- "${_node_root}"

if test "${#_npm_args[@]}" -eq 0 ; then
	exec env "${_npm_env[@]}" "${_npm_bin}"
else
	exec env "${_npm_env[@]}" "${_npm_bin}" "${_npm_args[@]}"
fi

exit 1
