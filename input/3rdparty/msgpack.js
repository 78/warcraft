const Buffer = require('./buffer').Buffer
module.exports = (function() {
  var __MODS__ = {};
  var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
  var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
  var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
  var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
  __DEFINE__(1578039707142, function(require, module, exports) {
  
  var BufferUtil = require('./lib/buffer-util');
  
  BufferUtil.toString = function (buffer, start, end) {
    return Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      .toString('utf8', start, end);
  };
  BufferUtil.fromString = function (string) {
    var buffer = Buffer.from(string);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
  };
  
  module.exports = require('./lib/msgpack');
  
  }, function(modId) {var map = {"./lib/buffer-util":1578039707143,"./lib/msgpack":1578039707144}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707143, function(require, module, exports) {
  
  
  // The given argument must be an array of Uint8Arrays.
  exports.concat = function (buffers) {
    var bufferCount = buffers.length;
    var totalLength = 0;
    for (var i=0; i<bufferCount; ++i) {
      totalLength += buffers[i].byteLength;
    }
    var output = new Uint8Array(totalLength);
    var offset = 0;
    for (var i=0; i<bufferCount; ++i) {
      var buffer = buffers[i];
      output.set(buffer, offset);
      offset += buffer.byteLength;
    }
    return output;
  };
  
  // The first argument must be a Uint8Array.
  // Start and end indices will be clamped to the range of the given Uint8Array.
  exports.subarray = function (buffer, start, end) {
    start = Math.min(Math.max(0, start), buffer.byteLength);
    return new Uint8Array(buffer.buffer,
      buffer.byteOffset + start,
      Math.min(Math.max(start, end), buffer.byteLength) - start
    );
  };
  
  }, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707144, function(require, module, exports) {
  
  var Codec = require('./codec');
  var Paper = require('./paper');
  var encode = require('./encode');
  var decode = require('./decode');
  
  exports.encode = function (input, codec) {
    if (codec != null && !(codec instanceof Codec)) {
      throw new TypeError('Expected second argument to be a Codec, if provided.');
    }
    var encoder = new Paper(codec);
    encode(encoder, input);
    return encoder.read();
  };
  exports.decode = function (input, codec) {
    if (codec != null && !(codec instanceof Codec)) {
      throw new TypeError('Expected second argument to be a Codec, if provided.');
    }
    if (!(input instanceof Uint8Array)) {
      throw new TypeError('Expected first argument to be a Uint8Array.');
    }
    var decoder = new Paper(codec);
    decoder.setBuffer(input);
    return decode(decoder);
  };
  exports.Codec = Codec;
  
  }, function(modId) { var map = {"./codec":1578039707145,"./paper":1578039707146,"./encode":1578039707147,"./decode":1578039707149}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707145, function(require, module, exports) {
  
  function Codec() {
    if (!(this instanceof Codec)) {
      throw new TypeError('Codecs must be constructed with the "new" keyword.');
    }
    this._packers = [];
    this._packerClasses = [];
    this._unpackers = {};
  }
  Codec.prototype.register = function (etype, Class, packer, unpacker) {
    if (Array.isArray(packer)) {
      packer = join(packer);
    }
    if (Array.isArray(unpacker)) {
      unpacker = join(unpacker);
    }
    if (~~etype !== etype || !(etype >= 0 && etype < 128)) {
      throw new TypeError('Invalid extension type (must be between 0 and 127).');
    }
    if (typeof Class !== 'function') {
      throw new TypeError('Expected second argument to be a constructor function.');
    }
    this._packers.push(function (value) {
      var buffer = packer(value);
      if (!(buffer instanceof Uint8Array)) {
        throw new TypeError('Codec must return a Uint8Array (encoding "' + Class.name + '").');
      }
      return new ExtensionBuffer(buffer, etype);
    });
    this._packerClasses.push(Class);
    this._unpackers[etype] = unpacker;
    return this;
  };
  Codec.prototype._packerFor = function (value) {
    return getPacker(value.constructor, this._packerClasses, this._packers);
  };
  Codec.prototype._unpackerFor = function (etype) {
    return this._unpackers[etype];
  };
  module.exports = Codec;
  
  // This is isolated for optimization purposes.
  var getPacker = function (constructor, classes, packers) {
    for (var i=0, len=classes.length; i<len; ++i) {
      if (constructor === classes[i]) {
        return packers[i];
      }
    }
  };
  
  var join = function (filters) {
    filters = filters.slice();
    var iterator = function (value, filter) {
      return filter(value);
    };
    return function (value) {
      return filters.reduce(iterator, value);
    };
  };
  
  var ExtensionBuffer = function (buffer, etype) {
    this.buffer = buffer;
    this.etype = etype;
  };
  
  }, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707146, function(require, module, exports) {
  
  var BufferUtil = require('./buffer-util');
  var MIN_BUFFER_SIZE = 2048;
  var MAX_BUFFER_SIZE = 65536;
  
  var Paper = function (codec) {
    this.codec = codec;
  };
  Paper.prototype.push = function (chunk) {
    var buffers = this.buffers || (this.buffers = []);
    buffers.push(chunk);
  };
  Paper.prototype.read = function () {
    this.flush();
    var buffers = this.buffers;
    if (buffers) {
      var chunk = buffers.length > 1 ? BufferUtil.concat(buffers) : buffers[0];
      buffers.length = 0;
      return chunk;
    }
  };
  Paper.prototype.flush = function () {
    if (this.start < this.offset) {
      this.push(BufferUtil.subarray(this.buffer, this.start, this.offset));
      this.start = this.offset;
    }
  };
  Paper.prototype.reserve = function (length) {
    if (!this.buffer) {
      return this.alloc(length);
    }
    var size = this.buffer.byteLength;
    // Does it need to be resized?
    if (this.offset + length > size) {
      // Flush current buffer.
      this.offset && this.flush();
      // Resize it to 2x current length.
      this.alloc(Math.max(length, Math.min(size * 2, MAX_BUFFER_SIZE)));
    }
  };
  Paper.prototype.alloc = function (length) {
    this.setBuffer(new Uint8Array(Math.max(length, MIN_BUFFER_SIZE)));
  };
  Paper.prototype.setBuffer = function (buffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.start = 0;
  };
  Paper.prototype.send = function (buffer) {
    var end = this.offset + buffer.byteLength;
    if (this.buffer && end <= this.buffer.byteLength) {
      this.buffer.set(buffer, this.offset);
      this.offset = end;
    } else {
      this.flush();
      this.push(buffer);
    }
  };
  module.exports = Paper;
  
  }, function(modId) { var map = {"./buffer-util":1578039707143}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707147, function(require, module, exports) {
  
  var writeType = {};
  
  var encode = module.exports = function (encoder, value) {
    writeType[typeof value](encoder, value);
  };
  
  // Fills the writeType hash with functions that each encode values of their
  // respective types at the given Paper's offset.
  (function (write, fromString) {
    
    var float32Buffer = new Float32Array(1);
    var isFloat32 = function (num) {
      float32Buffer[0] = num;
      return float32Buffer[0] === num;
    };
    
    writeType.number = function (encoder, value) {
      var uivalue = value >>> 0;
      if (value === uivalue) {
        // positive fixint -- 0x00 - 0x7f
        // uint 8 -- 0xcc
        // uint 16 -- 0xcd
        // uint 32 -- 0xce
        uivalue <= 0x7f ? write.type(encoder, uivalue) :
        uivalue <= 0xff ? write.int8(encoder, 0xcc, uivalue) :
        uivalue <= 0xffff ? write.int16(encoder, 0xcd, uivalue) :
        write.int32(encoder, 0xce, uivalue);
      } else {
        var ivalue = value | 0;
        if (value === ivalue) {
          // negative fixint -- 0xe0 - 0xff
          // int 8 -- 0xd0
          // int 16 -- 0xd1
          // int 32 -- 0xd2
          ivalue >= -0x20 ? write.type(encoder, ivalue & 0xff) :
          ivalue >= -0x80 ? write.int8(encoder, 0xd0, ivalue) :
          ivalue >= -0x8000 ? write.int16(encoder, 0xd1, ivalue) :
          write.int32(encoder, 0xd2, ivalue);
        } else {
          isFloat32(value)
            ? write.float32(encoder, value)  // float 32 -- 0xca
            : write.float64(encoder, value); // float 64 -- 0xcb
        }
      }
    };
    
    writeType.string = function (encoder, value) {
      var utf8 = fromString(value);
      var byteLength = utf8.byteLength;
      
      // fixstr -- 0xa0 - 0xbf
      // str 8 -- 0xd9
      // str 16 -- 0xda
      // str 32 -- 0xdb
      byteLength < 32 ? write.type(encoder, 0xa0 + byteLength) :
      byteLength <= 0xff ? write.int8(encoder, 0xd9, byteLength) :
      byteLength <= 0xffff ? write.int16(encoder, 0xda, byteLength) :
      write.int32(encoder, 0xdb, byteLength);
      
      encoder.send(utf8);
    };
    
    writeType.boolean = function (encoder, value) {
      // false -- 0xc2
      // true -- 0xc3
      write.type(encoder, value ? 0xc3 : 0xc2);
    };
    
    writeType.object = function (encoder, value) {
      var packer;
      if (value === null) return nil(encoder, value);
      if (Array.isArray(value)) return array(encoder, value);
      if (value instanceof Uint8Array) return bin(encoder, value);
      if (encoder.codec && (packer = encoder.codec._packerFor(value))) {
        return ext(encoder, packer(value));
      }
      map(encoder, value);
    };
    
    var nil = function (encoder) {
      // nil -- 0xc0
      write.type(encoder, 0xc0);
    };
    
    var array = function (encoder, value) {
      var length = value.length;
      
      // fixarray -- 0x90 - 0x9f
      // array 16 -- 0xdc
      // array 32 -- 0xdd
      length < 16 ? write.type(encoder, 0x90 + length) :
      length <= 0xffff ? write.int16(encoder, 0xdc, length) :
      write.int32(encoder, 0xdd, length);
      
      for (var i=0; i<length; ++i) {
        encode(encoder, value[i]);
      }
    };
    
    var bin = function (encoder, value) {
      var byteLength = value.byteLength;
      
      // bin 8 -- 0xc4
      // bin 16 -- 0xc5
      // bin 32 -- 0xc6
      byteLength <= 0xff ? write.int8(encoder, 0xc4, byteLength) :
      byteLength <= 0xffff ? write.int16(encoder, 0xc5, byteLength) :
      write.int32(encoder, 0xc6, byteLength);
      
      encoder.send(value);
    };
    
    var ext = function (encoder, value) {
      var byteLength = value.buffer.byteLength;
      
      // fixext 1 -- 0xd4
      // fixext 2 -- 0xd5
      // fixext 4 -- 0xd6
      // fixext 8 -- 0xd7
      // fixext 16 -- 0xd8
      // ext 8 -- 0xc7
      // ext 16 -- 0xc8
      // ext 32 -- 0xc9
      byteLength === 1 ? write.int8(encoder, 0xd4, value.etype) :
      byteLength === 2 ? write.int8(encoder, 0xd5, value.etype) :
      byteLength === 4 ? write.int8(encoder, 0xd6, value.etype) :
      byteLength === 8 ? write.int8(encoder, 0xd7, value.etype) :
      byteLength === 16 ? write.int8(encoder, 0xd8, value.etype) :
      byteLength <= 0xff ? (write.int8(encoder, 0xc7, byteLength), write.type(encoder, value.etype)) :
      byteLength <= 0xffff ? (write.int16(encoder, 0xc8, byteLength), write.type(encoder, value.etype)) :
      (write.int32(encoder, 0xc9, byteLength), write.type(encoder, value.etype));
      
      encoder.send(value.buffer);
    };
    
    var map = function (encoder, value) {
      var keys = Object.keys(value);
      var length = keys.length;
      
      // fixmap -- 0x80 - 0x8f
      // map 16 -- 0xde
      // map 32 -- 0xdf
      length < 16 ? write.type(encoder, 0x80 + length) :
      length <= 0xffff ? write.int16(encoder, 0xde, length) :
      write.int32(encoder, 0xdf, length);
      
      for (var i=0; i<length; ++i) {
        var key = keys[i];
        (key >>> 0) + '' === key ? encode(encoder, key >>> 0) : encode(encoder, key);
        encode(encoder, value[key]);
      }
    };
    
    writeType.undefined = nil;
    writeType.function = nil;
    writeType.symbol = nil;
  }(require('./write-header'), require('./buffer-util').fromString));
  
  }, function(modId) { var map = {"./write-header":1578039707148,"./buffer-util":1578039707143}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707148, function(require, module, exports) {
  
  
  exports.type = function (encoder, type) {
    encoder.reserve(1);
    encoder.buffer[encoder.offset++] = type;
  };
  exports.int8 = function (encoder, type, value) {
    encoder.reserve(2);
    var buffer = encoder.buffer;
    buffer[encoder.offset++] = type;
    buffer[encoder.offset++] = value;
  };
  exports.int16 = function (encoder, type, value) {
    encoder.reserve(3);
    var buffer = encoder.buffer;
    buffer[encoder.offset++] = type;
    buffer[encoder.offset++] = value >>> 8;
    buffer[encoder.offset++] = value;
  };
  exports.int32 = function (encoder, type, value) {
    encoder.reserve(5);
    var buffer = encoder.buffer;
    buffer[encoder.offset++] = type;
    buffer[encoder.offset++] = value >>> 24;
    buffer[encoder.offset++] = value >>> 16;
    buffer[encoder.offset++] = value >>> 8;
    buffer[encoder.offset++] = value;
  };
  exports.float32 = function (encoder, value) {
    encoder.reserve(5);
    var buffer = encoder.buffer;
    buffer[encoder.offset++] = 0xca;
    new DataView(buffer.buffer).setFloat32(buffer.byteOffset + encoder.offset, value);
    encoder.offset += 4;
  };
  exports.float64 = function (encoder, value) {
    encoder.reserve(9);
    var buffer = encoder.buffer;
    buffer[encoder.offset++] = 0xcb;
    new DataView(buffer.buffer).setFloat64(buffer.byteOffset + encoder.offset, value);
    encoder.offset += 8;
  };
  
  }, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707149, function(require, module, exports) {
  
  module.exports = function (decoder) {
    var type = readUint8(decoder);
    var func = readToken[type];
    if (!func) {
      throw new Error('Invalid type: ' + (type ? ('0x' + type.toString(16)) : type));
    }
    return func(decoder);
  };
  
  // Dependencies are loaded after exporting, to satisfy the required load order.
  var readUint8 = require('./read-format').uint8;
  var readToken = new Array(256);
  
  // Fills the readToken array with functions that each return their decoded
  // interpretation of the bytes at the given Paper's offset.
  (function (read) {
    var i;
    
    // Creates a readToken function that returns a constant value.
    var constant = function (value) {
      return function () {
        return value;
      };
    };
    
    // Transforms the given method to always receive a second argument, which is
    // a number constant.
    var fix = function (len, method) {
      return function (decoder) {
        return method(decoder, len);
      };
    };
    
    // Transforms the given method to always receive a second argument, which is
    // a number returned by lenFunc when given a Paper.
    var flex = function (lenFunc, method) {
      return function (decoder) {
        return method(decoder, lenFunc(decoder));
      };
    };
    
    // positive fixint -- 0x00 - 0x7f
    for (i=0x00; i<=0x7f; ++i) {
      readToken[i] = constant(i);
    }
    
    // fixmap -- 0x80 - 0x8f
    for (i=0x80; i<=0x8f; ++i) {
      readToken[i] = fix(i - 0x80, read.map);
    }
    
    // fixarray -- 0x90 - 0x9f
    for (i=0x90; i<=0x9f; ++i) {
      readToken[i] = fix(i - 0x90, read.array);
    }
    
    // fixstr -- 0xa0 - 0xbf
    for (i=0xa0; i<=0xbf; ++i) {
      readToken[i] = fix(i - 0xa0, read.str);
    }
    
    // nil -- 0xc0
    readToken[0xc0] = constant(null);
    
    // (never used) -- 0xc1
    readToken[0xc1] = null;
    
    // false -- 0xc2
    // true -- 0xc3
    readToken[0xc2] = constant(false);
    readToken[0xc3] = constant(true);
    
    // bin 8 -- 0xc4
    // bin 16 -- 0xc5
    // bin 32 -- 0xc6
    readToken[0xc4] = flex(read.uint8, read.bin);
    readToken[0xc5] = flex(read.uint16, read.bin);
    readToken[0xc6] = flex(read.uint32, read.bin);
    
    // ext 8 -- 0xc7
    // ext 16 -- 0xc8
    // ext 32 -- 0xc9
    readToken[0xc7] = flex(read.uint8, read.ext);
    readToken[0xc8] = flex(read.uint16, read.ext);
    readToken[0xc9] = flex(read.uint32, read.ext);
    
    // float 32 -- 0xca
    // float 64 -- 0xcb
    readToken[0xca] = read.float32;
    readToken[0xcb] = read.float64;
    
    // uint 8 -- 0xcc
    // uint 16 -- 0xcd
    // uint 32 -- 0xce
    // uint 64 -- 0xcf
    readToken[0xcc] = read.uint8;
    readToken[0xcd] = read.uint16;
    readToken[0xce] = read.uint32;
    readToken[0xcf] = null;
    
    // int 8 -- 0xd0
    // int 16 -- 0xd1
    // int 32 -- 0xd2
    // int 64 -- 0xd3
    readToken[0xd0] = read.int8;
    readToken[0xd1] = read.int16;
    readToken[0xd2] = read.int32;
    readToken[0xd3] = null;
    
    // fixext 1 -- 0xd4
    // fixext 2 -- 0xd5
    // fixext 4 -- 0xd6
    // fixext 8 -- 0xd7
    // fixext 16 -- 0xd8
    readToken[0xd4] = fix(1, read.ext);
    readToken[0xd5] = fix(2, read.ext);
    readToken[0xd6] = fix(4, read.ext);
    readToken[0xd7] = fix(8, read.ext);
    readToken[0xd8] = fix(16, read.ext);
    
    // str 8 -- 0xd9
    // str 16 -- 0xda
    // str 32 -- 0xdb
    readToken[0xd9] = flex(read.uint8, read.str);
    readToken[0xda] = flex(read.uint16, read.str);
    readToken[0xdb] = flex(read.uint32, read.str);
    
    // array 16 -- 0xdc
    // array 32 -- 0xdd
    readToken[0xdc] = flex(read.uint16, read.array);
    readToken[0xdd] = flex(read.uint32, read.array);
    
    // map 16 -- 0xde
    // map 32 -- 0xdf
    readToken[0xde] = flex(read.uint16, read.map);
    readToken[0xdf] = flex(read.uint32, read.map);
    
    // negative fixint -- 0xe0 - 0xff
    for (i=0xe0; i<=0xff; ++i) {
      readToken[i] = constant(i - 0x100);
    }
  }(require('./read-format')));
  
  }, function(modId) { var map = {"./read-format":1578039707150}; return __REQUIRE__(map[modId], modId); })
  __DEFINE__(1578039707150, function(require, module, exports) {
  
  var BufferUtil = require('./buffer-util');
  var decode = require('./decode');
  
  var map = function (decoder, len) {
    var value = {};
    for (var i=0; i<len; ++i) {
      value[decode(decoder)] = decode(decoder);
    }
    return value;
  };
  
  var array = function (decoder, len) {
    var value = new Array(len);
    for (var i=0; i<len; ++i) {
      value[i] = decode(decoder);
    }
    return value;
  };
  
  var str = function (decoder, len) {
    var start = decoder.offset;
    var end = decoder.offset = start + len;
    if (end > decoder.buffer.byteLength) throw new RangeError('BUFFER_SHORTAGE');
    return BufferUtil.toString(decoder.buffer, start, end);
  };
  
  var bin = function (decoder, len) {
    var start = decoder.offset;
    var end = decoder.offset = start + len;
    if (end > decoder.buffer.byteLength) throw new RangeError('BUFFER_SHORTAGE');
    return BufferUtil.subarray(decoder.buffer, start, end);
  };
  
  var ext = function (decoder, len) {
    var start = decoder.offset;
    var end = decoder.offset = start + len + 1;
    if (end > decoder.buffer.byteLength) throw new RangeError('BUFFER_SHORTAGE');
    var etype = decoder.buffer[start];
    var unpacker;
    if (decoder.codec && (unpacker = decoder.codec._unpackerFor(etype))) {
      return unpacker(BufferUtil.subarray(decoder.buffer, start + 1, end));
    }
    throw new Error('Unrecognized extension type: ' + (etype ? ('0x' + etype.toString(16)) : etype));
  };
  
  var uint8 = function (decoder) {
    var buffer = decoder.buffer;
    if (decoder.offset >= buffer.byteLength) throw new RangeError('BUFFER_SHORTAGE');
    return buffer[decoder.offset++];
  };
  
  var uint16 = function (decoder) {
    var buffer = decoder.buffer;
    if (decoder.offset + 2 > buffer.byteLength) throw new RangeError('BUFFER_SHORTAGE');
    return (buffer[decoder.offset++] << 8) | buffer[decoder.offset++];
  };
  
  var uint32 = function (decoder) {
    var buffer = decoder.buffer;
    if (decoder.offset + 4 > buffer.byteLength) throw new RangeError('BUFFER_SHORTAGE');
    return (buffer[decoder.offset++] * 0x1000000) +
      ((buffer[decoder.offset++] << 16) |
      (buffer[decoder.offset++] << 8) |
      buffer[decoder.offset++]);
  };
  
  var int8 = function (decoder) {
    var val = uint8(decoder);
    return !(val & 0x80) ? val : (0xff - val + 1) * -1;
  };
  
  var int16 = function (decoder) {
    var val = uint16(decoder);
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
  };
  
  var int32 = function (decoder) {
    var buffer = decoder.buffer;
    if (decoder.offset + 4 > buffer.byteLength) throw new RangeError('BUFFER_SHORTAGE');
    return (buffer[decoder.offset++] << 24) |
      (buffer[decoder.offset++] << 16) |
      (buffer[decoder.offset++] << 8) |
      buffer[decoder.offset++];
  };
  
  var float32 = function (decoder) {
    var buffer = decoder.buffer;
    var offset = decoder.offset;
    decoder.offset += 4;
    return new DataView(buffer.buffer).getFloat32(buffer.byteOffset + offset);
  };
  
  var float64 = function (decoder) {
    var buffer = decoder.buffer;
    var offset = decoder.offset;
    decoder.offset += 8;
    return new DataView(buffer.buffer).getFloat64(buffer.byteOffset + offset);
  };
  
  module.exports = {
    map: map,
    array: array,
    str: str,
    bin: bin,
    ext: ext,
    uint8: uint8,
    uint16: uint16,
    uint32: uint32,
    int8: int8,
    int16: int16,
    int32: int32,
    float32: float32,
    float64: float64
  };
  
  }, function(modId) { var map = {"./buffer-util":1578039707143,"./decode":1578039707149}; return __REQUIRE__(map[modId], modId); })
  return __REQUIRE__(1578039707142);
  })()
  //# sourceMappingURL=index.js.map