#!/usr/bin/env python3

import sys

if sys.version_info < (3, 0):
    sys.stdout.write("Please use Python 3 to run this script\n")
    sys.exit(1)

from lib.varint import decode_varint
from lib.chunktypepb import decode_chunk, UnsupportedChunk
from lib.chunkspb import *


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
    data = fd.read(data_length)
    pos = 0

    while pos < data_length:
        try:
            # Essential chunks (ID, TIME) should be near the beginning of
            # record. Knowing the record length enables us to jump to next
            # record without parsing all chunks.

            chunk, pos = decode_chunk(data, pos)

            print(chunk)

        except UnsupportedChunk as e:
            print("unsupported chunk:", e)

            # TODO: skip chunk
            sys.exit(1)

