#!/usr/bin/env python3

import sys
from lib.chunktype import decode_chunk, UnsupportedChunk
from lib.chunks import *


if len(sys.argv) != 2:
    print(sys.argv)
    print("Usage: msi3 file")
    sys.exit(1)

fd = open(sys.argv[1], "rb")

while True:
    sig = fd.read(4)

    if not sig:
        break

    if sig != b'MS30':
        print('not an MS30 file')
        sys.exit(1)

    while True:
        try:
            chunk = decode_chunk(fd)

            print(chunk)

            if type(chunk) == NULL_CHUNK:
                break

        except UnsupportedChunk as e:
            print("unsupported chunk:", e)

