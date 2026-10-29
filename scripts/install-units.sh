#!/bin/sh
# Install the systemd user units. Does not enable or start anything.
set -e
repo=$(cd "$(dirname "$0")/.." && pwd)
dest="$HOME/.config/systemd/user"
mkdir -p "$dest"
cp "$repo/systemd/satisfactory.service" "$dest/"
sed "s|@REPO@|$repo|" "$repo/systemd/adadmin.service" >"$dest/adadmin.service"
systemctl --user daemon-reload
echo "Installed satisfactory.service and adadmin.service into $dest"
