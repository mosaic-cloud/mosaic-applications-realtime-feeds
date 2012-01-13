#!/dev/null

_workbench="$( readlink -e -- . )"
_scripts="${_workbench}/scripts"
_tools="${_workbench}/.tools"
_outputs="${_workbench}/.outputs"

_PATH="${_tools}/bin:${PATH}"

_java_bin="$( PATH="${_PATH}" type -P -- java || true )"
if test -z "${_java_bin}" ; then
	echo "[ee] missing \`java\` (Java interpreter) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

_mvn_bin="$( PATH="${_PATH}" type -P -- mvn || true )"
if test -z "${_mvn_bin}" ; then
	echo "[ee] missing \`mvn\` (Java Maven tool) executable in path: \`${_PATH}\`; ignoring!" >&2
	exit 1
fi

_java_args=(
		-server
)
_java_env=(
		PATH="${_PATH}"
)

_mvn_pom="${_workbench}/pom.xml"
_mvn_pkg_pom="${_outputs}/package.mvn/pom.xml"
_mvn_args=(
		-q
)
_mvn_env=(
		PATH="${_PATH}"
)

while read _maven_pom_variable ; do
	declare "${_maven_pom_variable}"
done <<<"$(
		env "${_mvn_env[@]}" "${_mvn_bin}" -f "${_mvn_pom}" "${_mvn_args[@]}" validate -D_maven_pom_phase=validate \
		| grep -o -E -e '^_maven_pom_[a-z]+=.+$'
)"

test -n "${_maven_pom_artifact}"
test -n "${_maven_pom_version}"
test -n "${_maven_pom_package}"

_package_name="${_maven_pom_package}"
_package_version=0.2.0_mosaic_dev
_package_jar_name="${_maven_pom_artifact}-${_maven_pom_version}-jar-with-dependencies.jar"
_package_war_name="${_maven_pom_artifact}-${_maven_pom_version}.war"
_package_scripts=( run-component )
_package_cook=cook@agent1.builder.mosaic.ieat.ro.
