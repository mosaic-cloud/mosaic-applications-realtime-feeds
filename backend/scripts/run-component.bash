#!/dev/null

if ! test "${#}" -le 1 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

_identifier="${1:-0000000000000000000000000000000000000000}"

case "$( basename "${0}" .bash )" in
	( run-fetcher )
		_component=fetcher
	;;
	( run-indexer )
		_component=indexer
	;;
	( run-leacher )
		_component=leacher
	;;
	( run-pusher )
		_component=pusher
		_node_env+=(
				_mosaic_feeds_pusher_urls="${MOSAIC_FEEDS_URLS}"
		)
	;;
	( * )
		exit 1
	;;
esac

_node_args+=(
		"${_sources}/${_component}-main.js"
)
_node_env+=(
		NODE_PATH="${_node_path}"
)

#if test "${_identifier}" != 0000000000000000000000000000000000000000 ; then
#	...
#else
#	...
#fi

exec env "${_node_env[@]}" "${_node}" "${_node_args[@]}"
