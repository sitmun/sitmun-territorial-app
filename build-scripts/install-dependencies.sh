#!/bin/bash

echo
echo "Install dependencies script ..."
echo

if ./gradlew clean install; then
    echo
    echo "Repos cloned and clean installed..."
    echo    
else
    echo
    echo "Install dependencies script FAILED"
    echo
    exit 1
fi
