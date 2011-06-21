#!/dev/null

set -e -E -u -C -o pipefail || exit 1

test "${0}" == ./sources/scavanger-mapred.sh

test "${#}" -eq 1
test -e "${1}"

curl -s -X POST -H "content-type: application/json" --data "@${1}" http://127.0.0.1:24637/mapred

exit 0
