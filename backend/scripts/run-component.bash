#!/dev/null

if ! test "${#}" -le 1 ; then
	echo "[ee] invalid arguments; aborting!" >&2
	exit 1
fi

_identifier="${1:-0000000000000000000000000000000000000000}"

## chunk::c91018535aebeaa9d30f5eb4a51f389b::begin ##
if test -n "${mosaic_component_temporary:-}" ; then
	_tmp="${mosaic_component_temporary:-}"
elif test -n "${mosaic_temporary:-}" ; then
	_tmp="${mosaic_temporary}/components/${_identifier}"
else
	_tmp="${TMPDIR:-/tmp}/mosaic/components/${_identifier}"
fi
if test "${_identifier}" == 0000000000000000000000000000000000000000 ; then
	_tmp="${_tmp}--${$}--$( date +%s )"
fi
## chunk::c91018535aebeaa9d30f5eb4a51f389b::end ##

case "$( basename -- "${0}" .bash )" in
	( run-fetcher )
		_component=fetcher
	;;
	( run-indexer )
		_component=indexer
	;;
	( run-scavanger )
		_component=scavanger
	;;
	( run-leacher )
		_component=leacher
	;;
	( run-pusher )
		_component=pusher
		_node_env+=(
				mosaic_feeds_pusher_urls="${MOSAIC_FEEDS_URLS:-${_node_sources}/pusher-urls-tests.txt}"
		)
	;;
	( * )
		exit 1
	;;
esac

_node_args+=(
		"${_node_sources}/component-main.js" "${_component}"
)

if test "${_identifier}" != 0000000000000000000000000000000000000000 ; then
	_node_env+=(
			mosaic_component_identifier="${_identifier}"
			mosaic_component_temporary="${_tmp}"
	)
fi

_exec=( env "${_node_env[@]}" "${_node_bin}" "${_node_args[@]}" )

## chunk::28123944cc9e9fddd23208a1405324fb::begin ##
mkdir -p -- "${_tmp}"
cd -- "${_tmp}"

if test -n "${mosaic_component_log:-}" ; then
	exec 2>"${mosaic_component_log}"
fi

exec "${_exec[@]}"

exit 1
## chunk::28123944cc9e9fddd23208a1405324fb::end ##
