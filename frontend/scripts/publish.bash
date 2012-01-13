#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

if test "${_mosaic_publish_cook:-true}" == true ; then
	ssh -T "${_package_cook}" <"${_outputs}/package.tar.gz"
fi

if test "${_mosaic_publish_maven:-true}" == true ; then
	env "${_mvn_env[@]}" "${_mvn_bin}" -f "${_mvn_pkg_pom}" "${_mvn_args[@]}" deploy
fi

exit 0
