#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

if test "${pallur_deploy_cp:-false}" == true ; then
	test -n "${pallur_deploy_cp_store}"
	pallur_deploy_cp_target="${pallur_deploy_cp_store}/${_package_name}--${_package_version}.cpio.gz"
	echo "[ii] deploying via \`cp\` method to \`${pallur_deploy_cp_target}\`..." >&2
	cp -T -- "${_outputs}/package.cpio.gz" "${pallur_deploy_cp_target}"
fi

if test "${pallur_deploy_curl:-false}" == true ; then
	test -n "${pallur_deploy_curl_credentials}"
	test -n "${pallur_deploy_curl_store}"
	pallur_deploy_curl_target="${pallur_deploy_curl_store}/${_package_name}--${_package_version}.cpio.gz"
	echo "[ii] deploying via \`curl\` method to \`${pallur_deploy_curl_target}\`..." >&2
	env -i "${_curl_env[@]}" "${_curl_bin}" "${_curl_args[@]}" \
			--anyauth --user "${pallur_deploy_curl_credentials}" \
			--upload-file "${_outputs}/package.cpio.gz" \
			-- "${pallur_deploy_curl_target}"
fi

if test "${pallur_deploy_cook:-false}" == true ; then
	test -n "${pallur_deploy_cook_server}"
	echo "[ii] deploying via \`cook\` method to \`${pallur_deploy_cook_server}\`..." >&2
	env -i "${_ssh_env[@]}" "${_ssh_bin}" "${_ssh_args[@]}" \
			-T "${pallur_deploy_cook_server}" \
		<"${_outputs}/package.cpio.gz"
fi

exit 0
