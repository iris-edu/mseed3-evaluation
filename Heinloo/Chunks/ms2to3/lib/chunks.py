from lib.chunktype import ChunkType

# ChunkType(name, key, layout, parsed_length, *fields)

NULL_CHUNK = ChunkType("NULL_CHUNK", 0, "", 0)

ID_FDSN = ChunkType("ID_FDSN", 1, "", 0, # unparsed
    "data")

ABS_TIME = ChunkType("ABS_TIME", 2, "<HHBBBLB", 12,
    "year",
    "doy",
    "hour",
    "minute",
    "second",
    "microsecond",
    "flags")

TIMING_QUALITY = ChunkType("TQ", 100, "<B", 1,
    "value_percent")

LEGACY_FLAGS = ChunkType("LEGACY_FLAGS", 101, "<BBB", 3,
    "activity_flags",
    "io_clock_flags",
    "data_quality_flags")

SENSOR = ChunkType("SENSOR", 10, "<HHHB", 7,
    "vendor_id",
    "product_id",
    "serial_no",
    "preset")

DATALOGGER = ChunkType("DATALOGGER", 11, "<HHHB", 7,
    "vendor_id",
    "product_id",
    "serial_no",
    "preset")

WFDATA = ChunkType("WFDATA", 20, "<fBH", 7,
    "sample_rate",
    "encoding",
    "number_of_samples",
    "data")

CRC32 = ChunkType("CRC32", 30, "<L", 4,
    "value")

MS2BLK100 = ChunkType("MS2BLK100", 1100, "", 0, # unparsed
    "data")

MS2BLK200 = ChunkType("MS2BLK200", 1200, "", 0, # unparsed
    "data")

MS2BLK201 = ChunkType("MS2BLK201", 1201, "", 0, # unparsed
    "data")

MS2BLK300 = ChunkType("MS2BLK300", 1300, "", 0, # unparsed
    "data")

MS2BLK310 = ChunkType("MS2BLK310", 1310, "", 0, # unparsed
    "data")

MS2BLK320 = ChunkType("MS2BLK320", 1320, "", 0, # unparsed
    "data")

MS2BLK390 = ChunkType("MS2BLK390", 1390, "", 0, # unparsed
    "data")

MS2BLK395 = ChunkType("MS2BLK395", 1395, "", 0, # unparsed
    "data")

MS2BLK400 = ChunkType("MS2BLK400", 1400, "", 0, # unparsed
    "data")

MS2BLK405 = ChunkType("MS2BLK405", 1405, "", 0, # unparsed
    "data")

MS2BLK500 = ChunkType("MS2BLK500", 1500, "", 0, # unparsed
    "data")

