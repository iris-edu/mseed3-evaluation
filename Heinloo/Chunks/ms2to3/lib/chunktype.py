import struct
import collections

from lib.varint import encode_varint, decode_varint

_chunk_registry = {}

class InvalidChunk(Exception):
    pass

class UnsupportedChunk(Exception):
    pass

class _Chunk(object):
    def _encode(self):
        if self.__hasdata:
            data = struct.pack(self.__layout, *self[:-1]) + self.data

        else:
            data = struct.pack(self.__layout, *self)

        return encode_varint(self.__key) + encode_varint(len(data)) + data

    @classmethod
    def _decode(cls, data):
        if cls.__hasdata:
            kwargs = {'data': data[cls.__parsed_length:]}

        else:
            kwargs = {}

        return cls(*struct.unpack(cls.__layout, data[:cls.__parsed_length]), **kwargs)

def ChunkType(name, key, layout, *fields):
    hasdata = (len(fields) > 0 and fields[-1] == 'data')
    cls = type(name, (_Chunk, collections.namedtuple(name, fields)),
                     {'_Chunk__key': key,
                      '_Chunk__layout': layout,
                      '_Chunk__parsed_length': struct.calcsize(layout),
                      '_Chunk__hasdata': hasdata})

    _chunk_registry[key] = cls
    return cls

def decode_chunk(stream):
    key = decode_varint(stream)
    data_len = decode_varint(stream)

    if data_len > 1024*1024:
        raise InvalidChunk("key=%d, length=%d" % (key, data_len))

    data = stream.read(data_len)

    try:
        cls = _chunk_registry[key]

    except KeyError:
        raise UnsupportedChunk("key=%d, length=%d" % (key, data_len))

    return cls._decode(data)

