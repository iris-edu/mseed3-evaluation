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

QUALITY_INDICATOR = ChunkType("QUALITY_INDICATOR", 91, "<1s",
    "value"
)

TIMING_QUALITY = ChunkType("TIMING_QUALITY", 100, "<B",
    "value_percent")

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

WFMETA = ChunkType("WFMETA", 20, "<dB",
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

