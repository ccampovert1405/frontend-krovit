#!/bin/sh
echo "Copiando artefactos al volumen..."
cp -r /app/dist/* /output/
ls -l /output
tail -f /dev/null
