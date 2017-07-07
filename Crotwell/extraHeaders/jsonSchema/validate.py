#!/usr/bin/env python

# uses https://github.com/Julian/jsonschema, which is part of default anaconda

from jsonschema import validate
import json

file = open("mseed3ExtraHeaders.schema.json", "r")
schema = json.load(file)
exfile = open("example.json", "r")
example = json.load(exfile)

# this should be ok
validate(example, schema)

# this should fail, Bean does not allow dummy
#validate({ "Beam": "dummy"}, schema)

# this should fail, non-fdsn prop names must start with lower case letter
#validate({ "MyKey": "dummy"}, schema)

# but this should pass
validate({ "myKey": "dummy"}, schema)

print("done")

