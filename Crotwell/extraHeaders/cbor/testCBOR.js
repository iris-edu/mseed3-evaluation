
// assume div.json with a pre inside
var inJson = document.getElementById("json").textContent;

console.log("inJson: "+inJson);

// same, assume div.cbor with a pre inside
document.getElementById("cbor").insertAdjacentText("beforeend", inJson);

var encoded = new Uint8Array(CBOR.encode(inJson));
var hexArray = [];
for (var i=0; i< encoded.byteLength; i++) {
  hexArray.push(byteToHex(encoded[i]));
}

document.getElementById("cborbytes").insertAdjacentText("beforeend", hexArray.join(" "));
document.getElementById("cborbytesize").insertAdjacentText("beforeend", hexArray.length);

function byteToHex(b) {
  return (b >>> 4).toString(16)+(b & 0xF).toString(16)+" ";
}

