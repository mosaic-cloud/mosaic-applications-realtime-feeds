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

_mvn_this_pom="${_workbench}/pom.xml"
_mvn_umbrella_pom="${_workbench}/pom-umbrella.xml"
_mvn_args=(
		--errors
		--quiet
)
_mvn_env=(
		PATH="${_PATH}"
)

while read _maven_pom_variable ; do
	test -n "${_maven_pom_variable}" || continue
	declare "${_maven_pom_variable}"
done <<<"$(
		env "${_mvn_env[@]}" "${_mvn_bin}" \
				-f "${_mvn_this_pom}" \
				--offline \
				"${_mvn_args[@]}" \
				help:effective-pom \
				-Doutput=/dev/stderr \
			3>&1 1>&2 2>&3 \
		| grep -o -E -e '<echo message="_maven_pom_[a-z]+=.+&#xA;" file="/dev/stdout" />' \
		| sed -r -e 's!^<echo message="(_maven_pom_[a-z]+=.+)&#xA;" file="/dev/stdout" />$!\1!'
)"

_mvn_pom="${_mvn_umbrella_pom}"

test -n "${_maven_pom_artifact}"
test -n "${_maven_pom_version}"
test -n "${_maven_pom_package}"

_package_name="${_maven_pom_package}"
_package_jar_name="${_maven_pom_artifact}-${_maven_pom_version}-jetty-container-component.jar"
_package_scripts=( run-component )
_package_version="${mosaic_distribution_version:-0.2.0_mosaic_dev}"
_package_cook="${mosaic_distribution_cook:-cook@agent1.builder.mosaic.ieat.ro}"
