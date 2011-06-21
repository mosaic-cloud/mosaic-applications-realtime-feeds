#!/dev/null

_scripts="$( readlink -e -- ./scripts || true )"
_tools="$( readlink -f -- ./.tools || true )"

_PATH="${_tools}/bin:${PATH}"

_java="$( PATH="${_PATH}" type -P -- java || true )"
if test -z "${_java}" ; then
	echo "[ww] missing \`java\` (Java interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	_java=java
fi

_java_args=()
_java_env=(
	PATH="${_PATH}"
)
