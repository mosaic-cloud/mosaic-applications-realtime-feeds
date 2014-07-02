#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

if test ! -e "${_temporary}" ; then
	mkdir -- "${_temporary}"
fi
if test ! -e "${_outputs}" ; then
	mkdir -- "${_outputs}"
fi
if test ! -e "${_node_root}" ; then
	mkdir -- "${_node_root}"
fi
if test ! -e "${_node_modules}" ; then
	mkdir -- "${_node_modules}"
fi
if test ! -e "${_node_root}/package.json" ; then
	ln -s -T -- "${_workbench}/package.json" "${_node_root}/package.json"
fi

"${_scripts}/npm" install .

exit 0
