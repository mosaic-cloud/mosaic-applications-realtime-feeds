#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

cat <<EOS

${_package_name}@requisites : pallur-packages@nodejs pallur-bootstrap

${_package_name}@prepare : ${_package_name}@requisites
	${_scripts}/prepare

${_package_name}@package : ${_package_name}@compile
	${_scripts}/package

${_package_name}@compile : ${_package_name}@prepare
	${_scripts}/compile

${_package_name}@deploy : ${_package_name}@package
	${_scripts}/deploy

pallur-distribution@requisites : ${_package_name}@requisites
pallur-distribution@prepare : ${_package_name}@prepare
pallur-distribution@compile : ${_package_name}@compile
pallur-distribution@package : ${_package_name}@package
pallur-distribution@deploy : ${_package_name}@deploy

EOS

exit 0
