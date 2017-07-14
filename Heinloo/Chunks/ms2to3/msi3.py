#!/usr/bin/env python3

import sys

if sys.version_info < (3, 0):
    sys.stdout.write("Please use Python 3 to run this script\n")
    sys.exit(1)

from lib.varint import decode_varint
from lib.chunktypepb import decode_chunk, UnsupportedChunk
from lib.chunks import *


if len(sys.argv) != 2:
    print(sys.argv)
    print("Usage: msi3 file")
    sys.exit(1)

fd = open(sys.argv[1], "rb")

while True:
    sig = fd.read(3)

    if not sig:
        break

    if sig != b'MS3':
        print("invalid MS30 record")
        sys.exit(1)

    record_length = decode_varint(fd)
    data = fd.read(record_length)
    pos = 0

    while pos < record_length:
        try:
            # Essential chunks (ID, TIME) should be near the beginning of
            # record. In addition to that we should know the record length,
            # which would enable us to jump to next record without parsing all
            # chunks.

            chunk, pos = decode_chunk(data, pos)

            print(chunk)

        except UnsupportedChunk as e:
            print("unsupported chunk:", e)

