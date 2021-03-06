#!/usr/bin/env python3

import sys

if sys.version_info < (3, 0):
    sys.stdout.write("Please use Python 3 to run this script\n")
    sys.exit(1)

from lib.varint import decode_varint
from lib.chunktype import decode_chunk, UnsupportedChunk
from lib.chunks import *


if len(sys.argv) != 2:
    print("Usage: %s file" % sys.argv[0])
    sys.exit(1)

fd = open(sys.argv[1], "rb")

while True:
    sig = fd.read(3)

    if not sig:
        break

    if sig != b'MS3':
        print("invalid MS3 record")
        sys.exit(1)

    data_length = decode_varint(fd)
    pos = fd.tell()

    while fd.tell() < pos + data_length:
        try:
            # Essential chunks (ID, TIME) should be near the beginning of
            # record. Knowing the record length enables us to jump to next
            # record without parsing all chunks.

            chunk = decode_chunk(fd)

            print(chunk)

        except UnsupportedChunk as e:
            print("unsupported chunk:", e)

