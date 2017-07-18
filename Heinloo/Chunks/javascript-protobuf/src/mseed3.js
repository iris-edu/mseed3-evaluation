/*global DataView*/
/**
 * Andres Heinloo, GFZ Potsdam
 *
 * Originally based on code by:
 *
 * Philip Crotwell
 * University of South Carolina, 2017
 * http://www.seis.sc.edu
 */

import * as seedcodec from 'seisplotjs-seedcodec'
import * as model from 'seisplotjs-model'
import * as crc32 from 'crc-32'
import * as protobuf from 'protobufjs'

export const MAGIC = 'MS3'

var Record
var CRC32

export function loadProto(url, callback) {
	protobuf.load(url, function(err, root) {
		if (err) {
			callback(err)
		}
		else {
			Record = root.lookupType("mseed3.Record")
			CRC32 = root.lookupType("mseed3.CRC32")
			callback()
		}
	})
}

/** parse arrayBuffer into an array of DataRecords. */
export function parseDataRecords(arrayBuffer) {
	let reader = protobuf.Reader.create(new Uint8Array(arrayBuffer))
	let dataRecords = []

	while (reader.pos < reader.len) {
		let magic = makeString(reader.buf, reader.pos, MAGIC.length)

		if (magic != MAGIC) {
			throw new Error("First "+MAGIC.length+" bytes of record should be "+MAGIC+" but found "+magic)
		}

		reader.skip(MAGIC.length)

		let record = Record.decodeDelimited(reader)
		let obj = Record.toObject(record)
		let dataRecord = Object.assign(new DataRecord(), obj)
		dataRecord.compatibilize()
		dataRecords.push(dataRecord)
	}

	return dataRecords
}

class DataRecordBase {
	constructor() {
		this.size = undefined
		this.crc = undefined
		this.decompData = undefined
	}

	getSize() {
		encode()
		return this.size
	}

	codes() {
		return this.timeSeriesIdentifier
	}

	decompress() {
		// only decompress once as it is expensive operation
		if ( typeof this.decompData === 'undefined') {
			var waveformData = this.waveformData || this.largeWaveformData

			if (!waveformData)
				return

			this.decompData = []
			this.decompData.header = this

			for (let i in waveformData) {
				let data = waveformData[i].data
				let dataView = new DataView(data.buffer, data.byteOffset, data.byteLength)
				let encoding = this.waveformMetadata.encoding
				let numSamples = waveformData[i].numberOfSamples
				let decompData = seedcodec.decompress(encoding, dataView, numSamples, false)
				this.decompData = this.decompData.concat(decompData)
			}
		}

		return this.decompData
	}

	encode() {
		var record = Record.create(this)
		var data = Record.encode(record).finish()

		this.crc32 = [crc32.buf(data)]
		var crc32Message = CRC32.create(this)
		var crc32Data = CRC32.encode(crc32Message).finish()

		var length = data.length + crc32Data.length
		var lengthWriter = protobuf.Writer.create()
		var lengthData = lengthWriter.uint32(length).finish()

		var magicData = new Uint8Array(MAGIC.length)

		for (let i=0; i<MAGIC.length; i++) {
			magicData[i] = MAGIC.charCodeAt(i)
		}

		var datas = [magicData, lengthData, data, crc32Data]

		this.crc = this.crc32[0]
		this.size = 0

		for (let i in datas) {
			this.size += datas[i].byteLength
		}

		return datas
	}

	save(dataView) {
		var datas = this.encode()
		var bytearray = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
		var offset = 0

		for (let i in datas) {
			bytearray.set(datas[i], offset)
			offset += datas[i].length
		}

		return offset
	}

	blob() {
		return new Blob(this.encode())
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

	compatibilize() {
		var keys = Object.keys(this)

		this.header = this
		this.footer = this
		this.recordIndicator = 'MS'
		this.formatVersion = 30
		this.dataLength = 0
		this.numSamples = 0
		this.extraHeaders = {}

		for (let i in keys) {
			switch (keys[i]) {
				case 'timeSeriesIdentifier':
					this.identifier = this.timeSeriesIdentifier
					this.identifierLength = this.identifier.length
					break

				case 'recordStartTime':
					this.year = this.recordStartTime.year
					this.dayOfYear = this.recordStartTime.dayOfYear
					this.hour = this.recordStartTime.hour
					this.minute = this.recordStartTime.minute
					this.second = this.recordStartTime.second
					this.microsecond = this.recordStartTime.microsecond
					this.flags = this.recordStartTime.flags
					break

				case 'dataVersion':
					this.version = this.dataVersion
					break

				case 'waveformMetadata':
					this.sampleRatePeriod = this.waveformMetadata.sampleRatePeriod
					this.encoding = this.waveformMetadata.encoding
					break

				case 'waveformData':
					for (let i in this.waveformData) {
						this.numSamples += this.waveformData[i].numberOfSamples
						this.dataLength += this.waveformData[i].data.byteLength
					}
					break

				case 'largeWaveformData':
					for (let i in this.largeWaveformData) {
						this.numSamples += this.largeWaveformData[i].numberOfSamples
						this.dataLength += this.largeWaveformData[i].data.byteLength
					}
					break

				case 'crc32':
					this.crc = this.crc32.slice(-1)
					break

				default:
					this.extraHeaders[keys[i]] = this[keys[i]]
					break
			}
		}

		this.extraHeadersLength = JSON.stringify(this.extraHeaders).length
	}
}

/** Represents an MS3 Data Record */
export class DataRecord extends DataRecordBase {}

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

	ms3R.timeSeriesIdentifier = ms2H.netCode + '.' + ms2H.staCode + '.' + ( ms2H.locCode ? (ms2H.locCode+':') : "" ) + ms2H.chanCode

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

	if (ms2H.dataQualityFlags & (1<<7))
		flags |= 0x01

	if (ms2H.ioClockFlags & (1<<5))
		flags |= 0x02

	ms3R.recordStartTime = {
		year: year,
		dayOfYear: dayOfYear,
		hour: hour,
		minute: minute,
		second: second,
		microsecond: microsecond,
		flags: flags
	}

	if (timingQuality != -1) {
		ms3R.timingQuality = timingQuality
	}

	if (ms2H.typeCode && ms2H.typeCode != 68) {
		ms3R.qualityIndicator = String.fromCharCode(ms2H.typeCode)
	}

	var channel = "ZNE".indexOf(ms3R.timeSeriesIdentifier.slice(-1))

	ms3R.sensor = {
		vendorId: 0x1111,
		productId: 0x2222,
		serialNo: 0x3333,
		channel: channel,
		preset: 0x44,
	}

	ms3R.datalogger = {
		vendorId: 0x5555,
		productId: 0x6666,
		serialNo: 0x7777,
		channel: channel,
		preset: 0x88,
	}

	if (ms2H.numSamples > 0) {
		ms3R.waveformMetadata = {
			sampleRatePeriod: sampleRatePeriod,
			encoding: ms2record.header.encoding
		}

		let numSamples = ms2H.numSamples
		let samples = new Uint8Array(ms2record.data.buffer, ms2record.data.byteOffset, ms2record.data.byteLength)
		ms3R[(numSamples <= 255)? 'waveformData': 'largeWaveformData'] = [{
			numberOfSamples: numSamples,
			data: samples
		}]
	}

	ms3R.compatibilize()
	return ms3R
}

