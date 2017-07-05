# Varint implementation is based on https://github.com/fmoo/python-varint/

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

