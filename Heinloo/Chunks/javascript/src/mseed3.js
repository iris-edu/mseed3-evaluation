/*global DataView*/
/**
 * Philip Crotwell
 * University of South Carolina, 2017
 * http://www.seis.sc.edu
 *
 * Modified by Andres H.
 */

import * as seedcodec from 'seisplotjs-seedcodec'
import * as model from 'seisplotjs-model'
import * as crc32 from 'crc-32'
import * as fdsn from './chunks-fdsn'
import * as chunktype from './chunktype'

export const MAGIC = 'MS30'
export const FDSN_PREFIX = 'FDSN'
export const UNKNOWN_DATA_VERSION = 255;

/** parse arrayBuffer into an array of DataRecords. */
export function parseDataRecords(arrayBuffer) {
	let dataRecords = []
	let offset = 0
	while (offset < arrayBuffer.byteLength) {
		let bytearray = new Uint8Array(arrayBuffer, offset)
		let dr = new DataRecord(bytearray)
		dataRecords.push(dr)
		offset += dr.getRecordSize()
	}
	return dataRecords
}

/** Represents an MS3 Data Record */
export class DataRecord {
	constructor(bytearray) {
		this.recordIndicator = 'MS';
		this.formatVersion = 30;
		this.size = MAGIC.length
		this.dataLength = 0
		this.identifierLength = 0
		this.numSamples = 0
		this.crc = undefined
		this.decompData = undefined
		this.extraHeadersLength = 0
		this.extraHeaders = {}
		this.chunks = []

		// API compatibility
		this.header = this
		this.footer = this

		if (!bytearray) {
			// empty record
			return
		}

		var magic = makeString(bytearray, 0, MAGIC.length)

		if (magic != MAGIC) {
			throw new Error("First "+MAGIC.length+" bytes of record should be "+MAGIC+" but found "+magic)
		}

		var offset = MAGIC.length

		while(true) {
			let chunk = chunktype.decode(bytearray, offset)
			offset += chunktype.decode.bytes
			this.addChunk(chunk)

			if (chunk._type == fdsn.NULL_CHUNK)
				break
		}
	}

	addChunk(chunk) {
		this.chunks.push(chunk)
		this.size += chunk._length

		if (chunk._type == fdsn.ID_FDSN) {
			this.identifierLength = chunk._length
			this.identifier = makeString(chunk.data, 0, chunk._length)
		}
		else if (chunk._type == fdsn.ABS_TIME) {
			this.year = chunk.year
			this.dayOfYear = chunk.doy
			this.hour = chunk.hour
			this.minute = chunk.minute
			this.second = chunk.second
			this.microsecond = chunk.microsecond
			this.flags = chunk.flags
		}
		else if (chunk._type == fdsn.DATA_VERSION) {
			this.version = chunk.value
		}
		else if (chunk._type == fdsn.WFMETA) {
			this.sampleRatePeriod = chunk.sample_rate_period
			this.encoding = chunk.encoding
		}
		else if (chunk._type == fdsn.WFDATA) {
			this.numSamples += chunk.number_of_samples
			this.dataLength += chunk._length
		}
		else if (chunk._type == fdsn.WFDATA_LARGE) {
			this.numSamples += chunk.number_of_samples
			this.dataLength += chunk._length
		}
		else {
			this.extraHeaders[chunk._name] = chunk
			this.extraHeadersLength += chunk._length
		}
	}

	getSize() {
		return this.size
	}

	decompress() {
		// only decompress once as it is expensive operation
		if ( typeof this.decompData === 'undefined') {
			this.decompData = []
			this.decompData.header = this

			for (let i in this.chunks) {
				if (this.chunks[i]._type == fdsn.WFDATA || this.chunks[i]._type == fdsn.WFDATA_LARGE) {
					let d = this.chunks[i].data
					let dv = new DataView(d.buffer, d.byteOffset, d.byteLength)
					this.decompData = this.decompData.concat(seedcodec.decompress(this.encoding, dv, this.chunks[i].number_of_samples, false))
				}
			}
		}

		return this.decompData
	}

	codes() {
		return this.identifier
	}

	save(dataView) {
		var bytearray = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
		var offset = 0

		for (let i=0; i<MAGIC.length; i++) {
			bytearray[offset++] = MAGIC.charCodeAt(i)
		}

		for (let i in this.chunks) {
			let data = this.chunks[i]._encode()
			bytearray.set(data, offset)
			offset += data.length
		}

		this.crc = crc32.buf(bytearray.slice(0, offset))

		var chunk = fdsn.CRC32({
			value: this.crc
		})

		var data = chunk._encode()

		bytearray.set(data, offset)
		offset += data.length

		// add NULL chunk to mark the end of record
		bytearray[offset++] = 0
		bytearray[offset++] = 0

		return offset
	}

	blob() {
		var magicData = new Uint8Array(MAGIC.length)

		for (let i=0; i<MAGIC.length; i++) {
			magicData[i] = MAGIC.charCodeAt(i)
		}

		var data = [magicData]

		for (let i in this.chunks) {
			data.push(this.chunks[i]._encode())
		}

		this.crc = undefined

		for (let i in data) {
			this.crc = crc32.buf(data[i], this.crc)
		}

		var chunk = fdsn.CRC32({
			value: this.crc
		})

		data.push(chunk._encode())

		// add NULL chunk to mark the end of record
		data.push(new Uint8Array(2))

		return new Blob(data)
	}

