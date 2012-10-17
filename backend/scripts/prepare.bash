#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

if test ! -e "${_outputs}" ; then
	if test -L "${_outputs}" ; then
		_outputs_store="$( readlink -- "${_outputs}" )"
	else
		_outputs_store="${_temporary}/$( basename -- "${_workbench}" )--$( readlink -m -- "${_outputs}" | tr -d '\n' | md5sum -t | tr -d ' \n-' )"
		ln -s -T -- "${_outputs_store}" "${_outputs}"
	fi
	if test ! -e "${_outputs_store}" ; then
		mkdir -- "${_outputs_store}"
	fi
fi

if test ! -e ./node_modules ; then
	if test -L ./node_modules ; then
		_node_modules_store="$( readlink -- ./node_modules )"
	else
		_node_modules_store="${_outputs}/node_modules"
		ln -s -T -- "${_node_modules_store}" ./node_modules
	fi
	if test ! -e "${_node_modules_store}" ; then
		mkdir -- "${_node_modules_store}"
	fi
fi

"${_scripts}/npm" install .

exit 0
