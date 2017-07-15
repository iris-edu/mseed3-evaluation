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

export var TIMING_QUALITY = ChunkType("TIMING_QUALITY", 100, "<B",
    "value_percent")

export var LEGACY_FLAGS = ChunkType("LEGACY_FLAGS", 101, "<BBB",
    "activity_flags",
    "io_clock_flags",
    "data_quality_flags")

export var QUALITY_INDICATOR = ChunkType("QUALITY_INDICATOR", 102, "<1s",
    "value"
)

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

export var WFMETA = ChunkType("WFMETA", 20, "<fB",
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

export var MS2BLK100 = ChunkType("MS2BLK100", 1100, "", // unparsed
    "data")

export var MS2BLK200 = ChunkType("MS2BLK200", 1200, "", // unparsed
    "data")

export var MS2BLK201 = ChunkType("MS2BLK201", 1201, "", // unparsed
    "data")

export var MS2BLK300 = ChunkType("MS2BLK300", 1300, "", // unparsed
    "data")

export var MS2BLK310 = ChunkType("MS2BLK310", 1310, "", // unparsed
    "data")

export var MS2BLK320 = ChunkType("MS2BLK320", 1320, "", // unparsed
    "data")

export var MS2BLK390 = ChunkType("MS2BLK390", 1390, "", // unparsed
    "data")

export var MS2BLK395 = ChunkType("MS2BLK395", 1395, "", // unparsed
    "data")

export var MS2BLK400 = ChunkType("MS2BLK400", 1400, "", // unparsed
    "data")

export var MS2BLK405 = ChunkType("MS2BLK405", 1405, "", // unparsed
    "data")

export var MS2BLK500 = ChunkType("MS2BLK500", 1500, "", // unparsed
    "data")