	getStartFieldsAsISO() {
		let msString = "";
		if (this.microsecond < 10) { msString = "00000"; }
		else if (this.microsecond < 100) { msString = "0000"; }
		else if (this.microsecond < 1000) { msString = "000"; }
		else if (this.microsecond < 10000) { msString = "00"; }
		else if (this.microsecond < 100000) { msString = "0"; }
		return ''+this.year
			+padZeros(this.dayOfYear, 3)+'T'+padZeros(this.hour, 2)+padZeros(this.minute, 2)+padZeros(this.second, 2)+"."+padZeros(this.microsecond, 6);
	}
}

function makeString(bytearray, offset, length) {
	let out = ""
	for (let i=offset; i<offset+length; i++) {
		let charCode = bytearray[i]
		if (charCode > 31) {
			out += String.fromCharCode(charCode)
		}
	}
	return out.trim()
}

function padZeros(val, len) {
	let out = ""+val;
	while (out.length < len) {
		out = "0"+out;
	}
	return out;
}

/* MSeed2 to MSeed3 converstion */

export function convertMS2toMS3(mseed2) {
	let out = []
	for (let i=0; i<mseed2.length; i++) {
		out.push(convertMS2Record(mseed2[i]))
	}
	return out
}

export function convertMS2Record(ms2record) {
	var ms3R = new DataRecord()
	var ms2H = ms2record.header

	var idString = FDSN_PREFIX + ':' +ms2H.netCode + '.' + ms2H.staCode + '.' + ( ms2H.locCode ? (ms2H.locCode+':') : "" ) + ms2H.chanCode
	var idData = new Uint8Array(idString.length)

	for (let i=0; i<idString.length; i++) {
		// not ok for unicode?
		idData[i] = idString.charCodeAt(i)
	}

	var chunk = fdsn.ID_FDSN({
		data: idData
	})
	ms3R.addChunk(chunk)

	var year = ms2H.startBTime.year
	var dayOfYear = ms2H.startBTime.jday
	var hour = ms2H.startBTime.hour
	var minute = ms2H.startBTime.min
	var second = ms2H.startBTime.sec
	var microsecond = ms2H.startBTime.tenthMilli * 100
	var sampleRatePeriod = ms2H.sampleRate > 1 ? ms2H.sampleRate : (1.0 / ms2H.sampleRate);  
	var timingQuality = -1
	var micros = 0

	for (let i=0; i<ms2H.blocketteList.length; i++) {
		let blockette = ms2H.blocketteList[i]
		if (blockette.type === 100) {
			sampleRatePeriod = blockette.body.getFloat32(4)
		} else if (blockette.type === 1001) {
			micros = blockette.body.getInt8(6)
			timingQuality = blockette.body.getUint8(4)
		}
	}

	microsecond += micros
	if (microsecond < 0) {
		second -= 1
		microsecond += 1000000
		if (second < 0) {
			// might be wrong for leap seconds
			second += 60
			minute -= 1
			if (minute < 0) {
				minute += 60
				hour -= 1
				if (hour < 0) {
					hour += 24
					dayOfYear =- 1
					if (dayOfYear < 0) {
						// wrong for leap years
						dayOfYear += 365
						year -= 1
					}
				}
			}
		}
	}

	var flags = 0

	if (ms2H.ioClockFlags & (1<<7))
		flags |= 0x01

	if (ms2H.dataQualityFlags & (1<<5))
		flags |= 0x02

	chunk = fdsn.ABS_TIME({
		year: year,
		doy: dayOfYear,
		hour: hour,
		minute: minute,
		second: second,
		microsecond: microsecond,
		flags: flags
	})
	ms3R.addChunk(chunk)

	if (timingQuality != -1) {
		chunk = fdsn.TIMING_QUALITY({
			value_percent: timingQuality
		})
		ms3R.addChunk(chunk)
	}

	if (ms2H.typeCode && ms2H.typeCode != 'D') {
		chunk = fdsn.QUALITY_INDICATOR({
			value: String.fromCharCode(ms2H.typeCode)
		})
		ms3R.addChunk(chunk)
	}

	chunk = fdsn.DATA_VERSION({
		value: UNKNOWN_DATA_VERSION,
	})
	ms3R.addChunk(chunk)

	chunk = fdsn.SENSOR({
		vendor_id: 0x1111,
		product_id: 0x2222,
		serial_no: 0x3333,
		preset: 0x4444,
	})
	ms3R.addChunk(chunk)

	chunk = fdsn.DATALOGGER({
		vendor_id: 0x5555,
		product_id: 0x6666,
		serial_no: 0x7777,
		preset: 0x8888,
	})
	ms3R.addChunk(chunk)

	if (ms2H.numSamples > 0) {
		chunk = fdsn.WFMETA({
			sample_rate_period: sampleRatePeriod,
			encoding: ms2record.header.encoding
		})
		ms3R.addChunk(chunk)

		let numSamples = ms2H.numSamples
		let samples = new Uint8Array(ms2record.data.buffer, ms2record.data.byteOffset, ms2record.data.byteLength)
		let WFDATA = (numSamples <= 255)? fdsn.WFDATA: fdsn.WFDATA_LARGE;

		chunk = WFDATA({
			number_of_samples: numSamples,
			data: samples
		})
		ms3R.addChunk(chunk)
	}

	return ms3R
}

