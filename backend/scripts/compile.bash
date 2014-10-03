#!/dev/null
## chunk::1f911fe8fd3545c630dbc5f7bf790bb3::begin ##

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

exec "${_scripts}/npm" rebuild .

exit 1
## chunk::1f911fe8fd3545c630dbc5f7bf790bb3::end ##
