import * as varint from 'varint'
import * as struct from 'python-struct';

var decoder = {}

export function InvalidChunk(message) {
	this.message = message
}

InvalidChunk.prototype = new Error

export function UnsupportedChunk(message) {
	this.message = message
}

UnsupportedChunk.prototype = new Error

export function ChunkType(name, key, layout) {
	var fields = Array.prototype.slice.call(arguments, 3)
	var parsedLength = struct.sizeOf(layout)
	var hasdata = false

	if (fields.length > 0 && fields[fields.length-1] == 'data') {
		fields.pop()
		hasdata = true
	}

	var proto = {_name: name, _length: parsedLength+2, _type: _type, _encode: _encode, toString: toString}

	function _type(attr) {
		var chunk = Object.assign(Object.create(proto), attr)

		if (hasdata) {
			chunk._length += chunk.data.byteLength
		}

		for (let i=chunk._length; i>127; i>>=7)
			chunk._length += 1

		for (let i=key; i>127; i>>=7)
			chunk._length += 1

		return chunk
	}

	function _decode(data, offset) {
		var chunk = Object.create(proto)
		var values = struct.unpack(layout, data.slice(offset, offset+parsedLength))

		for (var i in fields) {
			chunk[fields[i]] = values[i]
		}

		if (hasdata) {
			chunk.data = data.slice(offset+parsedLength)
			chunk._length += chunk.data.byteLength
		}

		for (let i=chunk._length; i>127; i>>=7)
			chunk._length += 1

		for (let i=key; i>127; i>>=7)
			chunk._length += 1

		return chunk
	}

	function _encode() {
		var values = []

		for (var i in fields) {
			values.push(this[fields[i]])
		}

		var data = struct.pack(layout, values)

		if (hasdata) {
			var ekey = varint.encode(key)
			var elen = varint.encode(data.length + this.data.length)
			var result = new Uint8Array(ekey.length + elen.length + data.length + this.data.length)
			result.set(ekey)
			result.set(elen, ekey.length)
			result.set(data, ekey.length + elen.length)
			result.set(this.data, ekey.length + elen.length + data.length)
		}
		else {
			var ekey = varint.encode(key)
			var elen = varint.encode(data.length)
			var result = new Uint8Array(ekey.length + elen.length + data.byteLength)
			result.set(ekey)
			result.set(elen, ekey.length)
			result.set(data, ekey.length + elen.length)
		}

		return result
	}

	function toString() {
		return name + "(" + JSON.stringify(this) + ")"
	}

	decoder[key] = _decode
	return _type
}

export function decode(data, offset) {
	var key = varint.decode(data, offset)
	var bytes = varint.decode.bytes
	var length = varint.decode(data, offset + bytes)
	bytes += varint.decode.bytes

	if (length > 1024*1024) {
		throw new InvalidChunk("key=" + key + ", length=", length)
	}

	decode.bytes = bytes + length

	if (!(key in decoder)) {
		throw new UnsupportedChunk("key=" + key + ", length=", length)
	}

	return decoder[key](data, offset + bytes)
}

