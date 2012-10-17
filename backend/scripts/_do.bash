#!/bin/bash

set -e -E -u -o pipefail -o noclobber -o noglob +o braceexpand || exit 1
trap 'printf "[ee] failed: %s\n" "${BASH_COMMAND}" >&2' ERR || exit 1

_self="${0}"
_self__basename="$( exec basename -- "${_self}" )"
_self__dirname="$( exec dirname -- "${_self}" )"

if ! test -h "${_self}" ; then
	echo "[ee] arg0 \`${_self}\` is expected to be a symlink to the \`_do.bash\` script; aborting!" >&2
	exit 1
fi

_self_next="$( exec readlink -- "${_self}" )"
_self_next__basename="$( exec basename -- "${_self_next}" )"
_self_next__dirname="$( exec dirname -- "${_self_next}" )"
_self_next__realpath="$( cd -- "${_self__dirname}" ; exec readlink -e -- "${_self_next}" )"
_self_next__realpath_dirname="$( exec dirname -- "${_self_next__realpath}" )"

if test "${_self_next__basename}" == '_do.bash' ; then
	_do="${_self_next}"
else
	echo "[ee] arg0 \`${_self}\` is expected to be a symlink to the \`_do.bash\` script; aborting!" >&2
	exit 1
fi

_do__realpath="${_self_next__realpath}"
_do__realpath_dirname="${_self_next__realpath_dirname}"

_self_folder__realpath="$( exec readlink -e -- "${_self__dirname}" )"
_self_folder__realpath_basename="$( exec basename -- "${_self_folder__realpath}" )"
_self_next_folder__realpath="$( cd -- "${_self__dirname}" ; exec readlink -e -- "${_self_next__dirname}" )"
_self_next_folder__realpath_basename="$( exec basename -- "${_self_next_folder__realpath}" )"

if test "${_self_folder__realpath_basename}" == scripts ; then
	_workbench="$( exec readlink -e -- "${_self_folder__realpath}/.." )"
elif test "${_self_next_folder__realpath_basename}" == scripts ; then
	_workbench="$( exec readlink -e -- "${_self_next_folder__realpath}/.." )"
else
	echo "[ee] arg0 \`${_self}\` is expected to be a symlink to the \`_do.bash\` script inside the \`scripts\` folder inside the project's workbench; aborting!" >&2
	exit 1
fi

if test -f "${_workbench}/scripts/${_self__basename}.bash" ; then
	_main="${_workbench}/scripts/${_self__basename}.bash"
elif test -f "${_do__realpath_dirname}/${_self__basename}.bash" ; then
	_main="${_do__realpath_dirname}/${_self__basename}.bash"
else
	echo "[ee] cannot locate \`${_self__basename}.bash\` script in either \`${_workbench}/scripts\` or \`${_do__realpath_dirname}\` folders; aborting!" >&2
		exit 1
fi

if test -f "${_workbench}/scripts/_env.bash" ; then
	_env="${_workbench}/scripts/_env.bash"
elif test -f "${_do__realpath_dirname}/_env.bash" ; then
	_env="${_do__realpath_dirname}/_env.bash"
else
	echo "[ee] cannot locate \`_env.bash\` script in either \`${_workbench}/scripts\` or \`${_do__realpath_dirname}\` folders; ignoring!" >&2
	exit 1
fi

cd -- "${_workbench}"

if test "${#}" -eq 0 ; then
	BASH_ENV="${_env}" exec bash -- "${_main}"
else
	BASH_ENV="${_env}" exec bash -- "${_main}" "${@}"
fi
exit 1
