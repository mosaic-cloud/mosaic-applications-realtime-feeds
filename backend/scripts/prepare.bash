#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

_npm_args+=(
		install .
)

if test "${#_npm_args[@]}" -eq 0 ; then
	env "${_npm_env[@]}" "${_npm_bin}" 2>&1 \
	| sed -u -r -e 's!^.*$![  ] &!g' >&2
else
	env "${_npm_env[@]}" "${_npm_bin}" "${_npm_args[@]}" 2>&1 \
	| sed -u -r -e 's!^.*$![  ] &!g' >&2
fi

exit 0
