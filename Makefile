export node_bins=$(PWD)/node_modules/.bin
export uglifyjs=$(node_bins)/uglifyjs --mangle safari10=true
export gulp=$(node_bins)/gulp
export is_windows=false
binary=meguca
ifeq ($(GOPATH),)
	export PATH:=$(PATH):$(HOME)/go/bin
	export GOPATH=$(HOME)/go:$(PWD)/go
else
	export PATH:=$(PATH):$(GOPATH)/bin
	export GOPATH:=$(GOPATH):$(PWD)/go
endif

# Differentiate between Unix and mingw builds
ifeq ($(OS), Windows_NT)
	export PKG_CONFIG_PATH:=$(PKG_CONFIG_PATH):/mingw64/lib/pkgconfig/
	export PKG_CONFIG_LIBDIR=/mingw64/lib/pkgconfig/
	export PATH:=$(PATH):/mingw64/bin/
	export is_windows=true
	binary=meguca.exe
endif

.PHONY: server client imager test

all: server client

client: client_vendor
	$(gulp)

client_deps:
	npm install --progress false --depth 0

wasm:
	mkdir -p www/wasm
	$(MAKE) -C client_cpp
	rm -f www/wasm/main.*
	cp client_cpp/*.wasm client_cpp/*.js www/wasm
ifeq ($(DEBUG),1)
	cp client_cpp/*.wast client_cpp/*.wasm.map www/wasm
endif

wasm_clean:
	$(MAKE) -C client_cpp clean
	rm -f www/wasm/*.js www/wasm/*.wasm www/wasm/*.map www/wasm/*.wast

watch:
	$(gulp) -w

client_vendor: client_deps
	mkdir -p www/js/vendor
	cp node_modules/dom4/build/dom4.js node_modules/core-js/client/core.min.js node_modules/core-js/client/core.min.js.map node_modules/babel-polyfill/dist/polyfill.min.js node_modules/proxy-polyfill/proxy.min.js www/js/vendor
	$(uglifyjs) node_modules/whatwg-fetch/fetch.js -o www/js/vendor/fetch.js
	$(uglifyjs) node_modules/almond/almond.js -o www/js/vendor/almond.js

css:
	$(gulp) css

server: generate server_deps
	go build -v -o $(binary) meguca
ifeq ($(is_windows), true)
	cp /mingw64/bin/*.dll ./
endif

generate: generate_clean
	go get -v golang.org/x/tools/cmd/cover github.com/mattn/goveralls github.com/valyala/quicktemplate/qtc github.com/jteeuwen/go-bindata/... github.com/mailru/easyjson/...
	go generate meguca/...

generate_clean:
	rm -f go/src/meguca/db/bin_data.go go/src/meguca/lang/bin_data.go go/src/meguca/assets/bin_data.go
	rm -f go/src/meguca/common/*_easyjson.go
	rm -f go/src/meguca/config/*_easyjson.go
	rm -f go/src/meguca/websockets/feeds/*_easyjson.go
	rm -f go/src/meguca/templates/*.qtpl.go

server_deps:
	go list -f '{{.Deps}}' meguca | tr -d '[]' | xargs go get -v

update_deps:
	go get -u -v github.com/valyala/quicktemplate/qtc github.com/jteeuwen/go-bindata/... github.com/mailru/easyjson/...
	go list -f '{{.Deps}}' meguca | tr -d '[]' | xargs go list -e -f '{{if not .Standard}}{{.ImportPath}}{{end}}' | grep -v 'meguca' | xargs go get -u -v
	npm update

client_clean:
	rm -rf www/js www/css/*.css www/css/maps node_modules

clean: client_clean wasm_clean generate_clean
	rm -rf .build .ffmpeg .package go/pkg target meguca-*.zip meguca-*.tar.xz meguca meguca.exe
	$(MAKE) -C scripts/migration/3to4 clean
ifeq ($(is_windows), true)
	rm -rf /.meguca_build *.dll
endif

dist_clean: clean
	rm -rf images error.log db.db

test:
	go test -covermode=atomic -coverprofile=coverage.out --race -p 1 meguca/...
	$(go env GOPATH | awk 'BEGIN{FS=":"} {print $1}')/bin/goveralls -coverprofile=coverage.out -service=travis-ci -repotoken $(COVERALLS_TOKEN)

test_no_race:
	go test -covermode=count -coverprofile=coverage.out -p 1 meguca/...
	$(go env GOPATH | awk 'BEGIN{FS=":"} {print $1}')/bin/goveralls -coverprofile=coverage.out -service=travis-ci -repotoken $(COVERALLS_TOKEN)

check: test

upgrade_v4: generate
	go get -v github.com/dancannon/gorethink
	$(MAKE) -C scripts/migration/3to4 upgrade
