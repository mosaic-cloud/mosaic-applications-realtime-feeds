#!/bin/bash

set -e -E -u -o pipefail -o noclobber -o noglob +o braceexpand || exit 1
trap 'printf "[ee] failed: %s\n" "${BASH_COMMAND}" >&2' ERR || exit 1

_self="${0}"
_self_basename="$( basename -- "${_self}" )"
_self_dirname="$( dirname -- "${_self}" )"
_self_dirname_realpath="$( readlink -e -- "${_self_dirname}" )"
_self_dirname_realpath_basename="$( basename -- "${_self_dirname_realpath}" )"
if test -h "${_self}" ; then
	_self_next="$( readlink -- "${0}" )"
	_self_next_basename="$( basename -- "${_self_next}" )"
	_self_next_dirname="$( dirname -- "${_self_next}" )"
	_self_next_dirname_realpath="$( cd -- "${_self_dirname}" ; readlink -e -- "${_self_next_dirname}" )"
	_self_next_dirname_realpath_basename="$( basename -- "${_self_next_dirname_realpath}" )"
	_self_next_realpath="$( cd -- "${_self_dirname}" ; readlink -e -- "${_self_next}" )"
	_self_next_realpath_dirname="$( dirname -- "${_self_next_realpath}" )"
	if test "${_self_next_basename}" == '_do.bash' ; then
		_self_do="${_self_next}"
		_self_do_realpath="${_self_next_realpath}"
		_self_do_realpath_dirname="${_self_next_realpath_dirname}"
	else
		echo "[ee] arg0 \`${_self}\` is expected to be a symlink to the \`_do.bash\` script; aborting!" >&2
		exit 1
	fi
	if test "${_self_dirname_realpath_basename}" == scripts ; then
		_self_workbench="$( readlink -e -- "${_self_dirname_realpath}/.." )"
	elif test "${_self_next_dirname_realpath_basename}" == scripts ; then
		_self_workbench="$( readlink -e -- "${_self_next_dirname_realpath}/.." )"
	else
		echo "[ee] arg0 \`${_self}\` is expected to be a symlink to the \`_do.bash\` script inside the \`scripts\` folder inside the project's workbench; aborting!" >&2
		exit 1
	fi
	if test -f "${_self_workbench}/scripts/${_self_basename}.bash" ; then
		_self_main="${_self_workbench}/scripts/${_self_basename}.bash"
	elif test -f "${_self_do_realpath_dirname}/${_self_basename}.bash" ; then
		_self_main="${_self_do_realpath_dirname}/${_self_basename}.bash"
	else
		echo "[ee] cannot locate \`${_self_basename}.bash\` script in either \`${_self_workbench}/scripts\` or \`${_self_do_realpath_dirname}\` folders; aborting!" >&2
		exit 1
	fi
	if test -f "${_self_workbench}/scripts/_env.bash" ; then
		_self_env="${_self_workbench}/scripts/_env.bash"
	elif test -f "${_self_do_realpath_dirname}/_env.bash" ; then
		_self_env="${_self_do_realpath_dirname}/_env.bash"
	else
		echo "[ww] cannot locate \`_env.bash\` script in either \`${_self_workbench}/scripts\` or \`${_self_do_dirname_realpath}\` folders; ignoring!" >&2
	fi
	if test -e "${_self_workbench}/.tools" ; then
		_tools="${_self_workbench}/.tools"
	elif test -e "${_self_do_realpath_dirname}/../.tools" ; then
		_tools="${_self_do_realpath_dirname}/../.tools"
	fi
else
	echo "[ee] arg0 \`${_self}\` is expected to be a symlink to the \`_do.bash\` script; aborting!" >&2
	exit 1
fi

cd -- "${_self_workbench}"

. "${_self_env}"
. "${_self_main}"

echo "[ee] script \`${_self_main}\` should have exited..." >&2
exit 1
