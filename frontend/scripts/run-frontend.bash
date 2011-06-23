#!/dev/null

if ! test "${#}" -le 1 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

_identifier="${1:-00000000cf14614e8810102fa887b6bc90dc2a40}"

_jar="${_java_jars:-${_workbench}/../../mosaic-components-jetty/target}/components-jetty-0.2-SNAPSHOT-jar-with-dependencies.jar"
_war="${_java_jars:-${_workbench}/target}/examples-realtime-feeds-frontend-0.1-SNAPSHOT.war"

_java_args+=(
		-jar "${_jar}"
		"${_identifier}"
		"${_war}"
)

mkdir -p "/tmp/mosaic/components/${_identifier}"
cd "/tmp/mosaic/components/${_identifier}"

exec env "${_java_env[@]}" "${_java}" "${_java_args[@]}"
