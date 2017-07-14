import io

from google.protobuf.internal import encoder as _encoder, decoder as _decoder
from google.protobuf.internal.encoder import _EncodeVarint as _encode_varint
from google.protobuf.internal.decoder import _DecodeVarint32 as _decode_varint

_chunk_registry = {}

_enc_dec = {
    'B': (0, _encoder.UInt32Encoder, _decoder.UInt32Decoder),
    'H': (0, _encoder.UInt32Encoder, _decoder.UInt32Decoder),
    'L': (0, _encoder.UInt32Encoder, _decoder.UInt32Decoder),
    'b': (0, _encoder.SInt32Encoder, _decoder.SInt32Decoder),
    'h': (0, _encoder.SInt32Encoder, _decoder.SInt32Decoder),
    'l': (0, _encoder.SInt32Encoder, _decoder.SInt32Decoder),
    'f': (5, _encoder.FloatEncoder, _decoder.FloatDecoder),
    'd': (1, _encoder.DoubleEncoder, _decoder.DoubleDecoder),
    's': (2, _encoder.StringEncoder, _decoder.StringDecoder),
    'X': (2, _encoder.BytesEncoder, _decoder.BytesDecoder)
}

class InvalidChunk(Exception):
    pass

class UnsupportedChunk(Exception):
    pass

class _Chunk(object):
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def _encode(self):
        b = io.BytesIO()

        for n, f in enumerate(self.__field_names):
            try:
                v = self.__dict__[f]

            except:
                continue

            self.__field_encoders[n](b.write, v)

        data = b.getvalue()

        if len(self.__field_names) == 1:
            # single-field blockette does not need grouping
            return data

        b = io.BytesIO()
        _encode_varint(b.write, (self.__key << 3) | 2)
        _encode_varint(b.write, len(data))

        return b.getvalue() + data

    def __decode_single_field(self, data, pos, wt, n):
        try:
            if self.__field_types[n] != wt:
                raise InvalidChunk("chunk " + self.__key + " field " + n + " has invalid wire type " + wt)

        except KeyError:
            pass

        return self.__field_decoders[n](data, pos, len(data), None, self.__dict__)

    def __decode_multi_field(self, data, pos, end):
        while pos < end:
            tag, pos = _decode_varint(data, pos)
            wt = tag & 0x7
            n = (tag >> 3) - 1
            pos = self.__decode_single_field(data, pos, wt, n)

        return pos

    @classmethod
    def _decode(cls, data, pos, wt):
        chunk = cls()

        if wt == 2 and len(chunk.__field_names) > 1:
            length, pos = _decode_varint(data, pos)
            pos = chunk.__decode_multi_field(data, pos, pos+length)

        else:
            pos = chunk.__decode_single_field(data, pos, wt, 0)

        return chunk, pos

    def __str__(self):
        return type(self).__name__ + "(" + ", ".join(f + "=" + str(self.__dict__.get(f)) for f in self.__field_names) + ")"


def ChunkType(name, key, layout, *fields):
    # keep API compatibility for now
    layout = layout.replace('1', '')

    if len(layout) == 0:
        layout += '<'

    if (len(fields) > 0 and fields[-1] == 'data'):
        layout += 'X'

    field_types = []
    field_encoders = []
    field_decoders = []

    if len(fields) == 1:
        # single-field blockette does not need grouping
        wt, enc, dec = _enc_dec[layout[1]]
        field_types.append(wt)
        field_encoders.append(enc(key, False, False))
        field_decoders.append(dec(key, False, False, fields[0], None))

    else:
        for n, f in enumerate(fields):
            wt, enc, dec = _enc_dec[layout[n+1]]
            field_types.append(wt)
            field_encoders.append(enc(n+1, False, False))
            field_decoders.append(dec(n+1, False, False, f, None))

    cls = type(name, (_Chunk,),
                     {'_Chunk__key': key,
                      '_Chunk__field_names': fields,
                      '_Chunk__field_types': field_types,
                      '_Chunk__field_encoders': field_encoders,
                      '_Chunk__field_decoders': field_decoders})

    _chunk_registry[key] = cls
    return cls

def decode_chunk(data, pos):
    tag, pos = _decode_varint(data, pos)
    wt = tag & 0x7
    key = tag >> 3

    try:
        cls = _chunk_registry[key]

    except KeyError:
        # TODO: recover
        raise UnsupportedChunk("key=%d" % key)

    return cls._decode(data, pos, wt)

