#!/bin/bash
if [ -z $PLUGIN_DIR ]; then
    export PLUGIN_DIR=$(mktemp -d)
fi

echo
echo "Install dependencies script ..."
echo

if ./gradlew cloneDependencyRepos; then
    echo
    echo "Repos cloned ..."
    echo
    for D in $PLUGIN_DIR/*/; do cd ${D}; ./build-scripts/install-dependencies.sh; ./gradlew clean install; done
else
    echo
    echo "Install dependencies script FAILED"
    echo
    exit 1
fi
