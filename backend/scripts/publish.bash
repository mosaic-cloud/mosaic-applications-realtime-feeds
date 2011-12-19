#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

_outputs="$( readlink -f -- ../.outputs )"

test -e "${_outputs}/package.tar.gz"

if test -e "${_package_afs}" ; then
	cp -T "${_outputs}/package.tar.gz" "${_package_afs}/${_package_name}-${_package_version}.tar.gz"
fi

exec ssh -T cook@agent1.builder.mosaic.ieat.ro. <"${_outputs}/package.tar.gz"
exit 1
