
// this comes from the seisplotjs miniseed bundle
var miniseed = seisplotjs_miniseed;
// this comes from the seisplotjs waveformplot bundle
var wp = seisplotjs_waveformplot
// mseed3_chunks comes from mseed3 bundle
var mseed3 = mseed3_chunks


var client = new XMLHttpRequest();
var url = 'http://service.scedc.caltech.edu/fdsnws/dataselect/1/query?net=CI&sta=BBR&loc=--&cha=BHZ&start=2017-03-01T20:17:04&end=2017-03-01T20:22:04';

var div = wp.d3.select('div.miniseed');
div.append('p').text(url);

mseed3.loadProto("mseed3.proto", function(err) {
  if (err) throw err;

  client.open("GET", url);
  client.onreadystatechange = handler;
  client.responseType = "arraybuffer";
  client.setRequestHeader("Accept", "application/vnd.fdsn.mseed");
  client.send();
})

function handler() {
  if (this.readyState === this.DONE) {
    if (this.status === 200) {
console.log("resolve miniseed: ");
      resolve(this.response); }
    else { reject(this); }
  }
}

var resolve = function(arraybuf) {
  var records = miniseed.parseDataRecords(arraybuf);

var table = wp.d3.select("div.miniseed")
        .select("table");
      if ( table.empty()) {
        table = wp.d3.select("div.miniseed")
          .append("table");
        var th = table.append("thead").append("tr");
        th.append("th").text("Seq");
        th.append("th").text("Net");
        th.append("th").text("Sta");
        th.append("th").text("Loc");
        th.append("th").text("Chan");
        th.append("th").text("Start");
        th.append("th").text("End");
        th.append("th").text("NumSamp");
        th.append("th").text("Sps");
        th.append("th").text("Blockettes");
        table.append("tbody");
      }
      var tableData = table.select("tbody")
        .selectAll("tr")
        .data(records, function(d) { return d.codes()+d.header.start;});
      tableData.exit().remove();
      var tr = tableData.enter().append('tr');
      tr.append("td")
        .text(function(d) {
          return d.header.seq;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.netCode;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.staCode;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.locCode;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.chanCode;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.start.toISOString();
        });
      tr.append("td")
        .text(function(d) {
          return d.header.end.toISOString();
        });
      tr.append("td")
        .text(function(d) {
          return d.header.numSamples;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.sampleRate;
        });
      tr.append("td")
        .text(function(d) {
          var out = "";
          for(var b=0; b<d.header.blocketteList.length; b++) {
            out += ""+d.header.blocketteList[b].type+",";
          }
          return out;
        });

console.log("before plot");
      plotSeis(records);
console.log("after plot");

// mseed3 conversion...

  var mseed3Records = mseed3.convertMS2toMS3(records);
console.log("parse to mseed3 "+mseed3Records.length);
  var blobs = []

  for (let i in mseed3Records) {
    blobs.push(mseed3Records[i].blob())
  }

  var file = new File(blobs, "data.mseed3", {type: "application/vnd.fdsn.mseed3"})
  var url = URL.createObjectURL(file)
  var download = wp.d3.select("div.mseed3").select("a");

  if (download.empty()) {
    download = wp.d3.select("div.mseed3").append("a");
  }

  download.attr('href', url);
  download.text("Download MSEED3 file");

// test parsing MS3 data...
  mseed3Records = []
  var reader = new FileReader();
  reader.addEventListener("loadend", function() {
    mseed3Records = mseed3.parseDataRecords(reader.result)

// test decompression...
  for (let i in mseed3Records) {
    console.log(mseed3Records[i].decompress())
  }

  var table = wp.d3.select("div.mseed3")
        .select("table");
      if ( table.empty()) {
        table = wp.d3.select("div.mseed3")
          .append("table");
        var th = table.append("thead").append("tr");
        th.append("th").text("RecInd");
        th.append("th").text("FVer");
        th.append("th").text("Flags");
        th.append("th").text("Start");
        th.append("th").text("sampleRP");
        th.append("th").text("Encode");
        th.append("th").text("Ver");
        th.append("th").text("DataLength");
        th.append("th").text("IdLen");
        th.append("th").text("Id");
        th.append("th").text("Footer:");
        th.append("th").text("numSamp");
        th.append("th").text("CRC");
        th.append("th").text("ExtraLen");
        th.append("th").text("Extras");
        table.append("tbody");
      }
      var tableData = table.select("tbody")
        .selectAll("tr")
        .data(mseed3Records, function(d) { return d.codes()+d.header.start;});
      tableData.exit().remove();
      var tr = tableData.enter().append('tr');
      tr.append("td")
        .text(function(d) {
          return d.header.recordIndicator;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.formatVersion;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.flags;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.getStartFieldsAsISO();
        });
      tr.append("td")
        .text(function(d) {
          return d.header.sampleRatePeriod;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.encoding;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.version;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.dataLength;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.identifierLength;
        });
      tr.append("td")
        .text(function(d) {
          return d.header.identifier;
        });
      tr.append("td")
        .text(function(d) {
          return "";
        });
      tr.append("td")
        .text(function(d) {
          return d.footer.numSamples;
        });
      tr.append("td")
        .text(function(d) {
          return d.footer.crc;
        });
      tr.append("td")
        .text(function(d) {
          return d.footer.extraHeadersLength;
        });
      tr.append("td")
        .text(function(d) {
          return JSON.stringify(d.footer.extraHeaders);
        });
  });
  reader.readAsArrayBuffer(file);
}

var reject = function(error) {
  wp.d3.select("div.miniseed").append('p').html("Error loading data." +error);
  console.assert(false, error);
}

var plotSeis = function (dataRecords) {
          var div = wp.d3.select("div.miniseed");
          div.selectAll('div.myseisplot').remove();
          var byChannel = wp.miniseed.byChannel(dataRecords);
          var keys = Object.keys(byChannel);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var segments = miniseed.merge(byChannel[key]);
console.log("merge in:"+byChannel[key].length+" out:"+segments.length);
            div.append('p').html('Plot for ' + key);
div.append('div').attr("class", "seis").selectAll('p').data(segments).enter().append('p').text(function(d) { return d.start().toISOString()+" to "+d.end().toISOString()+" nums:"+d.numPoints()+" "+d.sampleRate();});
            var svgdiv = div.append('div').attr('class', 'myseisplot');
            if (segments.length > 0) {
var startEnd = wp.findStartEnd(segments);
console.log("wp start end "+startEnd.start.toISOString()+" to "+startEnd.end.toISOString());
                //var seismogram = new wp.chart(svgdiv, segments, null, null);
                var seismogram = new wp.chart(svgdiv, segments, null, null);
                seismogram.draw();
var markers = [];
markers.push({ markertype: 'pick', name: 'P', time: new Date(Date.parse('2017-03-01T20:19:05.250Z'))});
//markers.push({ markertype: 'pick', name: 'S', time: new Date(Date.parse('2017-02-27T22:59:20Z'))});
//seismogram.appendMarkers(markers);
console.log("P marker "+markers[0].time.toISOString());
console.log("xScale domain "+seismogram.xScale.domain()[0].toISOString()+" to "+seismogram.xScale.domain()[1].toISOString());
            }
        }
        if (keys.length==0){
            divs.append('p').html('No data found');
        }
      }

