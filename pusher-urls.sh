#!/dev/null

set -e -E -u -C -o pipefail || exit 1

(
	cat ./pusher-urls.txt
	curl -s 'http://search.twitter.com/search' \
	| grep -o -E -e 'href="/search\?q=[^ ]+"' \
	| sed -r -e 's|^href="/search(.*)"|http://search.twitter.com/search.atom\1|' \
) \
| sort -u \
>./pusher-urls-new.txt

mv ./pusher-urls-new.txt ./pusher-urls.txt
