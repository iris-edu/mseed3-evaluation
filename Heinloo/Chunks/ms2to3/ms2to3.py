#!/usr/bin/env python3

import sys

if sys.version_info < (3, 0):
    sys.stdout.write("Please use Python 3 to run this script\n")
    sys.exit(1)

import io
import binascii

if sys.argv[0] == "ms2to3-protobuf.py":
    from lib.chunkspb import *
    file_extension = "ms3pb"
else:
    from lib.chunks import *
    file_extension = "ms3"

from lib.varint import encode_varint
from lib.mseed2 import MS2Record, EndOfData

class MS3Writer(object):
    def __init__(self, stream):
        self.__stream = stream
        self.__data = bytes()

    def add_chunk(self, chunk):
        self.__data += chunk._encode()

    def flush(self):
        """Finish and write a record"""

        chunk = CRC32(
            value = binascii.crc32(self.__data)
        )
        self.__data += chunk._encode()

        self.__stream.write(b"MS3" + encode_varint(len(self.__data)) + self.__data)

        # next record starts here
        self.__data = bytes()

def process_ms2_record(rec):
    if rec.loc:
        id_string = "%s.%s.%s:%s" % (rec.net, rec.sta, rec.loc, rec.cha)

    else:
        id_string = "%s.%s.%s" % (rec.net, rec.sta, rec.cha)

    chunk = ID_FDSN(
        data = id_string.encode('ascii')
    )
    writer.add_chunk(chunk)

    flags = 0

    if rec.qflags & (1<<7):
        flags |= 0x01

    if rec.cflags & (1<<5):
        flags |= 0x02

    chunk = ABS_TIME(
        year = rec.year,
        doy = rec.doy,
        hour = rec.hour,
        minute = rec.minute,
        second = rec.second,
        microsecond = rec.microsecond,
        flags = flags
    )
    writer.add_chunk(chunk)

    if rec.timing_quality != -1:
        chunk = TIMING_QUALITY(
            value_percent = rec.timing_quality
        )
        writer.add_chunk(chunk)

    if rec.rectype != b'D':
        chunk = QUALITY_INDICATOR(
            value = rec.rectype
        )
        writer.add_chunk(chunk)

    channel = "ZNE".find(id_string[-1])

    chunk = SENSOR(
        vendor_id = 0x1111,
        product_id = 0x2222,
        serial_no = 0x3333,
        channel = channel,
        preset = 0x44
    )
    writer.add_chunk(chunk)

    chunk = DATALOGGER(
        vendor_id = 0x5555,
        product_id = 0x6666,
        serial_no = 0x7777,
        channel = channel,
        preset = 0x88
    )
    writer.add_chunk(chunk)

    if rec.data:
        chunk = WFMETA(
            sample_rate_period = rec.sample_rate,
            encoding = rec.encoding
	)
        writer.add_chunk(chunk)

        chunk = (WFDATA if rec.nsamp <= 255 else WFDATA_LARGE)(
            number_of_samples = rec.nsamp,
            data = rec.data
        )
        writer.add_chunk(chunk)

    # Finish the MS3 record
    writer.flush()


if len(sys.argv) != 2:
    print("Usage: %s file" % sys.argv[0])
    sys.exit(1)

fd_in = open(sys.argv[1], "rb")
fd_out = open(sys.argv[1] + "." + file_extension, "wb")
writer = MS3Writer(fd_out)

while True:
    try:
        rec = MS2Record(fd_in)
        process_ms2_record(rec)

    except EndOfData:
        break

