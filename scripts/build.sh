#!/bin/bash
mkdir -p scripts
cp dist/src/content-script.js scripts/
cp dist/popup/popup.js popup/
cp dist/src/service-worker.js .