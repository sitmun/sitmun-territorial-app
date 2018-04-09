#!/bin/bash
if [ -z $PLUGIN_DIR ]; then
    PLUGIN_DIR=$(mktemp -d)
fi

echo
echo "Install dependencies script ..."
echo

if git clone https://github.com/sitmun/sitmun-plugin-core.git $PLUGIN_DIR/sitmun-plugin-core; then
    cd $PLUGIN_DIR/sitmun-plugin-core
    ./gradlew clean install
else
    echo
    echo "Install dependencies script FAILED"
    echo
    exit 1
fi

if git clone https://github.com/sitmun/sitmun-plugin-demo.git $PLUGIN_DIR/sitmun-plugin-demo; then
    cd $PLUGIN_DIR/sitmun-plugin-demo
    ./gradlew clean install
else
    echo
    echo "Install dependencies script FAILED"
    echo
    exit 1
fi
