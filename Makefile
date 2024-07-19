
MANIFEST_FILE := public/manifest.json
VERSION := $(shell jq -r '.version' $(MANIFEST_FILE))

release:
	zip -r versions/release-$(VERSION).zip build