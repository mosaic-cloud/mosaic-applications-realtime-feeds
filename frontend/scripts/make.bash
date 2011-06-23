#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

_mvn_args+=(
	package -DskipTests=true
)

cd "${_workbench}/umbrella"

echo "[ii] executing build script..." >&2
exec env "${_mvn_env[@]}" "${_mvn}" "${_mvn_args[@]}"
