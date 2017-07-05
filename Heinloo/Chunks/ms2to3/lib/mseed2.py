import struct
from io import BytesIO

class EndOfData(Exception):
    pass

class MSeedError(Exception):
    pass

FIXED_DATA_HEADER_SIZE = 48
MINIMUM_RECORD_LENGTH = 256
BLOCKETTE_LENGTHS = {
    100: 12,
    200: 52,
    201: 60,
    300: 60,
    310: 60,
    320: 64,
    390: 28,
    395: 16,
    400: 16,
    405: 6,
    500: 200
}

class MS2Record(object):
    def __init__(self, stream):
        self.timing_quality = -1
        self.blockettes = []
        self.data = bytes()

        buf = stream.read(FIXED_DATA_HEADER_SIZE)

        if not buf:
            raise EndOfData

        record = buf
        curr_size = len(buf)

        recno_str, self.rectype, sta, loc, cha, net, \
            self.year, self.doy, self.hour, self.minute, self.second, \
            tms, self.nsamp, sr_factor, sr_mult, \
            self.aflags, self.cflags, self.qflags, num_blk, \
            self.time_correction, data_offset, blockette_start = \
            struct.unpack("!6scx5s2s3s2s2H3Bx2H2h4Bl2H", record)

        self.net = net.strip().decode('ascii')
        self.sta = sta.strip().decode('ascii')
        self.loc = loc.strip().decode('ascii')
        self.cha = cha.strip().decode('ascii')
        self.microsecond = tms * 100

        if sr_factor >= 0:
            self.sample_rate = float(sr_factor)

        else:
            self.sample_rate = 1.0 / float(sr_factor)

        if sr_mult >= 0:
            self.sample_rate *= float(sr_mult)

        else:
            self.sample_rate /= float(sr_mult)

        if data_offset >= FIXED_DATA_HEADER_SIZE:
            remaining_header_size = data_offset - \
                FIXED_DATA_HEADER_SIZE

        elif data_offset == 0:
            # This means that blockettes can follow,
            # but no data samples. Use minimum record
            # size to read following blockettes. This
            # can still fail if blockette 1000 is after
            # position 256
            remaining_header_size = \
                MINIMUM_RECORD_LENGTH - \
                    FIXED_DATA_HEADER_SIZE

        else:
            # Full header size cannot be smaller than
            # fixed header size. This is an error.
            print("data offset smaller than "\
                  "fixed header length: %s, bailing "\
                  "out" % data_offset)
            raise MSeedError

        # TODO: check validity of blockette_start

        buf = stream.read(remaining_header_size)

        if len(buf) != remaining_header_size:
            print("remaining header corrupt in record")
            raise MSeedError

        record += buf
        curr_size += len(buf)
        b1000_found = False
        nframes = -1

        while (blockette_start < curr_size):
            blockette_id, next_blockette_start, = struct.unpack(
                '!HH',
                record[blockette_start:blockette_start+4])

            if blockette_id == 1000:
                b1000_found = True

                self.encoding, self.byteorder, record_size_exponent = \
                    struct.unpack("!3Bx", record[blockette_start+4:blockette_start+8])

                remaining_record_size = \
                    2**record_size_exponent - curr_size

                buf = stream.read(remaining_record_size)

                if len(buf) != remaining_record_size:
                    print("remaining record is corrupt")
                    raise MSeedError

                record += buf
                curr_size += len(buf)

            elif blockette_id == 1001:
                self.timing_quality, micros, nframes = \
                    struct.unpack("!BbxB", record[blockette_start+4:blockette_start+8])

                self.microsecond += micros

            else:
                if next_blockette_start != 0:
                    blockette_end = next_blockette_start

                elif data_offset != 0:
                    blockette_end = data_offset

                elif blockette_id in BLOCKETTE_LENGTHS:
                    blockette_end = min(blockette_start + BLOCKETTE_LENGTHS[blockette_id], curr_size)

                self.blockettes.append((blockette_id,
                    record[blockette_start+4:blockette_end]))

            if next_blockette_start == 0:
                break

            blockette_start = next_blockette_start

        if not b1000_found:
            print("blockette 1000 not found, stop reading")
            raise MSeedError

        if data_offset != 0:
            if nframes >= 0:
                if data_offset+nframes*64 > curr_size:
                    print("invalid number of frames (%d)" % nframes)
                    raise MSeedError

                self.data = record[data_offset:data_offset+nframes*64]

            elif nframes == -1:
                self.data = record[data_offset:]

