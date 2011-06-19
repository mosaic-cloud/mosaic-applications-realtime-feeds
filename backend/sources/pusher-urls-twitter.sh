#!/dev/null

set -e -E -u -C -o pipefail || exit 1

test "${0}" == ./sources/pusher-urls-twitter.sh

(
	cat ./sources/pusher-urls-twitter.txt
	
	curl -s -X POST -H "content-type: application/json" --data @./sources/pusher-urls-twitter-hashtags.json http://127.0.0.1:24637/mapred \
	| grep -o -E -e '"#[^"]+"' \
	| sed -r -e 's|^"#(.*)"$|http://search.twitter.com/search.atom?q=%23\1|'
	
	curl -s 'http://search.twitter.com/search' \
	| grep -o -E -e 'href="/search\?q=[^ ]+"' \
	| sed -r -e 's|^href="/search(.*)"|http://search.twitter.com/search.atom\1|' \
) \
| sort -u \
>./sources/pusher-urls-twitter-new.txt

mv ./sources/pusher-urls-twitter-new.txt ./sources/pusher-urls-twitter.txt

exit 0
