#!/dev/null

if ! test "${#}" -eq 0 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

if test "${pallur_publish_cp:-false}" == true ; then
	test -n "${pallur_publish_cp_store}"
	pallur_publish_cp_target="${pallur_publish_cp_store}/${_package_name}--${_package_version}.cpio.gz"
	echo "[ii] publishing via \`cp\` method to \`${pallur_publish_cp_target}\`..." >&2
	cp -T -- "${_outputs}/package.cpio.gz" "${pallur_publish_cp_target}"
fi

if test "${pallur_publish_curl:-false}" == true ; then
	test -n "${pallur_publish_curl_credentials}"
	test -n "${pallur_publish_curl_store}"
	pallur_publish_curl_target="${pallur_publish_curl_store}/${_package_name}--${_package_version}.cpio.gz"
	echo "[ii] publishing via \`curl\` method to \`${pallur_publish_curl_target}\`..." >&2
	env -i "${_curl_env[@]}" "${_curl_bin}" "${_curl_args[@]}" \
			--anyauth --user "${pallur_publish_curl_credentials}" \
			--upload-file "${_outputs}/package.cpio.gz" \
			-- "${pallur_publish_curl_target}"
fi

exit 0
