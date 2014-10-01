#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

if test -e "${_outputs}/package" ; then
	chmod -R +w -- "${_outputs}/package"
	rm -R -- "${_outputs}/package"
fi
if test -e "${_outputs}/package.cpio.gz" ; then
	chmod +w -- "${_outputs}/package.cpio.gz"
	rm -- "${_outputs}/package.cpio.gz"
fi

mkdir -- "${_outputs}/package"
mkdir -- "${_outputs}/package/bin"
mkdir -- "${_outputs}/package/lib"

cp -H -R -T -- "${_sources}" "${_outputs}/package/lib/node"

cp -H -R -T -- "${_node_modules}" "${_outputs}/package/lib/node_modules"

mkdir -- "${_outputs}/package/lib/mosaic-platform-definitions"
find -H "${_resources}" -maxdepth 1 -type f -name 'mosaic_platform_definitions*.term' \
| while read _definitions ; do
	cp -t "${_outputs}/package/lib/mosaic-platform-definitions" -- "${_definitions}"
done

mkdir -- "${_outputs}/package/lib/scripts"

cat >"${_outputs}/package/lib/scripts/_do.sh" <<'EOS'
#!/bin/bash

set -e -E -u -o pipefail -o noclobber -o noglob +o braceexpand || exit 1
trap 'printf "[ee] failed: %s\n" "${BASH_COMMAND}" >&2' ERR || exit 1

_self_basename="$( basename -- "${0}" )"
_self_realpath="$( readlink -e -- "${0}" )"
cd "$( dirname -- "${_self_realpath}" )"
cd ../..
_package="$( readlink -e -- . )"
cmp -s -- "${_package}/lib/scripts/_do.sh" "${_self_realpath}"
test -e "${_package}/lib/scripts/${_self_basename}.bash"

test -d "${_package}/env/paths"
_PATH="$(
		find "${_package}/env/paths" -xdev -mindepth 1 -maxdepth 1 -type l -xtype d \
		| sort \
		| while read -r _path ; do
			printf ':%s' "$( readlink -m -- "${_path}" )"
		done
)"
_PATH="${_PATH/:}"
export PATH="${_PATH}"

if test -e "${_package}/env/variables" ; then
	while read -r _path ; do
		_name="$( basename -- "${_path}" )"
		case "${_name}" in
			( @a:* )
				test -L "${_path}"
				_name="${_name/*:}"
				_value="$( readlink -e -- "${_path}" )"
			;;
			( * )
				echo "[ee] invalid variable \`${_path}\`; aborting!"
				exit 1
			;;
		esac
		export -- "${_name}=${_value}"
	done < <(
			find "${_package}/env/variables" -xdev -mindepth 1 \
			| sort
	)
	
fi

_node_bin="$( PATH="${_PATH}" type -P -- node || true )"
if test -z "${_node_bin}" ; then
	echo "[ee] missing \`node\` (Node.JS interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

_node_sources="${_package}/lib/node"
_node_args=()
_node_env=(
		PATH="${_PATH}"
		NODE_PATH="${_node_sources}:${_package}/lib/node_modules"
)

if test "${#}" -eq 0 ; then
	. "${_package}/lib/scripts/${_self_basename}.bash"
else
	. "${_package}/lib/scripts/${_self_basename}.bash" "${@}"
fi

echo "[ee] script \`${_self_main}\` should have exited..." >&2
exit 1
EOS

chmod +x -- "${_outputs}/package/lib/scripts/_do.sh"

for _script_name in "${_package_scripts[@]}" ; do
	test -e "${_scripts}/${_script_name}" || continue
	if test -e "${_scripts}/${_script_name}.bash" ; then
		_script_path="${_scripts}/${_script_name}.bash"
	else
		_script_path="$( dirname -- "$( readlink -e -- "${_scripts}/${_script_name}" )" )/${_script_name}.bash"
	fi
	cp -T -- "${_script_path}" "${_outputs}/package/lib/scripts/${_script_name}.bash"
	ln -s -T -- ./_do.sh "${_outputs}/package/lib/scripts/${_script_name}"
	cat >"${_outputs}/package/bin/${_package_name}--${_script_name}" <<EOS
#!/bin/bash
set -e -E -u -o pipefail -o noclobber -o noglob +o braceexpand || exit 1
trap 'printf "[ee] failed: %s\n" "\${BASH_COMMAND}" >&2' ERR || exit 1
if test "\${#}" -eq 0 ; then
	exec "\$( dirname -- "\$( readlink -e -- "\${0}" )" )/../lib/scripts/${_script_name}"
else
	exec "\$( dirname -- "\$( readlink -e -- "\${0}" )" )/../lib/scripts/${_script_name}" "\${@}"
fi
EOS
	chmod +x -- "${_outputs}/package/bin/${_package_name}--${_script_name}"
done

chmod -R a+rX-w,u+w -- "${_outputs}/package"

cd "${_outputs}/package"
find . \
		-xdev -depth \
		\( -type d -o -type l -o -type f \) \
		-print0 \
| cpio -o -H newc -0 --quiet \
| gzip --fast >"${_outputs}/package.cpio.gz"

if test -n "${_artifacts_cache}" ; then
	cp -T -- "${_outputs}/package.cpio.gz" "${_artifacts_cache}/${_package_name}--${_package_version}.cpio.gz"
fi

exit 0
