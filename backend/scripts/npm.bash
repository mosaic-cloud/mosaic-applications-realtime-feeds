#!/dev/null

if test "${#}" -ge 1 ; then
	_npm_args+=( "${@}" )
fi

if test "${#_npm_args[@]}" -ge 1 ; then
	exec env "${_npm_env[@]}" "${_npm}" "${_npm_args[@]}"
else
	exec env "${_npm_env[@]}" "${_npm}"
fi
