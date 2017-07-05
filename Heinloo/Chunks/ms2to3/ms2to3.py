#!/usr/bin/env python3

import sys

if sys.version_info < (3, 0):
    sys.stdout.write("Please use Python 3 to run this script\n")
    sys.exit(1)

import io
import binascii
from lib.chunks import *
from lib.mseed2 import MS2Record, EndOfData

MS2BLK = {
    100: MS2BLK100,
    200: MS2BLK200,
    201: MS2BLK201,
    300: MS2BLK300,
    310: MS2BLK310,
    320: MS2BLK320,
    390: MS2BLK390,
    395: MS2BLK395,
    400: MS2BLK400,
    405: MS2BLK405,
    500: MS2BLK500
}

class MS3Writer(object):
    def __init__(self, stream):
        self.__stream = stream
        self.__data = b"MS30"

    def add_chunk(self, chunk):
        self.__data += chunk._encode()

    def flush(self):
	"""Finish and write a record"""

        chunk = CRC32(
            value = binascii.crc32(self.__data)
        )
        self.__data += chunk._encode()

        # add NULL chunk to mark the end of record
        self.__data += b'\0\0'
        self.__stream.write(self.__data)

        # next record starts here
        self.__data = b"MS30"

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

    chunk = LEGACY_FLAGS(
        activity_flags = rec.aflags,
        io_clock_flags = rec.cflags,
        data_quality_flags = rec.qflags
    )
    writer.add_chunk(chunk)

    for bnum, bdata in rec.blockettes:
        try:
            chunk = MS2BLK[bnum](
                data=bdata
            )
            writer.add_chunk(chunk)

        except KeyError:
            pass

    chunk = SENSOR(
        vendor_id = 0x1111,
        product_id = 0x2222,
        serial_no = 0x3333,
        preset = 0x44
    )
    writer.add_chunk(chunk)

    chunk = DATALOGGER(
        vendor_id = 0x5555,
        product_id = 0x6666,
        serial_no = 0x7777,
        preset = 0x88
    )
    writer.add_chunk(chunk)

    if rec.data:
        chunk = WFDATA(
            sample_rate = rec.sample_rate,
            encoding = rec.encoding,
            number_of_samples = rec.nsamp,
            data = rec.data
        )
        writer.add_chunk(chunk)

    # Finish the MS3 record
    writer.flush()


if len(sys.argv) != 2:
    print(sys.argv)
    print("Usage: ms2to3 file")
    sys.exit(1)

fd_in = open(sys.argv[1], "rb")
fd_out = open(sys.argv[1] + ".ms3", "wb")
writer = MS3Writer(fd_out)

while True:
    try:
        rec = MS2Record(fd_in)
        process_ms2_record(rec)

    except EndOfData:
        break

