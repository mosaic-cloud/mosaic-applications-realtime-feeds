#!/dev/null

_identifier="${1:-00000000cf14614e8810102fa887b6bc90dc2a40}"

if test "${#}" -ge 1 ; then
	for _argument in "${@}" ; do
		if test -z "${_identifier}" ; then
			_identifier="${_argument}"
			break
		fi
		case "${_argument}" in
			( --component-identifier )
				_identifier=''
			;;
		esac
	done
fi

if test -n "${mosaic_component_temporary:-}" ; then
	_tmp="${mosaic_component_temporary:-}"
elif test -n "${mosaic_temporary:-}" ; then
	_tmp="${mosaic_temporary}/components/${_identifier}"
else
	_tmp="/tmp/mosaic/components/${_identifier}"
fi

if test -n "${mosaic_component_debug:-}" ; then
	_java_args+=( -Dlogback.levels.root=debug )
fi

_jar="${_java_jars:-${_outputs}/${_pom_group}--${_pom_artifact}--${_pom_version}/target}/${_package_jar_name}"

_java_args+=(
		-jar "${_jar}"
		embedded
		"${@}"
)

mkdir -p -- "${_tmp}"
cd -- "${_tmp}"

exec env "${_java_env[@]}" "${_java_bin}" "${_java_args[@]}"

exit 1
