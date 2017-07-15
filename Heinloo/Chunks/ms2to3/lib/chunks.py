if __name__ == "lib.chunkspb":
    from lib.chunktypepb import ChunkType
else:
    from lib.chunktype import ChunkType

# ChunkType(name, key, layout, *fields)

NULL_CHUNK = ChunkType("NULL_CHUNK", 0, "")

ID_FDSN = ChunkType("ID_FDSN", 1, "", # unparsed
    "data")

ABS_TIME = ChunkType("ABS_TIME", 2, "<HHBBBLB",
    "year",
    "doy",
    "hour",
    "minute",
    "second",
    "microsecond",
    "flags")

DATA_VERSION = ChunkType("DATA_VERSION", 90, "<B",
    "value"
)

TIMING_QUALITY = ChunkType("TIMING_QUALITY", 100, "<B",
    "value_percent")

LEGACY_FLAGS = ChunkType("LEGACY_FLAGS", 101, "<BBB",
    "activity_flags",
    "io_clock_flags",
    "data_quality_flags")

QUALITY_INDICATOR = ChunkType("QUALITY_INDICATOR", 102, "<1s",
    "value"
)

SENSOR = ChunkType("SENSOR", 10, "<HHHBB",
    "vendor_id",
    "product_id",
    "serial_no",
    "channel",
    "preset")

DATALOGGER = ChunkType("DATALOGGER", 11, "<HHHBB",
    "vendor_id",
    "product_id",
    "serial_no",
    "channel",
    "preset")

WFMETA = ChunkType("WFMETA", 20, "<fB",
    "sample_rate_period",
    "encoding")

WFDATA = ChunkType("WFDATA", 21, "<B",
    "number_of_samples",
    "data")

WFDATA_LARGE = ChunkType("WFDATA_LARGE", 22, "<L",
    "number_of_samples",
    "data")

CRC32 = ChunkType("CRC32", 30, "<L",
    "value")

MS2BLK100 = ChunkType("MS2BLK100", 1100, "", # unparsed
    "data")

MS2BLK200 = ChunkType("MS2BLK200", 1200, "", # unparsed
    "data")

MS2BLK201 = ChunkType("MS2BLK201", 1201, "", # unparsed
    "data")

MS2BLK300 = ChunkType("MS2BLK300", 1300, "", # unparsed
    "data")

MS2BLK310 = ChunkType("MS2BLK310", 1310, "", # unparsed
    "data")

MS2BLK320 = ChunkType("MS2BLK320", 1320, "", # unparsed
    "data")

MS2BLK390 = ChunkType("MS2BLK390", 1390, "", # unparsed
    "data")

MS2BLK395 = ChunkType("MS2BLK395", 1395, "", # unparsed
    "data")

MS2BLK400 = ChunkType("MS2BLK400", 1400, "", # unparsed
    "data")

MS2BLK405 = ChunkType("MS2BLK405", 1405, "", # unparsed
    "data")

MS2BLK500 = ChunkType("MS2BLK500", 1500, "", # unparsed
    "data")

