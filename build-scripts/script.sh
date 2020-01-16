#!/bin/bash
echo
echo "Building script ..."
echo

# Permission to Github package repository is required
npm set //npm.pkg.github.com/:_authToken $GITHUB_API_KEY

cd $TRAVIS_BUILD_DIR
if ./gradlew clean assemble check --info --stacktrace; then
    echo
else
    echo
    echo "Building script FAILED"
    echo
    exit 1
fi
