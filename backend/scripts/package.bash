#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

cd ..

if ! test -e "${_outputs}" ; then
	mkdir "${_outputs}"
fi

if test -e "${_outputs}/package" ; then
	rm -R "${_outputs}/package"
fi
if test -e "${_outputs}/package.tar.gz" ; then
	rm "${_outputs}/package.tar.gz"
fi

mkdir "${_outputs}/package"
mkdir "${_outputs}/package/bin"
mkdir "${_outputs}/package/lib"

mkdir "${_outputs}/package/lib/node"
find ./backend/sources -type f \( -name "*.js" -o -name "*.txt" \) -print \
| while read _source ; do
	cp -t "${_outputs}/package/lib/node" "${_source}"
done

cp -RT "${_npm_prefix}" "${_outputs}/package/lib/npm"

mkdir "${_outputs}/package/lib/java"
cp -t "${_outputs}/package/lib/java" ./frontend/target/examples-realtime-feeds-frontend-0.1-SNAPSHOT.war
cp -t "${_outputs}/package/lib/java" ../mosaic-components-jetty/target/components-jetty-0.2-SNAPSHOT-jar-with-dependencies.jar

mkdir "${_outputs}/package/lib/scripts"

cat >"${_outputs}/package/lib/scripts/do.sh" <<'EOS'
#!/bin/bash

set -e -E -u -o pipefail || exit 1

_self_basename="$( basename -- "${0}" )"
_self_realpath="$( readlink -e -- "${0}" )"
cd "$( dirname -- "${_self_realpath}" )"
cd ../..
_package="$( readlink -e -- . )"
cmp -s -- "${_package}/lib/scripts/do.sh" "${_self_realpath}"
test -e "${_package}/lib/scripts/${_self_basename}.bash"

_PATH="${_package}/bin:${_package}/lib/applications-elf:${PATH}"

_node="$( PATH="${_PATH}" type -P -- node || true )"
if test -z "${_node}" ; then
	echo "[ww] missing \`node\` (Node.JS interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	_node=node
fi

_java="$( PATH="${_PATH}" type -P -- java || true )"
if test -z "${_java}" ; then
	echo "[ww] missing \`java\` (Java interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	_java=java
fi

_node_sources="${_package}/lib/node"
_node_args=()
_node_env=(
	PATH="${_PATH}"
	NODE_PATH="${_package}/lib/node:${_package}/lib/npm/node_modules"
)

_java_jars="${_package}/lib/java"
_java_args=()
_java_env=(
	PATH="${_PATH}"
)

if test "${#}" -eq 0 ; then
	. "${_package}/lib/scripts/${_self_basename}.bash"
else
	. "${_package}/lib/scripts/${_self_basename}.bash" "${@}"
fi

echo "[ee] script \`${_self_main}\` should have exited..." >&2
exit 1
EOS

chmod +x -- "${_outputs}/package/lib/scripts/do.sh"

for _script_path in ./backend/scripts/run-{fetcher,indexer,scavanger,leacher,pusher}.bash ./frontend/scripts/run-frontend.bash ; do
	_script_name="$( basename -- "${_script_path}" .bash )"
	cp -T "${_script_path}" "${_outputs}/package/lib/scripts/${_script_name}.bash"
	ln -s -T ./do.sh "${_outputs}/package/lib/scripts/${_script_name}"
	cat >"${_outputs}/package/bin/${_package_name}--${_script_name}" <<EOS
#!/bin/bash
if test "\${#}" -eq 0 ; then
	exec "\$( dirname -- "\$( readlink -e -- "\${0}" )" )/../lib/scripts/${_script_name}"
else
	exec "\$( dirname -- "\$( readlink -e -- "\${0}" )" )/../lib/scripts/${_script_name}" "\${@}"
fi
EOS
	chmod +x -- "${_outputs}/package/bin/${_package_name}--${_script_name}"
done

cat >"${_outputs}/package/pkg.json" <<EOS
{
	"package" : "${_package_name}",
	"version" : "${_package_version}",
	"maintainer" : "mosaic-developers@lists.info.uvt.ro",
	"description" : "mOSAIC Examples: Realtime Feeds",
	"directories" : [ "bin", "lib" ],
	"depends" : [
		"mosaic-nodejs-0.4.11",
		"mosaic-sun-jre",
		"libxml2"
	]
}
EOS

tar -czf "${_outputs}/package.tar.gz" -C "${_outputs}/package" .

exit 0
