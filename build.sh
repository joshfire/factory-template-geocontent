#!/bin/bash

echo "Remove previous version of minified JS code..."
rm app/js/*.js
echo "Remove previous version of minified JS code... done"

echo "Minify JS code..."
for i in app/srcjs/*.js; do cat $i | uglifyjs > ${i/srcjs/js}; done
echo "Minify JS code... done"