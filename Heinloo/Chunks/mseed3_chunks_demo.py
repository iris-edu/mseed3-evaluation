#!/usr/bin/env python3

# This demo program illustrates the encoding and decoding of "chunks", which are
# closely related to MS2 blockettes, but more efficient.
#
# Example allocation of chunk types:
#
# 0..999999 organizations
#     0..99999 FDSN standard
#         0..127 essential chunks (1-byte ID)
#             0 special purpose
#             100 timing quality
#             126 opaque (tilde-delimited strings)
#             127 generic (UUID-based)
#         128..16383 important chunks (2-byte ID)
#             1000..2000 MS2 blockettes (deprecated)
#                 1000 blockette 1000
#                 1001 blockette 1001
#                 1100 blockette 100
#                 1200 blockette 200
#     100000..199999 IRIS extensions
#     200000..299999 EIDA extensions
# 1000000..1999999 manufacturer extensions
#     1000000..1009999 Quanterra
#     1010000..1019999 Nanometrics
#
# Varint implementation is based on https://github.com/fmoo/python-varint/

import io

def encode_varint(number):
    buf = b''
    while True:
        towrite = number & 0x7f
        number >>= 7
        if number:
            buf += bytes(((towrite | 0x80),))
        else:
            buf += bytes((towrite,))
            break
    return buf

def decode_varint(stream):
    shift = 0
    result = 0
    while True:
        i = ord(stream.read(1))
        result |= (i & 0x7f) << shift
        shift += 7
        if not (i & 0x80):
            break
    return result

def encode_chunk(key, data):
    return encode_varint(key) + encode_varint(len(data)) + data

def decode_chunk(stream):
    key = decode_varint(stream)
    data_len = decode_varint(stream)
    data = stream.read(data_len)
    return (key, data)


#================================================================================
# Encoding an MS2 blockette (200) as MS3 chunk
#================================================================================
 
# Chunk type
MS2BLK200_TYPE = 1200

# length of blockette 200 (minus type and next blockettes byte number)
# according to SEED 2.4 manual
MS2BLK200_LEN = 4+4+4+1+1+10+24

# data
MS2BLK200_DATA = b"DATA"*12

assert len(MS2BLK200_DATA) == MS2BLK200_LEN

ms2blk200_chunk = encode_chunk(MS2BLK200_TYPE, MS2BLK200_DATA)

print("length of MS2BLK200 chunk:", len(ms2blk200_chunk))


#================================================================================
# Encoding timing quality as MS3 chunk
#================================================================================
 
# Chunk type
TQ_TYPE = 100

# Chunk data (the value of timing quality is 100%)
TQ_DATA = bytes((100,))

tq_chunk = encode_chunk(TQ_TYPE, TQ_DATA)

print("length of timing quality chunk:", len(tq_chunk))


#================================================================================
# Decoding multiple chunks
#================================================================================
 
chunk_data = ms2blk200_chunk + tq_chunk + b'\0\0'

print("raw chunk data:", chunk_data)

chunk_types = {
    100: ("TQ", lambda b: int(b[0])),
    1200: ("MS2BLK200", lambda b: b)
}

stream = io.BytesIO(chunk_data)

while True:
    (key, data) = decode_chunk(stream)

    if key == 0:
        break

    print("type = %d (%s), data = %s" % (key, chunk_types[key][0], chunk_types[key][1](data)))
