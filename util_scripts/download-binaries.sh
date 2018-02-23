#!/bin/bash

set -e

SCRIPT_DIR=`dirname $0`


BIN_DIR=$1
if [ -z "$BIN_DIR" ]; then
    BIN_DIR=bin
fi
mkdir -p $BIN_DIR



OPENVPN_VERSION=v2.4.4-1 #standalone build version
OPENVPN_BINARY=$BIN_DIR/openvpn

if [ ! -f "$OPENVPN_BINARY" ] || [ ! -z "$FORCE_DOWNLOAD" ]; then
    $SCRIPT_DIR/git-asset-dl.sh MysteriumNetwork standalone-openvpn $OPENVPN_VERSION openvpn_osx
    mv openvpn_osx $OPENVPN_BINARY
    chmod +x $OPENVPN_BINARY
else
    echo $OPENVPN_BINARY" exists and download not forced..."
fi
MYSTERIUM_CLIENT_BINARY=$BIN_DIR/mysterium_client

if [ ! -f "$MYSTERIUM_CLIENT_BINARY" ] || [ ! -z "$FORCE_DOWNLOAD" ]; then
    $SCRIPT_DIR/git-branch-dl.sh MysteriumNetwork build-artifacts mysterium_osx mysterium_client.tar.gz
    tar -xf mysterium_client.tar.gz -C $BIN_DIR && rm -rf mysterium_client.tar.gz
    chmod +x $MYSTERIUM_CLIENT_BINARY
else
    echo $MYSTERIUM_CLIENT_BINARY" exists and download not forced..."
fi
