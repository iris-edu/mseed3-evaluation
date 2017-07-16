import {ChunkType} from './chunktype'

// ChunkType(name, key, layout, *fields)

export var NULL_CHUNK = ChunkType("NULL_CHUNK", 0, "")

export var ID_FDSN = ChunkType("ID_FDSN", 1, "", // unparsed
    "data")

export var ABS_TIME = ChunkType("ABS_TIME", 2, "<HHBBBLB",
    "year",
    "doy",
    "hour",
    "minute",
    "second",
    "microsecond",
    "flags")

export var DATA_VERSION = ChunkType("DATA_VERSION", 90, "<B",
    "value"
)

export var QUALITY_INDICATOR = ChunkType("QUALITY_INDICATOR", 91, "<1s",
    "value"
)

export var TIMING_QUALITY = ChunkType("TIMING_QUALITY", 100, "<B",
    "value_percent")

export var SENSOR = ChunkType("SENSOR", 10, "<HHHBB",
    "vendor_id",
    "product_id",
    "serial_no",
    "channel",
    "preset")

export var DATALOGGER = ChunkType("DATALOGGER", 11, "<HHHBB",
    "vendor_id",
    "product_id",
    "serial_no",
    "channel",
    "preset")

export var WFMETA = ChunkType("WFMETA", 20, "<dB",
    "sample_rate_period",
    "encoding")

export var WFDATA = ChunkType("WFDATA", 21, "<B",
    "number_of_samples",
    "data")

export var WFDATA_LARGE = ChunkType("WFDATA_LARGE", 22, "<L",
    "number_of_samples",
    "data")

export var CRC32 = ChunkType("CRC32", 30, "<L",
    "value")

