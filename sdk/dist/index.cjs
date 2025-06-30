"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/bn.js/lib/bn.js
var require_bn = __commonJS({
  "node_modules/bn.js/lib/bn.js"(exports2, module2) {
    "use strict";
    (function(module3, exports3) {
      "use strict";
      function assert(val, msg) {
        if (!val) throw new Error(msg || "Assertion failed");
      }
      function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
      function BN5(number, base, endian) {
        if (BN5.isBN(number)) {
          return number;
        }
        this.negative = 0;
        this.words = null;
        this.length = 0;
        this.red = null;
        if (number !== null) {
          if (base === "le" || base === "be") {
            endian = base;
            base = 10;
          }
          this._init(number || 0, base || 10, endian || "be");
        }
      }
      if (typeof module3 === "object") {
        module3.exports = BN5;
      } else {
        exports3.BN = BN5;
      }
      BN5.BN = BN5;
      BN5.wordSize = 26;
      var Buffer2;
      try {
        if (typeof window !== "undefined" && typeof window.Buffer !== "undefined") {
          Buffer2 = window.Buffer;
        } else {
          Buffer2 = require("buffer").Buffer;
        }
      } catch (e) {
      }
      BN5.isBN = function isBN(num) {
        if (num instanceof BN5) {
          return true;
        }
        return num !== null && typeof num === "object" && num.constructor.wordSize === BN5.wordSize && Array.isArray(num.words);
      };
      BN5.max = function max(left, right) {
        if (left.cmp(right) > 0) return left;
        return right;
      };
      BN5.min = function min(left, right) {
        if (left.cmp(right) < 0) return left;
        return right;
      };
      BN5.prototype._init = function init(number, base, endian) {
        if (typeof number === "number") {
          return this._initNumber(number, base, endian);
        }
        if (typeof number === "object") {
          return this._initArray(number, base, endian);
        }
        if (base === "hex") {
          base = 16;
        }
        assert(base === (base | 0) && base >= 2 && base <= 36);
        number = number.toString().replace(/\s+/g, "");
        var start = 0;
        if (number[0] === "-") {
          start++;
          this.negative = 1;
        }
        if (start < number.length) {
          if (base === 16) {
            this._parseHex(number, start, endian);
          } else {
            this._parseBase(number, base, start);
            if (endian === "le") {
              this._initArray(this.toArray(), base, endian);
            }
          }
        }
      };
      BN5.prototype._initNumber = function _initNumber(number, base, endian) {
        if (number < 0) {
          this.negative = 1;
          number = -number;
        }
        if (number < 67108864) {
          this.words = [number & 67108863];
          this.length = 1;
        } else if (number < 4503599627370496) {
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863
          ];
          this.length = 2;
        } else {
          assert(number < 9007199254740992);
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863,
            1
          ];
          this.length = 3;
        }
        if (endian !== "le") return;
        this._initArray(this.toArray(), base, endian);
      };
      BN5.prototype._initArray = function _initArray(number, base, endian) {
        assert(typeof number.length === "number");
        if (number.length <= 0) {
          this.words = [0];
          this.length = 1;
          return this;
        }
        this.length = Math.ceil(number.length / 3);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var j, w;
        var off = 0;
        if (endian === "be") {
          for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
            w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        } else if (endian === "le") {
          for (i = 0, j = 0; i < number.length; i += 3) {
            w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        }
        return this._strip();
      };
      function parseHex4Bits(string, index) {
        var c = string.charCodeAt(index);
        if (c >= 48 && c <= 57) {
          return c - 48;
        } else if (c >= 65 && c <= 70) {
          return c - 55;
        } else if (c >= 97 && c <= 102) {
          return c - 87;
        } else {
          assert(false, "Invalid character in " + string);
        }
      }
      function parseHexByte(string, lowerBound, index) {
        var r = parseHex4Bits(string, index);
        if (index - 1 >= lowerBound) {
          r |= parseHex4Bits(string, index - 1) << 4;
        }
        return r;
      }
      BN5.prototype._parseHex = function _parseHex(number, start, endian) {
        this.length = Math.ceil((number.length - start) / 6);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var off = 0;
        var j = 0;
        var w;
        if (endian === "be") {
          for (i = number.length - 1; i >= start; i -= 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        } else {
          var parseLength = number.length - start;
          for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        }
        this._strip();
      };
      function parseBase(str, start, end, mul) {
        var r = 0;
        var b = 0;
        var len = Math.min(str.length, end);
        for (var i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r *= mul;
          if (c >= 49) {
            b = c - 49 + 10;
          } else if (c >= 17) {
            b = c - 17 + 10;
          } else {
            b = c;
          }
          assert(c >= 0 && b < mul, "Invalid character");
          r += b;
        }
        return r;
      }
      BN5.prototype._parseBase = function _parseBase(number, base, start) {
        this.words = [0];
        this.length = 1;
        for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) {
          limbLen++;
        }
        limbLen--;
        limbPow = limbPow / base | 0;
        var total = number.length - start;
        var mod = total % limbLen;
        var end = Math.min(total, total - mod) + start;
        var word = 0;
        for (var i = start; i < end; i += limbLen) {
          word = parseBase(number, i, i + limbLen, base);
          this.imuln(limbPow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        if (mod !== 0) {
          var pow = 1;
          word = parseBase(number, i, number.length, base);
          for (i = 0; i < mod; i++) {
            pow *= base;
          }
          this.imuln(pow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        this._strip();
      };
      BN5.prototype.copy = function copy(dest) {
        dest.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          dest.words[i] = this.words[i];
        }
        dest.length = this.length;
        dest.negative = this.negative;
        dest.red = this.red;
      };
      function move(dest, src) {
        dest.words = src.words;
        dest.length = src.length;
        dest.negative = src.negative;
        dest.red = src.red;
      }
      BN5.prototype._move = function _move(dest) {
        move(dest, this);
      };
      BN5.prototype.clone = function clone2() {
        var r = new BN5(null);
        this.copy(r);
        return r;
      };
      BN5.prototype._expand = function _expand(size) {
        while (this.length < size) {
          this.words[this.length++] = 0;
        }
        return this;
      };
      BN5.prototype._strip = function strip() {
        while (this.length > 1 && this.words[this.length - 1] === 0) {
          this.length--;
        }
        return this._normSign();
      };
      BN5.prototype._normSign = function _normSign() {
        if (this.length === 1 && this.words[0] === 0) {
          this.negative = 0;
        }
        return this;
      };
      if (typeof Symbol !== "undefined" && typeof Symbol.for === "function") {
        try {
          BN5.prototype[Symbol.for("nodejs.util.inspect.custom")] = inspect;
        } catch (e) {
          BN5.prototype.inspect = inspect;
        }
      } else {
        BN5.prototype.inspect = inspect;
      }
      function inspect() {
        return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
      }
      var zeros = [
        "",
        "0",
        "00",
        "000",
        "0000",
        "00000",
        "000000",
        "0000000",
        "00000000",
        "000000000",
        "0000000000",
        "00000000000",
        "000000000000",
        "0000000000000",
        "00000000000000",
        "000000000000000",
        "0000000000000000",
        "00000000000000000",
        "000000000000000000",
        "0000000000000000000",
        "00000000000000000000",
        "000000000000000000000",
        "0000000000000000000000",
        "00000000000000000000000",
        "000000000000000000000000",
        "0000000000000000000000000"
      ];
      var groupSizes = [
        0,
        0,
        25,
        16,
        12,
        11,
        10,
        9,
        8,
        8,
        7,
        7,
        7,
        7,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5
      ];
      var groupBases = [
        0,
        0,
        33554432,
        43046721,
        16777216,
        48828125,
        60466176,
        40353607,
        16777216,
        43046721,
        1e7,
        19487171,
        35831808,
        62748517,
        7529536,
        11390625,
        16777216,
        24137569,
        34012224,
        47045881,
        64e6,
        4084101,
        5153632,
        6436343,
        7962624,
        9765625,
        11881376,
        14348907,
        17210368,
        20511149,
        243e5,
        28629151,
        33554432,
        39135393,
        45435424,
        52521875,
        60466176
      ];
      BN5.prototype.toString = function toString(base, padding) {
        base = base || 10;
        padding = padding | 0 || 1;
        var out;
        if (base === 16 || base === "hex") {
          out = "";
          var off = 0;
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = this.words[i];
            var word = ((w << off | carry) & 16777215).toString(16);
            carry = w >>> 24 - off & 16777215;
            off += 2;
            if (off >= 26) {
              off -= 26;
              i--;
            }
            if (carry !== 0 || i !== this.length - 1) {
              out = zeros[6 - word.length] + word + out;
            } else {
              out = word + out;
            }
          }
          if (carry !== 0) {
            out = carry.toString(16) + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        if (base === (base | 0) && base >= 2 && base <= 36) {
          var groupSize = groupSizes[base];
          var groupBase = groupBases[base];
          out = "";
          var c = this.clone();
          c.negative = 0;
          while (!c.isZero()) {
            var r = c.modrn(groupBase).toString(base);
            c = c.idivn(groupBase);
            if (!c.isZero()) {
              out = zeros[groupSize - r.length] + r + out;
            } else {
              out = r + out;
            }
          }
          if (this.isZero()) {
            out = "0" + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        assert(false, "Base should be between 2 and 36");
      };
      BN5.prototype.toNumber = function toNumber() {
        var ret = this.words[0];
        if (this.length === 2) {
          ret += this.words[1] * 67108864;
        } else if (this.length === 3 && this.words[2] === 1) {
          ret += 4503599627370496 + this.words[1] * 67108864;
        } else if (this.length > 2) {
          assert(false, "Number can only safely store up to 53 bits");
        }
        return this.negative !== 0 ? -ret : ret;
      };
      BN5.prototype.toJSON = function toJSON() {
        return this.toString(16, 2);
      };
      if (Buffer2) {
        BN5.prototype.toBuffer = function toBuffer(endian, length) {
          return this.toArrayLike(Buffer2, endian, length);
        };
      }
      BN5.prototype.toArray = function toArray(endian, length) {
        return this.toArrayLike(Array, endian, length);
      };
      var allocate = function allocate2(ArrayType, size) {
        if (ArrayType.allocUnsafe) {
          return ArrayType.allocUnsafe(size);
        }
        return new ArrayType(size);
      };
      BN5.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
        this._strip();
        var byteLength = this.byteLength();
        var reqLength = length || Math.max(1, byteLength);
        assert(byteLength <= reqLength, "byte array longer than desired length");
        assert(reqLength > 0, "Requested array length <= 0");
        var res = allocate(ArrayType, reqLength);
        var postfix = endian === "le" ? "LE" : "BE";
        this["_toArrayLike" + postfix](res, byteLength);
        return res;
      };
      BN5.prototype._toArrayLikeLE = function _toArrayLikeLE(res, byteLength) {
        var position = 0;
        var carry = 0;
        for (var i = 0, shift = 0; i < this.length; i++) {
          var word = this.words[i] << shift | carry;
          res[position++] = word & 255;
          if (position < res.length) {
            res[position++] = word >> 8 & 255;
          }
          if (position < res.length) {
            res[position++] = word >> 16 & 255;
          }
          if (shift === 6) {
            if (position < res.length) {
              res[position++] = word >> 24 & 255;
            }
            carry = 0;
            shift = 0;
          } else {
            carry = word >>> 24;
            shift += 2;
          }
        }
        if (position < res.length) {
          res[position++] = carry;
          while (position < res.length) {
            res[position++] = 0;
          }
        }
      };
      BN5.prototype._toArrayLikeBE = function _toArrayLikeBE(res, byteLength) {
        var position = res.length - 1;
        var carry = 0;
        for (var i = 0, shift = 0; i < this.length; i++) {
          var word = this.words[i] << shift | carry;
          res[position--] = word & 255;
          if (position >= 0) {
            res[position--] = word >> 8 & 255;
          }
          if (position >= 0) {
            res[position--] = word >> 16 & 255;
          }
          if (shift === 6) {
            if (position >= 0) {
              res[position--] = word >> 24 & 255;
            }
            carry = 0;
            shift = 0;
          } else {
            carry = word >>> 24;
            shift += 2;
          }
        }
        if (position >= 0) {
          res[position--] = carry;
          while (position >= 0) {
            res[position--] = 0;
          }
        }
      };
      if (Math.clz32) {
        BN5.prototype._countBits = function _countBits(w) {
          return 32 - Math.clz32(w);
        };
      } else {
        BN5.prototype._countBits = function _countBits(w) {
          var t = w;
          var r = 0;
          if (t >= 4096) {
            r += 13;
            t >>>= 13;
          }
          if (t >= 64) {
            r += 7;
            t >>>= 7;
          }
          if (t >= 8) {
            r += 4;
            t >>>= 4;
          }
          if (t >= 2) {
            r += 2;
            t >>>= 2;
          }
          return r + t;
        };
      }
      BN5.prototype._zeroBits = function _zeroBits(w) {
        if (w === 0) return 26;
        var t = w;
        var r = 0;
        if ((t & 8191) === 0) {
          r += 13;
          t >>>= 13;
        }
        if ((t & 127) === 0) {
          r += 7;
          t >>>= 7;
        }
        if ((t & 15) === 0) {
          r += 4;
          t >>>= 4;
        }
        if ((t & 3) === 0) {
          r += 2;
          t >>>= 2;
        }
        if ((t & 1) === 0) {
          r++;
        }
        return r;
      };
      BN5.prototype.bitLength = function bitLength() {
        var w = this.words[this.length - 1];
        var hi = this._countBits(w);
        return (this.length - 1) * 26 + hi;
      };
      function toBitArray(num) {
        var w = new Array(num.bitLength());
        for (var bit = 0; bit < w.length; bit++) {
          var off = bit / 26 | 0;
          var wbit = bit % 26;
          w[bit] = num.words[off] >>> wbit & 1;
        }
        return w;
      }
      BN5.prototype.zeroBits = function zeroBits() {
        if (this.isZero()) return 0;
        var r = 0;
        for (var i = 0; i < this.length; i++) {
          var b = this._zeroBits(this.words[i]);
          r += b;
          if (b !== 26) break;
        }
        return r;
      };
      BN5.prototype.byteLength = function byteLength() {
        return Math.ceil(this.bitLength() / 8);
      };
      BN5.prototype.toTwos = function toTwos(width) {
        if (this.negative !== 0) {
          return this.abs().inotn(width).iaddn(1);
        }
        return this.clone();
      };
      BN5.prototype.fromTwos = function fromTwos(width) {
        if (this.testn(width - 1)) {
          return this.notn(width).iaddn(1).ineg();
        }
        return this.clone();
      };
      BN5.prototype.isNeg = function isNeg() {
        return this.negative !== 0;
      };
      BN5.prototype.neg = function neg() {
        return this.clone().ineg();
      };
      BN5.prototype.ineg = function ineg() {
        if (!this.isZero()) {
          this.negative ^= 1;
        }
        return this;
      };
      BN5.prototype.iuor = function iuor(num) {
        while (this.length < num.length) {
          this.words[this.length++] = 0;
        }
        for (var i = 0; i < num.length; i++) {
          this.words[i] = this.words[i] | num.words[i];
        }
        return this._strip();
      };
      BN5.prototype.ior = function ior(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuor(num);
      };
      BN5.prototype.or = function or(num) {
        if (this.length > num.length) return this.clone().ior(num);
        return num.clone().ior(this);
      };
      BN5.prototype.uor = function uor(num) {
        if (this.length > num.length) return this.clone().iuor(num);
        return num.clone().iuor(this);
      };
      BN5.prototype.iuand = function iuand(num) {
        var b;
        if (this.length > num.length) {
          b = num;
        } else {
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = this.words[i] & num.words[i];
        }
        this.length = b.length;
        return this._strip();
      };
      BN5.prototype.iand = function iand(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuand(num);
      };
      BN5.prototype.and = function and(num) {
        if (this.length > num.length) return this.clone().iand(num);
        return num.clone().iand(this);
      };
      BN5.prototype.uand = function uand(num) {
        if (this.length > num.length) return this.clone().iuand(num);
        return num.clone().iuand(this);
      };
      BN5.prototype.iuxor = function iuxor(num) {
        var a;
        var b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = a.words[i] ^ b.words[i];
        }
        if (this !== a) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = a.length;
        return this._strip();
      };
      BN5.prototype.ixor = function ixor(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuxor(num);
      };
      BN5.prototype.xor = function xor(num) {
        if (this.length > num.length) return this.clone().ixor(num);
        return num.clone().ixor(this);
      };
      BN5.prototype.uxor = function uxor(num) {
        if (this.length > num.length) return this.clone().iuxor(num);
        return num.clone().iuxor(this);
      };
      BN5.prototype.inotn = function inotn(width) {
        assert(typeof width === "number" && width >= 0);
        var bytesNeeded = Math.ceil(width / 26) | 0;
        var bitsLeft = width % 26;
        this._expand(bytesNeeded);
        if (bitsLeft > 0) {
          bytesNeeded--;
        }
        for (var i = 0; i < bytesNeeded; i++) {
          this.words[i] = ~this.words[i] & 67108863;
        }
        if (bitsLeft > 0) {
          this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft;
        }
        return this._strip();
      };
      BN5.prototype.notn = function notn(width) {
        return this.clone().inotn(width);
      };
      BN5.prototype.setn = function setn(bit, val) {
        assert(typeof bit === "number" && bit >= 0);
        var off = bit / 26 | 0;
        var wbit = bit % 26;
        this._expand(off + 1);
        if (val) {
          this.words[off] = this.words[off] | 1 << wbit;
        } else {
          this.words[off] = this.words[off] & ~(1 << wbit);
        }
        return this._strip();
      };
      BN5.prototype.iadd = function iadd(num) {
        var r;
        if (this.negative !== 0 && num.negative === 0) {
          this.negative = 0;
          r = this.isub(num);
          this.negative ^= 1;
          return this._normSign();
        } else if (this.negative === 0 && num.negative !== 0) {
          num.negative = 0;
          r = this.isub(num);
          num.negative = 1;
          return r._normSign();
        }
        var a, b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        this.length = a.length;
        if (carry !== 0) {
          this.words[this.length] = carry;
          this.length++;
        } else if (a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        return this;
      };
      BN5.prototype.add = function add(num) {
        var res;
        if (num.negative !== 0 && this.negative === 0) {
          num.negative = 0;
          res = this.sub(num);
          num.negative ^= 1;
          return res;
        } else if (num.negative === 0 && this.negative !== 0) {
          this.negative = 0;
          res = num.sub(this);
          this.negative = 1;
          return res;
        }
        if (this.length > num.length) return this.clone().iadd(num);
        return num.clone().iadd(this);
      };
      BN5.prototype.isub = function isub(num) {
        if (num.negative !== 0) {
          num.negative = 0;
          var r = this.iadd(num);
          num.negative = 1;
          return r._normSign();
        } else if (this.negative !== 0) {
          this.negative = 0;
          this.iadd(num);
          this.negative = 1;
          return this._normSign();
        }
        var cmp = this.cmp(num);
        if (cmp === 0) {
          this.negative = 0;
          this.length = 1;
          this.words[0] = 0;
          return this;
        }
        var a, b;
        if (cmp > 0) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        if (carry === 0 && i < a.length && a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = Math.max(this.length, i);
        if (a !== this) {
          this.negative = 1;
        }
        return this._strip();
      };
      BN5.prototype.sub = function sub(num) {
        return this.clone().isub(num);
      };
      function smallMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        var len = self.length + num.length | 0;
        out.length = len;
        len = len - 1 | 0;
        var a = self.words[0] | 0;
        var b = num.words[0] | 0;
        var r = a * b;
        var lo = r & 67108863;
        var carry = r / 67108864 | 0;
        out.words[0] = lo;
        for (var k = 1; k < len; k++) {
          var ncarry = carry >>> 26;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j | 0;
            a = self.words[i] | 0;
            b = num.words[j] | 0;
            r = a * b + rword;
            ncarry += r / 67108864 | 0;
            rword = r & 67108863;
          }
          out.words[k] = rword | 0;
          carry = ncarry | 0;
        }
        if (carry !== 0) {
          out.words[k] = carry | 0;
        } else {
          out.length--;
        }
        return out._strip();
      }
      var comb10MulTo = function comb10MulTo2(self, num, out) {
        var a = self.words;
        var b = num.words;
        var o = out.words;
        var c = 0;
        var lo;
        var mid;
        var hi;
        var a0 = a[0] | 0;
        var al0 = a0 & 8191;
        var ah0 = a0 >>> 13;
        var a1 = a[1] | 0;
        var al1 = a1 & 8191;
        var ah1 = a1 >>> 13;
        var a2 = a[2] | 0;
        var al2 = a2 & 8191;
        var ah2 = a2 >>> 13;
        var a3 = a[3] | 0;
        var al3 = a3 & 8191;
        var ah3 = a3 >>> 13;
        var a4 = a[4] | 0;
        var al4 = a4 & 8191;
        var ah4 = a4 >>> 13;
        var a5 = a[5] | 0;
        var al5 = a5 & 8191;
        var ah5 = a5 >>> 13;
        var a6 = a[6] | 0;
        var al6 = a6 & 8191;
        var ah6 = a6 >>> 13;
        var a7 = a[7] | 0;
        var al7 = a7 & 8191;
        var ah7 = a7 >>> 13;
        var a8 = a[8] | 0;
        var al8 = a8 & 8191;
        var ah8 = a8 >>> 13;
        var a9 = a[9] | 0;
        var al9 = a9 & 8191;
        var ah9 = a9 >>> 13;
        var b0 = b[0] | 0;
        var bl0 = b0 & 8191;
        var bh0 = b0 >>> 13;
        var b1 = b[1] | 0;
        var bl1 = b1 & 8191;
        var bh1 = b1 >>> 13;
        var b2 = b[2] | 0;
        var bl2 = b2 & 8191;
        var bh2 = b2 >>> 13;
        var b3 = b[3] | 0;
        var bl3 = b3 & 8191;
        var bh3 = b3 >>> 13;
        var b4 = b[4] | 0;
        var bl4 = b4 & 8191;
        var bh4 = b4 >>> 13;
        var b5 = b[5] | 0;
        var bl5 = b5 & 8191;
        var bh5 = b5 >>> 13;
        var b6 = b[6] | 0;
        var bl6 = b6 & 8191;
        var bh6 = b6 >>> 13;
        var b7 = b[7] | 0;
        var bl7 = b7 & 8191;
        var bh7 = b7 >>> 13;
        var b8 = b[8] | 0;
        var bl8 = b8 & 8191;
        var bh8 = b8 >>> 13;
        var b9 = b[9] | 0;
        var bl9 = b9 & 8191;
        var bh9 = b9 >>> 13;
        out.negative = self.negative ^ num.negative;
        out.length = 19;
        lo = Math.imul(al0, bl0);
        mid = Math.imul(al0, bh0);
        mid = mid + Math.imul(ah0, bl0) | 0;
        hi = Math.imul(ah0, bh0);
        var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
        w0 &= 67108863;
        lo = Math.imul(al1, bl0);
        mid = Math.imul(al1, bh0);
        mid = mid + Math.imul(ah1, bl0) | 0;
        hi = Math.imul(ah1, bh0);
        lo = lo + Math.imul(al0, bl1) | 0;
        mid = mid + Math.imul(al0, bh1) | 0;
        mid = mid + Math.imul(ah0, bl1) | 0;
        hi = hi + Math.imul(ah0, bh1) | 0;
        var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
        w1 &= 67108863;
        lo = Math.imul(al2, bl0);
        mid = Math.imul(al2, bh0);
        mid = mid + Math.imul(ah2, bl0) | 0;
        hi = Math.imul(ah2, bh0);
        lo = lo + Math.imul(al1, bl1) | 0;
        mid = mid + Math.imul(al1, bh1) | 0;
        mid = mid + Math.imul(ah1, bl1) | 0;
        hi = hi + Math.imul(ah1, bh1) | 0;
        lo = lo + Math.imul(al0, bl2) | 0;
        mid = mid + Math.imul(al0, bh2) | 0;
        mid = mid + Math.imul(ah0, bl2) | 0;
        hi = hi + Math.imul(ah0, bh2) | 0;
        var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
        w2 &= 67108863;
        lo = Math.imul(al3, bl0);
        mid = Math.imul(al3, bh0);
        mid = mid + Math.imul(ah3, bl0) | 0;
        hi = Math.imul(ah3, bh0);
        lo = lo + Math.imul(al2, bl1) | 0;
        mid = mid + Math.imul(al2, bh1) | 0;
        mid = mid + Math.imul(ah2, bl1) | 0;
        hi = hi + Math.imul(ah2, bh1) | 0;
        lo = lo + Math.imul(al1, bl2) | 0;
        mid = mid + Math.imul(al1, bh2) | 0;
        mid = mid + Math.imul(ah1, bl2) | 0;
        hi = hi + Math.imul(ah1, bh2) | 0;
        lo = lo + Math.imul(al0, bl3) | 0;
        mid = mid + Math.imul(al0, bh3) | 0;
        mid = mid + Math.imul(ah0, bl3) | 0;
        hi = hi + Math.imul(ah0, bh3) | 0;
        var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
        w3 &= 67108863;
        lo = Math.imul(al4, bl0);
        mid = Math.imul(al4, bh0);
        mid = mid + Math.imul(ah4, bl0) | 0;
        hi = Math.imul(ah4, bh0);
        lo = lo + Math.imul(al3, bl1) | 0;
        mid = mid + Math.imul(al3, bh1) | 0;
        mid = mid + Math.imul(ah3, bl1) | 0;
        hi = hi + Math.imul(ah3, bh1) | 0;
        lo = lo + Math.imul(al2, bl2) | 0;
        mid = mid + Math.imul(al2, bh2) | 0;
        mid = mid + Math.imul(ah2, bl2) | 0;
        hi = hi + Math.imul(ah2, bh2) | 0;
        lo = lo + Math.imul(al1, bl3) | 0;
        mid = mid + Math.imul(al1, bh3) | 0;
        mid = mid + Math.imul(ah1, bl3) | 0;
        hi = hi + Math.imul(ah1, bh3) | 0;
        lo = lo + Math.imul(al0, bl4) | 0;
        mid = mid + Math.imul(al0, bh4) | 0;
        mid = mid + Math.imul(ah0, bl4) | 0;
        hi = hi + Math.imul(ah0, bh4) | 0;
        var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
        w4 &= 67108863;
        lo = Math.imul(al5, bl0);
        mid = Math.imul(al5, bh0);
        mid = mid + Math.imul(ah5, bl0) | 0;
        hi = Math.imul(ah5, bh0);
        lo = lo + Math.imul(al4, bl1) | 0;
        mid = mid + Math.imul(al4, bh1) | 0;
        mid = mid + Math.imul(ah4, bl1) | 0;
        hi = hi + Math.imul(ah4, bh1) | 0;
        lo = lo + Math.imul(al3, bl2) | 0;
        mid = mid + Math.imul(al3, bh2) | 0;
        mid = mid + Math.imul(ah3, bl2) | 0;
        hi = hi + Math.imul(ah3, bh2) | 0;
        lo = lo + Math.imul(al2, bl3) | 0;
        mid = mid + Math.imul(al2, bh3) | 0;
        mid = mid + Math.imul(ah2, bl3) | 0;
        hi = hi + Math.imul(ah2, bh3) | 0;
        lo = lo + Math.imul(al1, bl4) | 0;
        mid = mid + Math.imul(al1, bh4) | 0;
        mid = mid + Math.imul(ah1, bl4) | 0;
        hi = hi + Math.imul(ah1, bh4) | 0;
        lo = lo + Math.imul(al0, bl5) | 0;
        mid = mid + Math.imul(al0, bh5) | 0;
        mid = mid + Math.imul(ah0, bl5) | 0;
        hi = hi + Math.imul(ah0, bh5) | 0;
        var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
        w5 &= 67108863;
        lo = Math.imul(al6, bl0);
        mid = Math.imul(al6, bh0);
        mid = mid + Math.imul(ah6, bl0) | 0;
        hi = Math.imul(ah6, bh0);
        lo = lo + Math.imul(al5, bl1) | 0;
        mid = mid + Math.imul(al5, bh1) | 0;
        mid = mid + Math.imul(ah5, bl1) | 0;
        hi = hi + Math.imul(ah5, bh1) | 0;
        lo = lo + Math.imul(al4, bl2) | 0;
        mid = mid + Math.imul(al4, bh2) | 0;
        mid = mid + Math.imul(ah4, bl2) | 0;
        hi = hi + Math.imul(ah4, bh2) | 0;
        lo = lo + Math.imul(al3, bl3) | 0;
        mid = mid + Math.imul(al3, bh3) | 0;
        mid = mid + Math.imul(ah3, bl3) | 0;
        hi = hi + Math.imul(ah3, bh3) | 0;
        lo = lo + Math.imul(al2, bl4) | 0;
        mid = mid + Math.imul(al2, bh4) | 0;
        mid = mid + Math.imul(ah2, bl4) | 0;
        hi = hi + Math.imul(ah2, bh4) | 0;
        lo = lo + Math.imul(al1, bl5) | 0;
        mid = mid + Math.imul(al1, bh5) | 0;
        mid = mid + Math.imul(ah1, bl5) | 0;
        hi = hi + Math.imul(ah1, bh5) | 0;
        lo = lo + Math.imul(al0, bl6) | 0;
        mid = mid + Math.imul(al0, bh6) | 0;
        mid = mid + Math.imul(ah0, bl6) | 0;
        hi = hi + Math.imul(ah0, bh6) | 0;
        var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
        w6 &= 67108863;
        lo = Math.imul(al7, bl0);
        mid = Math.imul(al7, bh0);
        mid = mid + Math.imul(ah7, bl0) | 0;
        hi = Math.imul(ah7, bh0);
        lo = lo + Math.imul(al6, bl1) | 0;
        mid = mid + Math.imul(al6, bh1) | 0;
        mid = mid + Math.imul(ah6, bl1) | 0;
        hi = hi + Math.imul(ah6, bh1) | 0;
        lo = lo + Math.imul(al5, bl2) | 0;
        mid = mid + Math.imul(al5, bh2) | 0;
        mid = mid + Math.imul(ah5, bl2) | 0;
        hi = hi + Math.imul(ah5, bh2) | 0;
        lo = lo + Math.imul(al4, bl3) | 0;
        mid = mid + Math.imul(al4, bh3) | 0;
        mid = mid + Math.imul(ah4, bl3) | 0;
        hi = hi + Math.imul(ah4, bh3) | 0;
        lo = lo + Math.imul(al3, bl4) | 0;
        mid = mid + Math.imul(al3, bh4) | 0;
        mid = mid + Math.imul(ah3, bl4) | 0;
        hi = hi + Math.imul(ah3, bh4) | 0;
        lo = lo + Math.imul(al2, bl5) | 0;
        mid = mid + Math.imul(al2, bh5) | 0;
        mid = mid + Math.imul(ah2, bl5) | 0;
        hi = hi + Math.imul(ah2, bh5) | 0;
        lo = lo + Math.imul(al1, bl6) | 0;
        mid = mid + Math.imul(al1, bh6) | 0;
        mid = mid + Math.imul(ah1, bl6) | 0;
        hi = hi + Math.imul(ah1, bh6) | 0;
        lo = lo + Math.imul(al0, bl7) | 0;
        mid = mid + Math.imul(al0, bh7) | 0;
        mid = mid + Math.imul(ah0, bl7) | 0;
        hi = hi + Math.imul(ah0, bh7) | 0;
        var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
        w7 &= 67108863;
        lo = Math.imul(al8, bl0);
        mid = Math.imul(al8, bh0);
        mid = mid + Math.imul(ah8, bl0) | 0;
        hi = Math.imul(ah8, bh0);
        lo = lo + Math.imul(al7, bl1) | 0;
        mid = mid + Math.imul(al7, bh1) | 0;
        mid = mid + Math.imul(ah7, bl1) | 0;
        hi = hi + Math.imul(ah7, bh1) | 0;
        lo = lo + Math.imul(al6, bl2) | 0;
        mid = mid + Math.imul(al6, bh2) | 0;
        mid = mid + Math.imul(ah6, bl2) | 0;
        hi = hi + Math.imul(ah6, bh2) | 0;
        lo = lo + Math.imul(al5, bl3) | 0;
        mid = mid + Math.imul(al5, bh3) | 0;
        mid = mid + Math.imul(ah5, bl3) | 0;
        hi = hi + Math.imul(ah5, bh3) | 0;
        lo = lo + Math.imul(al4, bl4) | 0;
        mid = mid + Math.imul(al4, bh4) | 0;
        mid = mid + Math.imul(ah4, bl4) | 0;
        hi = hi + Math.imul(ah4, bh4) | 0;
        lo = lo + Math.imul(al3, bl5) | 0;
        mid = mid + Math.imul(al3, bh5) | 0;
        mid = mid + Math.imul(ah3, bl5) | 0;
        hi = hi + Math.imul(ah3, bh5) | 0;
        lo = lo + Math.imul(al2, bl6) | 0;
        mid = mid + Math.imul(al2, bh6) | 0;
        mid = mid + Math.imul(ah2, bl6) | 0;
        hi = hi + Math.imul(ah2, bh6) | 0;
        lo = lo + Math.imul(al1, bl7) | 0;
        mid = mid + Math.imul(al1, bh7) | 0;
        mid = mid + Math.imul(ah1, bl7) | 0;
        hi = hi + Math.imul(ah1, bh7) | 0;
        lo = lo + Math.imul(al0, bl8) | 0;
        mid = mid + Math.imul(al0, bh8) | 0;
        mid = mid + Math.imul(ah0, bl8) | 0;
        hi = hi + Math.imul(ah0, bh8) | 0;
        var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
        w8 &= 67108863;
        lo = Math.imul(al9, bl0);
        mid = Math.imul(al9, bh0);
        mid = mid + Math.imul(ah9, bl0) | 0;
        hi = Math.imul(ah9, bh0);
        lo = lo + Math.imul(al8, bl1) | 0;
        mid = mid + Math.imul(al8, bh1) | 0;
        mid = mid + Math.imul(ah8, bl1) | 0;
        hi = hi + Math.imul(ah8, bh1) | 0;
        lo = lo + Math.imul(al7, bl2) | 0;
        mid = mid + Math.imul(al7, bh2) | 0;
        mid = mid + Math.imul(ah7, bl2) | 0;
        hi = hi + Math.imul(ah7, bh2) | 0;
        lo = lo + Math.imul(al6, bl3) | 0;
        mid = mid + Math.imul(al6, bh3) | 0;
        mid = mid + Math.imul(ah6, bl3) | 0;
        hi = hi + Math.imul(ah6, bh3) | 0;
        lo = lo + Math.imul(al5, bl4) | 0;
        mid = mid + Math.imul(al5, bh4) | 0;
        mid = mid + Math.imul(ah5, bl4) | 0;
        hi = hi + Math.imul(ah5, bh4) | 0;
        lo = lo + Math.imul(al4, bl5) | 0;
        mid = mid + Math.imul(al4, bh5) | 0;
        mid = mid + Math.imul(ah4, bl5) | 0;
        hi = hi + Math.imul(ah4, bh5) | 0;
        lo = lo + Math.imul(al3, bl6) | 0;
        mid = mid + Math.imul(al3, bh6) | 0;
        mid = mid + Math.imul(ah3, bl6) | 0;
        hi = hi + Math.imul(ah3, bh6) | 0;
        lo = lo + Math.imul(al2, bl7) | 0;
        mid = mid + Math.imul(al2, bh7) | 0;
        mid = mid + Math.imul(ah2, bl7) | 0;
        hi = hi + Math.imul(ah2, bh7) | 0;
        lo = lo + Math.imul(al1, bl8) | 0;
        mid = mid + Math.imul(al1, bh8) | 0;
        mid = mid + Math.imul(ah1, bl8) | 0;
        hi = hi + Math.imul(ah1, bh8) | 0;
        lo = lo + Math.imul(al0, bl9) | 0;
        mid = mid + Math.imul(al0, bh9) | 0;
        mid = mid + Math.imul(ah0, bl9) | 0;
        hi = hi + Math.imul(ah0, bh9) | 0;
        var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
        w9 &= 67108863;
        lo = Math.imul(al9, bl1);
        mid = Math.imul(al9, bh1);
        mid = mid + Math.imul(ah9, bl1) | 0;
        hi = Math.imul(ah9, bh1);
        lo = lo + Math.imul(al8, bl2) | 0;
        mid = mid + Math.imul(al8, bh2) | 0;
        mid = mid + Math.imul(ah8, bl2) | 0;
        hi = hi + Math.imul(ah8, bh2) | 0;
        lo = lo + Math.imul(al7, bl3) | 0;
        mid = mid + Math.imul(al7, bh3) | 0;
        mid = mid + Math.imul(ah7, bl3) | 0;
        hi = hi + Math.imul(ah7, bh3) | 0;
        lo = lo + Math.imul(al6, bl4) | 0;
        mid = mid + Math.imul(al6, bh4) | 0;
        mid = mid + Math.imul(ah6, bl4) | 0;
        hi = hi + Math.imul(ah6, bh4) | 0;
        lo = lo + Math.imul(al5, bl5) | 0;
        mid = mid + Math.imul(al5, bh5) | 0;
        mid = mid + Math.imul(ah5, bl5) | 0;
        hi = hi + Math.imul(ah5, bh5) | 0;
        lo = lo + Math.imul(al4, bl6) | 0;
        mid = mid + Math.imul(al4, bh6) | 0;
        mid = mid + Math.imul(ah4, bl6) | 0;
        hi = hi + Math.imul(ah4, bh6) | 0;
        lo = lo + Math.imul(al3, bl7) | 0;
        mid = mid + Math.imul(al3, bh7) | 0;
        mid = mid + Math.imul(ah3, bl7) | 0;
        hi = hi + Math.imul(ah3, bh7) | 0;
        lo = lo + Math.imul(al2, bl8) | 0;
        mid = mid + Math.imul(al2, bh8) | 0;
        mid = mid + Math.imul(ah2, bl8) | 0;
        hi = hi + Math.imul(ah2, bh8) | 0;
        lo = lo + Math.imul(al1, bl9) | 0;
        mid = mid + Math.imul(al1, bh9) | 0;
        mid = mid + Math.imul(ah1, bl9) | 0;
        hi = hi + Math.imul(ah1, bh9) | 0;
        var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
        w10 &= 67108863;
        lo = Math.imul(al9, bl2);
        mid = Math.imul(al9, bh2);
        mid = mid + Math.imul(ah9, bl2) | 0;
        hi = Math.imul(ah9, bh2);
        lo = lo + Math.imul(al8, bl3) | 0;
        mid = mid + Math.imul(al8, bh3) | 0;
        mid = mid + Math.imul(ah8, bl3) | 0;
        hi = hi + Math.imul(ah8, bh3) | 0;
        lo = lo + Math.imul(al7, bl4) | 0;
        mid = mid + Math.imul(al7, bh4) | 0;
        mid = mid + Math.imul(ah7, bl4) | 0;
        hi = hi + Math.imul(ah7, bh4) | 0;
        lo = lo + Math.imul(al6, bl5) | 0;
        mid = mid + Math.imul(al6, bh5) | 0;
        mid = mid + Math.imul(ah6, bl5) | 0;
        hi = hi + Math.imul(ah6, bh5) | 0;
        lo = lo + Math.imul(al5, bl6) | 0;
        mid = mid + Math.imul(al5, bh6) | 0;
        mid = mid + Math.imul(ah5, bl6) | 0;
        hi = hi + Math.imul(ah5, bh6) | 0;
        lo = lo + Math.imul(al4, bl7) | 0;
        mid = mid + Math.imul(al4, bh7) | 0;
        mid = mid + Math.imul(ah4, bl7) | 0;
        hi = hi + Math.imul(ah4, bh7) | 0;
        lo = lo + Math.imul(al3, bl8) | 0;
        mid = mid + Math.imul(al3, bh8) | 0;
        mid = mid + Math.imul(ah3, bl8) | 0;
        hi = hi + Math.imul(ah3, bh8) | 0;
        lo = lo + Math.imul(al2, bl9) | 0;
        mid = mid + Math.imul(al2, bh9) | 0;
        mid = mid + Math.imul(ah2, bl9) | 0;
        hi = hi + Math.imul(ah2, bh9) | 0;
        var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
        w11 &= 67108863;
        lo = Math.imul(al9, bl3);
        mid = Math.imul(al9, bh3);
        mid = mid + Math.imul(ah9, bl3) | 0;
        hi = Math.imul(ah9, bh3);
        lo = lo + Math.imul(al8, bl4) | 0;
        mid = mid + Math.imul(al8, bh4) | 0;
        mid = mid + Math.imul(ah8, bl4) | 0;
        hi = hi + Math.imul(ah8, bh4) | 0;
        lo = lo + Math.imul(al7, bl5) | 0;
        mid = mid + Math.imul(al7, bh5) | 0;
        mid = mid + Math.imul(ah7, bl5) | 0;
        hi = hi + Math.imul(ah7, bh5) | 0;
        lo = lo + Math.imul(al6, bl6) | 0;
        mid = mid + Math.imul(al6, bh6) | 0;
        mid = mid + Math.imul(ah6, bl6) | 0;
        hi = hi + Math.imul(ah6, bh6) | 0;
        lo = lo + Math.imul(al5, bl7) | 0;
        mid = mid + Math.imul(al5, bh7) | 0;
        mid = mid + Math.imul(ah5, bl7) | 0;
        hi = hi + Math.imul(ah5, bh7) | 0;
        lo = lo + Math.imul(al4, bl8) | 0;
        mid = mid + Math.imul(al4, bh8) | 0;
        mid = mid + Math.imul(ah4, bl8) | 0;
        hi = hi + Math.imul(ah4, bh8) | 0;
        lo = lo + Math.imul(al3, bl9) | 0;
        mid = mid + Math.imul(al3, bh9) | 0;
        mid = mid + Math.imul(ah3, bl9) | 0;
        hi = hi + Math.imul(ah3, bh9) | 0;
        var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
        w12 &= 67108863;
        lo = Math.imul(al9, bl4);
        mid = Math.imul(al9, bh4);
        mid = mid + Math.imul(ah9, bl4) | 0;
        hi = Math.imul(ah9, bh4);
        lo = lo + Math.imul(al8, bl5) | 0;
        mid = mid + Math.imul(al8, bh5) | 0;
        mid = mid + Math.imul(ah8, bl5) | 0;
        hi = hi + Math.imul(ah8, bh5) | 0;
        lo = lo + Math.imul(al7, bl6) | 0;
        mid = mid + Math.imul(al7, bh6) | 0;
        mid = mid + Math.imul(ah7, bl6) | 0;
        hi = hi + Math.imul(ah7, bh6) | 0;
        lo = lo + Math.imul(al6, bl7) | 0;
        mid = mid + Math.imul(al6, bh7) | 0;
        mid = mid + Math.imul(ah6, bl7) | 0;
        hi = hi + Math.imul(ah6, bh7) | 0;
        lo = lo + Math.imul(al5, bl8) | 0;
        mid = mid + Math.imul(al5, bh8) | 0;
        mid = mid + Math.imul(ah5, bl8) | 0;
        hi = hi + Math.imul(ah5, bh8) | 0;
        lo = lo + Math.imul(al4, bl9) | 0;
        mid = mid + Math.imul(al4, bh9) | 0;
        mid = mid + Math.imul(ah4, bl9) | 0;
        hi = hi + Math.imul(ah4, bh9) | 0;
        var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
        w13 &= 67108863;
        lo = Math.imul(al9, bl5);
        mid = Math.imul(al9, bh5);
        mid = mid + Math.imul(ah9, bl5) | 0;
        hi = Math.imul(ah9, bh5);
        lo = lo + Math.imul(al8, bl6) | 0;
        mid = mid + Math.imul(al8, bh6) | 0;
        mid = mid + Math.imul(ah8, bl6) | 0;
        hi = hi + Math.imul(ah8, bh6) | 0;
        lo = lo + Math.imul(al7, bl7) | 0;
        mid = mid + Math.imul(al7, bh7) | 0;
        mid = mid + Math.imul(ah7, bl7) | 0;
        hi = hi + Math.imul(ah7, bh7) | 0;
        lo = lo + Math.imul(al6, bl8) | 0;
        mid = mid + Math.imul(al6, bh8) | 0;
        mid = mid + Math.imul(ah6, bl8) | 0;
        hi = hi + Math.imul(ah6, bh8) | 0;
        lo = lo + Math.imul(al5, bl9) | 0;
        mid = mid + Math.imul(al5, bh9) | 0;
        mid = mid + Math.imul(ah5, bl9) | 0;
        hi = hi + Math.imul(ah5, bh9) | 0;
        var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
        w14 &= 67108863;
        lo = Math.imul(al9, bl6);
        mid = Math.imul(al9, bh6);
        mid = mid + Math.imul(ah9, bl6) | 0;
        hi = Math.imul(ah9, bh6);
        lo = lo + Math.imul(al8, bl7) | 0;
        mid = mid + Math.imul(al8, bh7) | 0;
        mid = mid + Math.imul(ah8, bl7) | 0;
        hi = hi + Math.imul(ah8, bh7) | 0;
        lo = lo + Math.imul(al7, bl8) | 0;
        mid = mid + Math.imul(al7, bh8) | 0;
        mid = mid + Math.imul(ah7, bl8) | 0;
        hi = hi + Math.imul(ah7, bh8) | 0;
        lo = lo + Math.imul(al6, bl9) | 0;
        mid = mid + Math.imul(al6, bh9) | 0;
        mid = mid + Math.imul(ah6, bl9) | 0;
        hi = hi + Math.imul(ah6, bh9) | 0;
        var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
        w15 &= 67108863;
        lo = Math.imul(al9, bl7);
        mid = Math.imul(al9, bh7);
        mid = mid + Math.imul(ah9, bl7) | 0;
        hi = Math.imul(ah9, bh7);
        lo = lo + Math.imul(al8, bl8) | 0;
        mid = mid + Math.imul(al8, bh8) | 0;
        mid = mid + Math.imul(ah8, bl8) | 0;
        hi = hi + Math.imul(ah8, bh8) | 0;
        lo = lo + Math.imul(al7, bl9) | 0;
        mid = mid + Math.imul(al7, bh9) | 0;
        mid = mid + Math.imul(ah7, bl9) | 0;
        hi = hi + Math.imul(ah7, bh9) | 0;
        var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
        w16 &= 67108863;
        lo = Math.imul(al9, bl8);
        mid = Math.imul(al9, bh8);
        mid = mid + Math.imul(ah9, bl8) | 0;
        hi = Math.imul(ah9, bh8);
        lo = lo + Math.imul(al8, bl9) | 0;
        mid = mid + Math.imul(al8, bh9) | 0;
        mid = mid + Math.imul(ah8, bl9) | 0;
        hi = hi + Math.imul(ah8, bh9) | 0;
        var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
        w17 &= 67108863;
        lo = Math.imul(al9, bl9);
        mid = Math.imul(al9, bh9);
        mid = mid + Math.imul(ah9, bl9) | 0;
        hi = Math.imul(ah9, bh9);
        var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
        w18 &= 67108863;
        o[0] = w0;
        o[1] = w1;
        o[2] = w2;
        o[3] = w3;
        o[4] = w4;
        o[5] = w5;
        o[6] = w6;
        o[7] = w7;
        o[8] = w8;
        o[9] = w9;
        o[10] = w10;
        o[11] = w11;
        o[12] = w12;
        o[13] = w13;
        o[14] = w14;
        o[15] = w15;
        o[16] = w16;
        o[17] = w17;
        o[18] = w18;
        if (c !== 0) {
          o[19] = c;
          out.length++;
        }
        return out;
      };
      if (!Math.imul) {
        comb10MulTo = smallMulTo;
      }
      function bigMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        out.length = self.length + num.length;
        var carry = 0;
        var hncarry = 0;
        for (var k = 0; k < out.length - 1; k++) {
          var ncarry = hncarry;
          hncarry = 0;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j;
            var a = self.words[i] | 0;
            var b = num.words[j] | 0;
            var r = a * b;
            var lo = r & 67108863;
            ncarry = ncarry + (r / 67108864 | 0) | 0;
            lo = lo + rword | 0;
            rword = lo & 67108863;
            ncarry = ncarry + (lo >>> 26) | 0;
            hncarry += ncarry >>> 26;
            ncarry &= 67108863;
          }
          out.words[k] = rword;
          carry = ncarry;
          ncarry = hncarry;
        }
        if (carry !== 0) {
          out.words[k] = carry;
        } else {
          out.length--;
        }
        return out._strip();
      }
      function jumboMulTo(self, num, out) {
        return bigMulTo(self, num, out);
      }
      BN5.prototype.mulTo = function mulTo(num, out) {
        var res;
        var len = this.length + num.length;
        if (this.length === 10 && num.length === 10) {
          res = comb10MulTo(this, num, out);
        } else if (len < 63) {
          res = smallMulTo(this, num, out);
        } else if (len < 1024) {
          res = bigMulTo(this, num, out);
        } else {
          res = jumboMulTo(this, num, out);
        }
        return res;
      };
      function FFTM(x, y) {
        this.x = x;
        this.y = y;
      }
      FFTM.prototype.makeRBT = function makeRBT(N) {
        var t = new Array(N);
        var l = BN5.prototype._countBits(N) - 1;
        for (var i = 0; i < N; i++) {
          t[i] = this.revBin(i, l, N);
        }
        return t;
      };
      FFTM.prototype.revBin = function revBin(x, l, N) {
        if (x === 0 || x === N - 1) return x;
        var rb = 0;
        for (var i = 0; i < l; i++) {
          rb |= (x & 1) << l - i - 1;
          x >>= 1;
        }
        return rb;
      };
      FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
        for (var i = 0; i < N; i++) {
          rtws[i] = rws[rbt[i]];
          itws[i] = iws[rbt[i]];
        }
      };
      FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
        this.permute(rbt, rws, iws, rtws, itws, N);
        for (var s = 1; s < N; s <<= 1) {
          var l = s << 1;
          var rtwdf = Math.cos(2 * Math.PI / l);
          var itwdf = Math.sin(2 * Math.PI / l);
          for (var p = 0; p < N; p += l) {
            var rtwdf_ = rtwdf;
            var itwdf_ = itwdf;
            for (var j = 0; j < s; j++) {
              var re = rtws[p + j];
              var ie = itws[p + j];
              var ro = rtws[p + j + s];
              var io = itws[p + j + s];
              var rx = rtwdf_ * ro - itwdf_ * io;
              io = rtwdf_ * io + itwdf_ * ro;
              ro = rx;
              rtws[p + j] = re + ro;
              itws[p + j] = ie + io;
              rtws[p + j + s] = re - ro;
              itws[p + j + s] = ie - io;
              if (j !== l) {
                rx = rtwdf * rtwdf_ - itwdf * itwdf_;
                itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                rtwdf_ = rx;
              }
            }
          }
        }
      };
      FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
        var N = Math.max(m, n) | 1;
        var odd = N & 1;
        var i = 0;
        for (N = N / 2 | 0; N; N = N >>> 1) {
          i++;
        }
        return 1 << i + 1 + odd;
      };
      FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
        if (N <= 1) return;
        for (var i = 0; i < N / 2; i++) {
          var t = rws[i];
          rws[i] = rws[N - i - 1];
          rws[N - i - 1] = t;
          t = iws[i];
          iws[i] = -iws[N - i - 1];
          iws[N - i - 1] = -t;
        }
      };
      FFTM.prototype.normalize13b = function normalize13b(ws, N) {
        var carry = 0;
        for (var i = 0; i < N / 2; i++) {
          var w = Math.round(ws[2 * i + 1] / N) * 8192 + Math.round(ws[2 * i] / N) + carry;
          ws[i] = w & 67108863;
          if (w < 67108864) {
            carry = 0;
          } else {
            carry = w / 67108864 | 0;
          }
        }
        return ws;
      };
      FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
        var carry = 0;
        for (var i = 0; i < len; i++) {
          carry = carry + (ws[i] | 0);
          rws[2 * i] = carry & 8191;
          carry = carry >>> 13;
          rws[2 * i + 1] = carry & 8191;
          carry = carry >>> 13;
        }
        for (i = 2 * len; i < N; ++i) {
          rws[i] = 0;
        }
        assert(carry === 0);
        assert((carry & ~8191) === 0);
      };
      FFTM.prototype.stub = function stub(N) {
        var ph = new Array(N);
        for (var i = 0; i < N; i++) {
          ph[i] = 0;
        }
        return ph;
      };
      FFTM.prototype.mulp = function mulp(x, y, out) {
        var N = 2 * this.guessLen13b(x.length, y.length);
        var rbt = this.makeRBT(N);
        var _ = this.stub(N);
        var rws = new Array(N);
        var rwst = new Array(N);
        var iwst = new Array(N);
        var nrws = new Array(N);
        var nrwst = new Array(N);
        var niwst = new Array(N);
        var rmws = out.words;
        rmws.length = N;
        this.convert13b(x.words, x.length, rws, N);
        this.convert13b(y.words, y.length, nrws, N);
        this.transform(rws, _, rwst, iwst, N, rbt);
        this.transform(nrws, _, nrwst, niwst, N, rbt);
        for (var i = 0; i < N; i++) {
          var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
          iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
          rwst[i] = rx;
        }
        this.conjugate(rwst, iwst, N);
        this.transform(rwst, iwst, rmws, _, N, rbt);
        this.conjugate(rmws, _, N);
        this.normalize13b(rmws, N);
        out.negative = x.negative ^ y.negative;
        out.length = x.length + y.length;
        return out._strip();
      };
      BN5.prototype.mul = function mul(num) {
        var out = new BN5(null);
        out.words = new Array(this.length + num.length);
        return this.mulTo(num, out);
      };
      BN5.prototype.mulf = function mulf(num) {
        var out = new BN5(null);
        out.words = new Array(this.length + num.length);
        return jumboMulTo(this, num, out);
      };
      BN5.prototype.imul = function imul(num) {
        return this.clone().mulTo(num, this);
      };
      BN5.prototype.imuln = function imuln(num) {
        var isNegNum = num < 0;
        if (isNegNum) num = -num;
        assert(typeof num === "number");
        assert(num < 67108864);
        var carry = 0;
        for (var i = 0; i < this.length; i++) {
          var w = (this.words[i] | 0) * num;
          var lo = (w & 67108863) + (carry & 67108863);
          carry >>= 26;
          carry += w / 67108864 | 0;
          carry += lo >>> 26;
          this.words[i] = lo & 67108863;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        this.length = num === 0 ? 1 : this.length;
        return isNegNum ? this.ineg() : this;
      };
      BN5.prototype.muln = function muln(num) {
        return this.clone().imuln(num);
      };
      BN5.prototype.sqr = function sqr() {
        return this.mul(this);
      };
      BN5.prototype.isqr = function isqr() {
        return this.imul(this.clone());
      };
      BN5.prototype.pow = function pow(num) {
        var w = toBitArray(num);
        if (w.length === 0) return new BN5(1);
        var res = this;
        for (var i = 0; i < w.length; i++, res = res.sqr()) {
          if (w[i] !== 0) break;
        }
        if (++i < w.length) {
          for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
            if (w[i] === 0) continue;
            res = res.mul(q);
          }
        }
        return res;
      };
      BN5.prototype.iushln = function iushln(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        var carryMask = 67108863 >>> 26 - r << 26 - r;
        var i;
        if (r !== 0) {
          var carry = 0;
          for (i = 0; i < this.length; i++) {
            var newCarry = this.words[i] & carryMask;
            var c = (this.words[i] | 0) - newCarry << r;
            this.words[i] = c | carry;
            carry = newCarry >>> 26 - r;
          }
          if (carry) {
            this.words[i] = carry;
            this.length++;
          }
        }
        if (s !== 0) {
          for (i = this.length - 1; i >= 0; i--) {
            this.words[i + s] = this.words[i];
          }
          for (i = 0; i < s; i++) {
            this.words[i] = 0;
          }
          this.length += s;
        }
        return this._strip();
      };
      BN5.prototype.ishln = function ishln(bits) {
        assert(this.negative === 0);
        return this.iushln(bits);
      };
      BN5.prototype.iushrn = function iushrn(bits, hint, extended) {
        assert(typeof bits === "number" && bits >= 0);
        var h;
        if (hint) {
          h = (hint - hint % 26) / 26;
        } else {
          h = 0;
        }
        var r = bits % 26;
        var s = Math.min((bits - r) / 26, this.length);
        var mask = 67108863 ^ 67108863 >>> r << r;
        var maskedWords = extended;
        h -= s;
        h = Math.max(0, h);
        if (maskedWords) {
          for (var i = 0; i < s; i++) {
            maskedWords.words[i] = this.words[i];
          }
          maskedWords.length = s;
        }
        if (s === 0) {
        } else if (this.length > s) {
          this.length -= s;
          for (i = 0; i < this.length; i++) {
            this.words[i] = this.words[i + s];
          }
        } else {
          this.words[0] = 0;
          this.length = 1;
        }
        var carry = 0;
        for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
          var word = this.words[i] | 0;
          this.words[i] = carry << 26 - r | word >>> r;
          carry = word & mask;
        }
        if (maskedWords && carry !== 0) {
          maskedWords.words[maskedWords.length++] = carry;
        }
        if (this.length === 0) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this._strip();
      };
      BN5.prototype.ishrn = function ishrn(bits, hint, extended) {
        assert(this.negative === 0);
        return this.iushrn(bits, hint, extended);
      };
      BN5.prototype.shln = function shln(bits) {
        return this.clone().ishln(bits);
      };
      BN5.prototype.ushln = function ushln(bits) {
        return this.clone().iushln(bits);
      };
      BN5.prototype.shrn = function shrn(bits) {
        return this.clone().ishrn(bits);
      };
      BN5.prototype.ushrn = function ushrn(bits) {
        return this.clone().iushrn(bits);
      };
      BN5.prototype.testn = function testn(bit) {
        assert(typeof bit === "number" && bit >= 0);
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) return false;
        var w = this.words[s];
        return !!(w & q);
      };
      BN5.prototype.imaskn = function imaskn(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        assert(this.negative === 0, "imaskn works only with positive numbers");
        if (this.length <= s) {
          return this;
        }
        if (r !== 0) {
          s++;
        }
        this.length = Math.min(s, this.length);
        if (r !== 0) {
          var mask = 67108863 ^ 67108863 >>> r << r;
          this.words[this.length - 1] &= mask;
        }
        return this._strip();
      };
      BN5.prototype.maskn = function maskn(bits) {
        return this.clone().imaskn(bits);
      };
      BN5.prototype.iaddn = function iaddn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.isubn(-num);
        if (this.negative !== 0) {
          if (this.length === 1 && (this.words[0] | 0) <= num) {
            this.words[0] = num - (this.words[0] | 0);
            this.negative = 0;
            return this;
          }
          this.negative = 0;
          this.isubn(num);
          this.negative = 1;
          return this;
        }
        return this._iaddn(num);
      };
      BN5.prototype._iaddn = function _iaddn(num) {
        this.words[0] += num;
        for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
          this.words[i] -= 67108864;
          if (i === this.length - 1) {
            this.words[i + 1] = 1;
          } else {
            this.words[i + 1]++;
          }
        }
        this.length = Math.max(this.length, i + 1);
        return this;
      };
      BN5.prototype.isubn = function isubn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.iaddn(-num);
        if (this.negative !== 0) {
          this.negative = 0;
          this.iaddn(num);
          this.negative = 1;
          return this;
        }
        this.words[0] -= num;
        if (this.length === 1 && this.words[0] < 0) {
          this.words[0] = -this.words[0];
          this.negative = 1;
        } else {
          for (var i = 0; i < this.length && this.words[i] < 0; i++) {
            this.words[i] += 67108864;
            this.words[i + 1] -= 1;
          }
        }
        return this._strip();
      };
      BN5.prototype.addn = function addn(num) {
        return this.clone().iaddn(num);
      };
      BN5.prototype.subn = function subn(num) {
        return this.clone().isubn(num);
      };
      BN5.prototype.iabs = function iabs() {
        this.negative = 0;
        return this;
      };
      BN5.prototype.abs = function abs() {
        return this.clone().iabs();
      };
      BN5.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
        var len = num.length + shift;
        var i;
        this._expand(len);
        var w;
        var carry = 0;
        for (i = 0; i < num.length; i++) {
          w = (this.words[i + shift] | 0) + carry;
          var right = (num.words[i] | 0) * mul;
          w -= right & 67108863;
          carry = (w >> 26) - (right / 67108864 | 0);
          this.words[i + shift] = w & 67108863;
        }
        for (; i < this.length - shift; i++) {
          w = (this.words[i + shift] | 0) + carry;
          carry = w >> 26;
          this.words[i + shift] = w & 67108863;
        }
        if (carry === 0) return this._strip();
        assert(carry === -1);
        carry = 0;
        for (i = 0; i < this.length; i++) {
          w = -(this.words[i] | 0) + carry;
          carry = w >> 26;
          this.words[i] = w & 67108863;
        }
        this.negative = 1;
        return this._strip();
      };
      BN5.prototype._wordDiv = function _wordDiv(num, mode) {
        var shift = this.length - num.length;
        var a = this.clone();
        var b = num;
        var bhi = b.words[b.length - 1] | 0;
        var bhiBits = this._countBits(bhi);
        shift = 26 - bhiBits;
        if (shift !== 0) {
          b = b.ushln(shift);
          a.iushln(shift);
          bhi = b.words[b.length - 1] | 0;
        }
        var m = a.length - b.length;
        var q;
        if (mode !== "mod") {
          q = new BN5(null);
          q.length = m + 1;
          q.words = new Array(q.length);
          for (var i = 0; i < q.length; i++) {
            q.words[i] = 0;
          }
        }
        var diff = a.clone()._ishlnsubmul(b, 1, m);
        if (diff.negative === 0) {
          a = diff;
          if (q) {
            q.words[m] = 1;
          }
        }
        for (var j = m - 1; j >= 0; j--) {
          var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
          qj = Math.min(qj / bhi | 0, 67108863);
          a._ishlnsubmul(b, qj, j);
          while (a.negative !== 0) {
            qj--;
            a.negative = 0;
            a._ishlnsubmul(b, 1, j);
            if (!a.isZero()) {
              a.negative ^= 1;
            }
          }
          if (q) {
            q.words[j] = qj;
          }
        }
        if (q) {
          q._strip();
        }
        a._strip();
        if (mode !== "div" && shift !== 0) {
          a.iushrn(shift);
        }
        return {
          div: q || null,
          mod: a
        };
      };
      BN5.prototype.divmod = function divmod(num, mode, positive) {
        assert(!num.isZero());
        if (this.isZero()) {
          return {
            div: new BN5(0),
            mod: new BN5(0)
          };
        }
        var div, mod, res;
        if (this.negative !== 0 && num.negative === 0) {
          res = this.neg().divmod(num, mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.iadd(num);
            }
          }
          return {
            div,
            mod
          };
        }
        if (this.negative === 0 && num.negative !== 0) {
          res = this.divmod(num.neg(), mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          return {
            div,
            mod: res.mod
          };
        }
        if ((this.negative & num.negative) !== 0) {
          res = this.neg().divmod(num.neg(), mode);
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.isub(num);
            }
          }
          return {
            div: res.div,
            mod
          };
        }
        if (num.length > this.length || this.cmp(num) < 0) {
          return {
            div: new BN5(0),
            mod: this
          };
        }
        if (num.length === 1) {
          if (mode === "div") {
            return {
              div: this.divn(num.words[0]),
              mod: null
            };
          }
          if (mode === "mod") {
            return {
              div: null,
              mod: new BN5(this.modrn(num.words[0]))
            };
          }
          return {
            div: this.divn(num.words[0]),
            mod: new BN5(this.modrn(num.words[0]))
          };
        }
        return this._wordDiv(num, mode);
      };
      BN5.prototype.div = function div(num) {
        return this.divmod(num, "div", false).div;
      };
      BN5.prototype.mod = function mod(num) {
        return this.divmod(num, "mod", false).mod;
      };
      BN5.prototype.umod = function umod(num) {
        return this.divmod(num, "mod", true).mod;
      };
      BN5.prototype.divRound = function divRound(num) {
        var dm = this.divmod(num);
        if (dm.mod.isZero()) return dm.div;
        var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;
        var half = num.ushrn(1);
        var r2 = num.andln(1);
        var cmp = mod.cmp(half);
        if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
        return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
      };
      BN5.prototype.modrn = function modrn(num) {
        var isNegNum = num < 0;
        if (isNegNum) num = -num;
        assert(num <= 67108863);
        var p = (1 << 26) % num;
        var acc = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          acc = (p * acc + (this.words[i] | 0)) % num;
        }
        return isNegNum ? -acc : acc;
      };
      BN5.prototype.modn = function modn(num) {
        return this.modrn(num);
      };
      BN5.prototype.idivn = function idivn(num) {
        var isNegNum = num < 0;
        if (isNegNum) num = -num;
        assert(num <= 67108863);
        var carry = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var w = (this.words[i] | 0) + carry * 67108864;
          this.words[i] = w / num | 0;
          carry = w % num;
        }
        this._strip();
        return isNegNum ? this.ineg() : this;
      };
      BN5.prototype.divn = function divn(num) {
        return this.clone().idivn(num);
      };
      BN5.prototype.egcd = function egcd(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var x = this;
        var y = p.clone();
        if (x.negative !== 0) {
          x = x.umod(p);
        } else {
          x = x.clone();
        }
        var A = new BN5(1);
        var B = new BN5(0);
        var C = new BN5(0);
        var D = new BN5(1);
        var g = 0;
        while (x.isEven() && y.isEven()) {
          x.iushrn(1);
          y.iushrn(1);
          ++g;
        }
        var yp = y.clone();
        var xp = x.clone();
        while (!x.isZero()) {
          for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            x.iushrn(i);
            while (i-- > 0) {
              if (A.isOdd() || B.isOdd()) {
                A.iadd(yp);
                B.isub(xp);
              }
              A.iushrn(1);
              B.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            y.iushrn(j);
            while (j-- > 0) {
              if (C.isOdd() || D.isOdd()) {
                C.iadd(yp);
                D.isub(xp);
              }
              C.iushrn(1);
              D.iushrn(1);
            }
          }
          if (x.cmp(y) >= 0) {
            x.isub(y);
            A.isub(C);
            B.isub(D);
          } else {
            y.isub(x);
            C.isub(A);
            D.isub(B);
          }
        }
        return {
          a: C,
          b: D,
          gcd: y.iushln(g)
        };
      };
      BN5.prototype._invmp = function _invmp(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var a = this;
        var b = p.clone();
        if (a.negative !== 0) {
          a = a.umod(p);
        } else {
          a = a.clone();
        }
        var x1 = new BN5(1);
        var x2 = new BN5(0);
        var delta = b.clone();
        while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
          for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            a.iushrn(i);
            while (i-- > 0) {
              if (x1.isOdd()) {
                x1.iadd(delta);
              }
              x1.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            b.iushrn(j);
            while (j-- > 0) {
              if (x2.isOdd()) {
                x2.iadd(delta);
              }
              x2.iushrn(1);
            }
          }
          if (a.cmp(b) >= 0) {
            a.isub(b);
            x1.isub(x2);
          } else {
            b.isub(a);
            x2.isub(x1);
          }
        }
        var res;
        if (a.cmpn(1) === 0) {
          res = x1;
        } else {
          res = x2;
        }
        if (res.cmpn(0) < 0) {
          res.iadd(p);
        }
        return res;
      };
      BN5.prototype.gcd = function gcd(num) {
        if (this.isZero()) return num.abs();
        if (num.isZero()) return this.abs();
        var a = this.clone();
        var b = num.clone();
        a.negative = 0;
        b.negative = 0;
        for (var shift = 0; a.isEven() && b.isEven(); shift++) {
          a.iushrn(1);
          b.iushrn(1);
        }
        do {
          while (a.isEven()) {
            a.iushrn(1);
          }
          while (b.isEven()) {
            b.iushrn(1);
          }
          var r = a.cmp(b);
          if (r < 0) {
            var t = a;
            a = b;
            b = t;
          } else if (r === 0 || b.cmpn(1) === 0) {
            break;
          }
          a.isub(b);
        } while (true);
        return b.iushln(shift);
      };
      BN5.prototype.invm = function invm(num) {
        return this.egcd(num).a.umod(num);
      };
      BN5.prototype.isEven = function isEven() {
        return (this.words[0] & 1) === 0;
      };
      BN5.prototype.isOdd = function isOdd2() {
        return (this.words[0] & 1) === 1;
      };
      BN5.prototype.andln = function andln(num) {
        return this.words[0] & num;
      };
      BN5.prototype.bincn = function bincn(bit) {
        assert(typeof bit === "number");
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) {
          this._expand(s + 1);
          this.words[s] |= q;
          return this;
        }
        var carry = q;
        for (var i = s; carry !== 0 && i < this.length; i++) {
          var w = this.words[i] | 0;
          w += carry;
          carry = w >>> 26;
          w &= 67108863;
          this.words[i] = w;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN5.prototype.isZero = function isZero() {
        return this.length === 1 && this.words[0] === 0;
      };
      BN5.prototype.cmpn = function cmpn(num) {
        var negative = num < 0;
        if (this.negative !== 0 && !negative) return -1;
        if (this.negative === 0 && negative) return 1;
        this._strip();
        var res;
        if (this.length > 1) {
          res = 1;
        } else {
          if (negative) {
            num = -num;
          }
          assert(num <= 67108863, "Number is too big");
          var w = this.words[0] | 0;
          res = w === num ? 0 : w < num ? -1 : 1;
        }
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN5.prototype.cmp = function cmp(num) {
        if (this.negative !== 0 && num.negative === 0) return -1;
        if (this.negative === 0 && num.negative !== 0) return 1;
        var res = this.ucmp(num);
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN5.prototype.ucmp = function ucmp(num) {
        if (this.length > num.length) return 1;
        if (this.length < num.length) return -1;
        var res = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var a = this.words[i] | 0;
          var b = num.words[i] | 0;
          if (a === b) continue;
          if (a < b) {
            res = -1;
          } else if (a > b) {
            res = 1;
          }
          break;
        }
        return res;
      };
      BN5.prototype.gtn = function gtn(num) {
        return this.cmpn(num) === 1;
      };
      BN5.prototype.gt = function gt(num) {
        return this.cmp(num) === 1;
      };
      BN5.prototype.gten = function gten(num) {
        return this.cmpn(num) >= 0;
      };
      BN5.prototype.gte = function gte(num) {
        return this.cmp(num) >= 0;
      };
      BN5.prototype.ltn = function ltn(num) {
        return this.cmpn(num) === -1;
      };
      BN5.prototype.lt = function lt(num) {
        return this.cmp(num) === -1;
      };
      BN5.prototype.lten = function lten(num) {
        return this.cmpn(num) <= 0;
      };
      BN5.prototype.lte = function lte(num) {
        return this.cmp(num) <= 0;
      };
      BN5.prototype.eqn = function eqn(num) {
        return this.cmpn(num) === 0;
      };
      BN5.prototype.eq = function eq(num) {
        return this.cmp(num) === 0;
      };
      BN5.red = function red(num) {
        return new Red(num);
      };
      BN5.prototype.toRed = function toRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        assert(this.negative === 0, "red works only with positives");
        return ctx.convertTo(this)._forceRed(ctx);
      };
      BN5.prototype.fromRed = function fromRed() {
        assert(this.red, "fromRed works only with numbers in reduction context");
        return this.red.convertFrom(this);
      };
      BN5.prototype._forceRed = function _forceRed(ctx) {
        this.red = ctx;
        return this;
      };
      BN5.prototype.forceRed = function forceRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        return this._forceRed(ctx);
      };
      BN5.prototype.redAdd = function redAdd(num) {
        assert(this.red, "redAdd works only with red numbers");
        return this.red.add(this, num);
      };
      BN5.prototype.redIAdd = function redIAdd(num) {
        assert(this.red, "redIAdd works only with red numbers");
        return this.red.iadd(this, num);
      };
      BN5.prototype.redSub = function redSub(num) {
        assert(this.red, "redSub works only with red numbers");
        return this.red.sub(this, num);
      };
      BN5.prototype.redISub = function redISub(num) {
        assert(this.red, "redISub works only with red numbers");
        return this.red.isub(this, num);
      };
      BN5.prototype.redShl = function redShl(num) {
        assert(this.red, "redShl works only with red numbers");
        return this.red.shl(this, num);
      };
      BN5.prototype.redMul = function redMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.mul(this, num);
      };
      BN5.prototype.redIMul = function redIMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.imul(this, num);
      };
      BN5.prototype.redSqr = function redSqr() {
        assert(this.red, "redSqr works only with red numbers");
        this.red._verify1(this);
        return this.red.sqr(this);
      };
      BN5.prototype.redISqr = function redISqr() {
        assert(this.red, "redISqr works only with red numbers");
        this.red._verify1(this);
        return this.red.isqr(this);
      };
      BN5.prototype.redSqrt = function redSqrt() {
        assert(this.red, "redSqrt works only with red numbers");
        this.red._verify1(this);
        return this.red.sqrt(this);
      };
      BN5.prototype.redInvm = function redInvm() {
        assert(this.red, "redInvm works only with red numbers");
        this.red._verify1(this);
        return this.red.invm(this);
      };
      BN5.prototype.redNeg = function redNeg() {
        assert(this.red, "redNeg works only with red numbers");
        this.red._verify1(this);
        return this.red.neg(this);
      };
      BN5.prototype.redPow = function redPow(num) {
        assert(this.red && !num.red, "redPow(normalNum)");
        this.red._verify1(this);
        return this.red.pow(this, num);
      };
      var primes = {
        k256: null,
        p224: null,
        p192: null,
        p25519: null
      };
      function MPrime(name, p) {
        this.name = name;
        this.p = new BN5(p, 16);
        this.n = this.p.bitLength();
        this.k = new BN5(1).iushln(this.n).isub(this.p);
        this.tmp = this._tmp();
      }
      MPrime.prototype._tmp = function _tmp() {
        var tmp = new BN5(null);
        tmp.words = new Array(Math.ceil(this.n / 13));
        return tmp;
      };
      MPrime.prototype.ireduce = function ireduce(num) {
        var r = num;
        var rlen;
        do {
          this.split(r, this.tmp);
          r = this.imulK(r);
          r = r.iadd(this.tmp);
          rlen = r.bitLength();
        } while (rlen > this.n);
        var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
        if (cmp === 0) {
          r.words[0] = 0;
          r.length = 1;
        } else if (cmp > 0) {
          r.isub(this.p);
        } else {
          if (r.strip !== void 0) {
            r.strip();
          } else {
            r._strip();
          }
        }
        return r;
      };
      MPrime.prototype.split = function split(input, out) {
        input.iushrn(this.n, 0, out);
      };
      MPrime.prototype.imulK = function imulK(num) {
        return num.imul(this.k);
      };
      function K256() {
        MPrime.call(
          this,
          "k256",
          "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f"
        );
      }
      inherits(K256, MPrime);
      K256.prototype.split = function split(input, output) {
        var mask = 4194303;
        var outLen = Math.min(input.length, 9);
        for (var i = 0; i < outLen; i++) {
          output.words[i] = input.words[i];
        }
        output.length = outLen;
        if (input.length <= 9) {
          input.words[0] = 0;
          input.length = 1;
          return;
        }
        var prev = input.words[9];
        output.words[output.length++] = prev & mask;
        for (i = 10; i < input.length; i++) {
          var next = input.words[i] | 0;
          input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
          prev = next;
        }
        prev >>>= 22;
        input.words[i - 10] = prev;
        if (prev === 0 && input.length > 10) {
          input.length -= 10;
        } else {
          input.length -= 9;
        }
      };
      K256.prototype.imulK = function imulK(num) {
        num.words[num.length] = 0;
        num.words[num.length + 1] = 0;
        num.length += 2;
        var lo = 0;
        for (var i = 0; i < num.length; i++) {
          var w = num.words[i] | 0;
          lo += w * 977;
          num.words[i] = lo & 67108863;
          lo = w * 64 + (lo / 67108864 | 0);
        }
        if (num.words[num.length - 1] === 0) {
          num.length--;
          if (num.words[num.length - 1] === 0) {
            num.length--;
          }
        }
        return num;
      };
      function P224() {
        MPrime.call(
          this,
          "p224",
          "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001"
        );
      }
      inherits(P224, MPrime);
      function P192() {
        MPrime.call(
          this,
          "p192",
          "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff"
        );
      }
      inherits(P192, MPrime);
      function P25519() {
        MPrime.call(
          this,
          "25519",
          "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed"
        );
      }
      inherits(P25519, MPrime);
      P25519.prototype.imulK = function imulK(num) {
        var carry = 0;
        for (var i = 0; i < num.length; i++) {
          var hi = (num.words[i] | 0) * 19 + carry;
          var lo = hi & 67108863;
          hi >>>= 26;
          num.words[i] = lo;
          carry = hi;
        }
        if (carry !== 0) {
          num.words[num.length++] = carry;
        }
        return num;
      };
      BN5._prime = function prime(name) {
        if (primes[name]) return primes[name];
        var prime2;
        if (name === "k256") {
          prime2 = new K256();
        } else if (name === "p224") {
          prime2 = new P224();
        } else if (name === "p192") {
          prime2 = new P192();
        } else if (name === "p25519") {
          prime2 = new P25519();
        } else {
          throw new Error("Unknown prime " + name);
        }
        primes[name] = prime2;
        return prime2;
      };
      function Red(m) {
        if (typeof m === "string") {
          var prime = BN5._prime(m);
          this.m = prime.p;
          this.prime = prime;
        } else {
          assert(m.gtn(1), "modulus must be greater than 1");
          this.m = m;
          this.prime = null;
        }
      }
      Red.prototype._verify1 = function _verify1(a) {
        assert(a.negative === 0, "red works only with positives");
        assert(a.red, "red works only with red numbers");
      };
      Red.prototype._verify2 = function _verify2(a, b) {
        assert((a.negative | b.negative) === 0, "red works only with positives");
        assert(
          a.red && a.red === b.red,
          "red works only with red numbers"
        );
      };
      Red.prototype.imod = function imod(a) {
        if (this.prime) return this.prime.ireduce(a)._forceRed(this);
        move(a, a.umod(this.m)._forceRed(this));
        return a;
      };
      Red.prototype.neg = function neg(a) {
        if (a.isZero()) {
          return a.clone();
        }
        return this.m.sub(a)._forceRed(this);
      };
      Red.prototype.add = function add(a, b) {
        this._verify2(a, b);
        var res = a.add(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.iadd = function iadd(a, b) {
        this._verify2(a, b);
        var res = a.iadd(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res;
      };
      Red.prototype.sub = function sub(a, b) {
        this._verify2(a, b);
        var res = a.sub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.isub = function isub(a, b) {
        this._verify2(a, b);
        var res = a.isub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res;
      };
      Red.prototype.shl = function shl(a, num) {
        this._verify1(a);
        return this.imod(a.ushln(num));
      };
      Red.prototype.imul = function imul(a, b) {
        this._verify2(a, b);
        return this.imod(a.imul(b));
      };
      Red.prototype.mul = function mul(a, b) {
        this._verify2(a, b);
        return this.imod(a.mul(b));
      };
      Red.prototype.isqr = function isqr(a) {
        return this.imul(a, a.clone());
      };
      Red.prototype.sqr = function sqr(a) {
        return this.mul(a, a);
      };
      Red.prototype.sqrt = function sqrt(a) {
        if (a.isZero()) return a.clone();
        var mod3 = this.m.andln(3);
        assert(mod3 % 2 === 1);
        if (mod3 === 3) {
          var pow = this.m.add(new BN5(1)).iushrn(2);
          return this.pow(a, pow);
        }
        var q = this.m.subn(1);
        var s = 0;
        while (!q.isZero() && q.andln(1) === 0) {
          s++;
          q.iushrn(1);
        }
        assert(!q.isZero());
        var one = new BN5(1).toRed(this);
        var nOne = one.redNeg();
        var lpow = this.m.subn(1).iushrn(1);
        var z = this.m.bitLength();
        z = new BN5(2 * z * z).toRed(this);
        while (this.pow(z, lpow).cmp(nOne) !== 0) {
          z.redIAdd(nOne);
        }
        var c = this.pow(z, q);
        var r = this.pow(a, q.addn(1).iushrn(1));
        var t = this.pow(a, q);
        var m = s;
        while (t.cmp(one) !== 0) {
          var tmp = t;
          for (var i = 0; tmp.cmp(one) !== 0; i++) {
            tmp = tmp.redSqr();
          }
          assert(i < m);
          var b = this.pow(c, new BN5(1).iushln(m - i - 1));
          r = r.redMul(b);
          c = b.redSqr();
          t = t.redMul(c);
          m = i;
        }
        return r;
      };
      Red.prototype.invm = function invm(a) {
        var inv = a._invmp(this.m);
        if (inv.negative !== 0) {
          inv.negative = 0;
          return this.imod(inv).redNeg();
        } else {
          return this.imod(inv);
        }
      };
      Red.prototype.pow = function pow(a, num) {
        if (num.isZero()) return new BN5(1).toRed(this);
        if (num.cmpn(1) === 0) return a.clone();
        var windowSize = 4;
        var wnd = new Array(1 << windowSize);
        wnd[0] = new BN5(1).toRed(this);
        wnd[1] = a;
        for (var i = 2; i < wnd.length; i++) {
          wnd[i] = this.mul(wnd[i - 1], a);
        }
        var res = wnd[0];
        var current = 0;
        var currentLen = 0;
        var start = num.bitLength() % 26;
        if (start === 0) {
          start = 26;
        }
        for (i = num.length - 1; i >= 0; i--) {
          var word = num.words[i];
          for (var j = start - 1; j >= 0; j--) {
            var bit = word >> j & 1;
            if (res !== wnd[0]) {
              res = this.sqr(res);
            }
            if (bit === 0 && current === 0) {
              currentLen = 0;
              continue;
            }
            current <<= 1;
            current |= bit;
            currentLen++;
            if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
            res = this.mul(res, wnd[current]);
            currentLen = 0;
            current = 0;
          }
          start = 26;
        }
        return res;
      };
      Red.prototype.convertTo = function convertTo(num) {
        var r = num.umod(this.m);
        return r === num ? r.clone() : r;
      };
      Red.prototype.convertFrom = function convertFrom(num) {
        var res = num.clone();
        res.red = null;
        return res;
      };
      BN5.mont = function mont(num) {
        return new Mont(num);
      };
      function Mont(m) {
        Red.call(this, m);
        this.shift = this.m.bitLength();
        if (this.shift % 26 !== 0) {
          this.shift += 26 - this.shift % 26;
        }
        this.r = new BN5(1).iushln(this.shift);
        this.r2 = this.imod(this.r.sqr());
        this.rinv = this.r._invmp(this.m);
        this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
        this.minv = this.minv.umod(this.r);
        this.minv = this.r.sub(this.minv);
      }
      inherits(Mont, Red);
      Mont.prototype.convertTo = function convertTo(num) {
        return this.imod(num.ushln(this.shift));
      };
      Mont.prototype.convertFrom = function convertFrom(num) {
        var r = this.imod(num.mul(this.rinv));
        r.red = null;
        return r;
      };
      Mont.prototype.imul = function imul(a, b) {
        if (a.isZero() || b.isZero()) {
          a.words[0] = 0;
          a.length = 1;
          return a;
        }
        var t = a.imul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.mul = function mul(a, b) {
        if (a.isZero() || b.isZero()) return new BN5(0)._forceRed(this);
        var t = a.mul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.invm = function invm(a) {
        var res = this.imod(a._invmp(this.m).mul(this.r2));
        return res._forceRed(this);
      };
    })(typeof module2 === "undefined" || module2, exports2);
  }
});

// ../node_modules/@solana/buffer-layout/lib/Layout.js
var require_Layout = __commonJS({
  "../node_modules/@solana/buffer-layout/lib/Layout.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.s16 = exports2.s8 = exports2.nu64be = exports2.u48be = exports2.u40be = exports2.u32be = exports2.u24be = exports2.u16be = exports2.nu64 = exports2.u48 = exports2.u40 = exports2.u32 = exports2.u24 = exports2.u16 = exports2.u8 = exports2.offset = exports2.greedy = exports2.Constant = exports2.UTF8 = exports2.CString = exports2.Blob = exports2.Boolean = exports2.BitField = exports2.BitStructure = exports2.VariantLayout = exports2.Union = exports2.UnionLayoutDiscriminator = exports2.UnionDiscriminator = exports2.Structure = exports2.Sequence = exports2.DoubleBE = exports2.Double = exports2.FloatBE = exports2.Float = exports2.NearInt64BE = exports2.NearInt64 = exports2.NearUInt64BE = exports2.NearUInt64 = exports2.IntBE = exports2.Int = exports2.UIntBE = exports2.UInt = exports2.OffsetLayout = exports2.GreedyCount = exports2.ExternalLayout = exports2.bindConstructorLayout = exports2.nameWithProperty = exports2.Layout = exports2.uint8ArrayToBuffer = exports2.checkUint8Array = void 0;
    exports2.constant = exports2.utf8 = exports2.cstr = exports2.blob = exports2.unionLayoutDiscriminator = exports2.union = exports2.seq = exports2.bits = exports2.struct = exports2.f64be = exports2.f64 = exports2.f32be = exports2.f32 = exports2.ns64be = exports2.s48be = exports2.s40be = exports2.s32be = exports2.s24be = exports2.s16be = exports2.ns64 = exports2.s48 = exports2.s40 = exports2.s32 = exports2.s24 = void 0;
    var buffer_1 = require("buffer");
    function checkUint8Array(b) {
      if (!(b instanceof Uint8Array)) {
        throw new TypeError("b must be a Uint8Array");
      }
    }
    exports2.checkUint8Array = checkUint8Array;
    function uint8ArrayToBuffer(b) {
      checkUint8Array(b);
      return buffer_1.Buffer.from(b.buffer, b.byteOffset, b.length);
    }
    exports2.uint8ArrayToBuffer = uint8ArrayToBuffer;
    var Layout = class {
      constructor(span, property) {
        if (!Number.isInteger(span)) {
          throw new TypeError("span must be an integer");
        }
        this.span = span;
        this.property = property;
      }
      /** Function to create an Object into which decoded properties will
       * be written.
       *
       * Used only for layouts that {@link Layout#decode|decode} to Object
       * instances, which means:
       * * {@link Structure}
       * * {@link Union}
       * * {@link VariantLayout}
       * * {@link BitStructure}
       *
       * If left undefined the JavaScript representation of these layouts
       * will be Object instances.
       *
       * See {@link bindConstructorLayout}.
       */
      makeDestinationObject() {
        return {};
      }
      /**
       * Calculate the span of a specific instance of a layout.
       *
       * @param {Uint8Array} b - the buffer that contains an encoded instance.
       *
       * @param {Number} [offset] - the offset at which the encoded instance
       * starts.  If absent a zero offset is inferred.
       *
       * @return {Number} - the number of bytes covered by the layout
       * instance.  If this method is not overridden in a subclass the
       * definition-time constant {@link Layout#span|span} will be
       * returned.
       *
       * @throws {RangeError} - if the length of the value cannot be
       * determined.
       */
      getSpan(b, offset) {
        if (0 > this.span) {
          throw new RangeError("indeterminate span");
        }
        return this.span;
      }
      /**
       * Replicate the layout using a new property.
       *
       * This function must be used to get a structurally-equivalent layout
       * with a different name since all {@link Layout} instances are
       * immutable.
       *
       * **NOTE** This is a shallow copy.  All fields except {@link
       * Layout#property|property} are strictly equal to the origin layout.
       *
       * @param {String} property - the value for {@link
       * Layout#property|property} in the replica.
       *
       * @returns {Layout} - the copy with {@link Layout#property|property}
       * set to `property`.
       */
      replicate(property) {
        const rv = Object.create(this.constructor.prototype);
        Object.assign(rv, this);
        rv.property = property;
        return rv;
      }
      /**
       * Create an object from layout properties and an array of values.
       *
       * **NOTE** This function returns `undefined` if invoked on a layout
       * that does not return its value as an Object.  Objects are
       * returned for things that are a {@link Structure}, which includes
       * {@link VariantLayout|variant layouts} if they are structures, and
       * excludes {@link Union}s.  If you want this feature for a union
       * you must use {@link Union.getVariant|getVariant} to select the
       * desired layout.
       *
       * @param {Array} values - an array of values that correspond to the
       * default order for properties.  As with {@link Layout#decode|decode}
       * layout elements that have no property name are skipped when
       * iterating over the array values.  Only the top-level properties are
       * assigned; arguments are not assigned to properties of contained
       * layouts.  Any unused values are ignored.
       *
       * @return {(Object|undefined)}
       */
      fromArray(values) {
        return void 0;
      }
    };
    exports2.Layout = Layout;
    function nameWithProperty(name, lo) {
      if (lo.property) {
        return name + "[" + lo.property + "]";
      }
      return name;
    }
    exports2.nameWithProperty = nameWithProperty;
    function bindConstructorLayout(Class, layout) {
      if ("function" !== typeof Class) {
        throw new TypeError("Class must be constructor");
      }
      if (Object.prototype.hasOwnProperty.call(Class, "layout_")) {
        throw new Error("Class is already bound to a layout");
      }
      if (!(layout && layout instanceof Layout)) {
        throw new TypeError("layout must be a Layout");
      }
      if (Object.prototype.hasOwnProperty.call(layout, "boundConstructor_")) {
        throw new Error("layout is already bound to a constructor");
      }
      Class.layout_ = layout;
      layout.boundConstructor_ = Class;
      layout.makeDestinationObject = () => new Class();
      Object.defineProperty(Class.prototype, "encode", {
        value(b, offset) {
          return layout.encode(this, b, offset);
        },
        writable: true
      });
      Object.defineProperty(Class, "decode", {
        value(b, offset) {
          return layout.decode(b, offset);
        },
        writable: true
      });
    }
    exports2.bindConstructorLayout = bindConstructorLayout;
    var ExternalLayout = class extends Layout {
      /**
       * Return `true` iff the external layout decodes to an unsigned
       * integer layout.
       *
       * In that case it can be used as the source of {@link
       * Sequence#count|Sequence counts}, {@link Blob#length|Blob lengths},
       * or as {@link UnionLayoutDiscriminator#layout|external union
       * discriminators}.
       *
       * @abstract
       */
      isCount() {
        throw new Error("ExternalLayout is abstract");
      }
    };
    exports2.ExternalLayout = ExternalLayout;
    var GreedyCount = class extends ExternalLayout {
      constructor(elementSpan = 1, property) {
        if (!Number.isInteger(elementSpan) || 0 >= elementSpan) {
          throw new TypeError("elementSpan must be a (positive) integer");
        }
        super(-1, property);
        this.elementSpan = elementSpan;
      }
      /** @override */
      isCount() {
        return true;
      }
      /** @override */
      decode(b, offset = 0) {
        checkUint8Array(b);
        const rem = b.length - offset;
        return Math.floor(rem / this.elementSpan);
      }
      /** @override */
      encode(src, b, offset) {
        return 0;
      }
    };
    exports2.GreedyCount = GreedyCount;
    var OffsetLayout = class extends ExternalLayout {
      constructor(layout, offset = 0, property) {
        if (!(layout instanceof Layout)) {
          throw new TypeError("layout must be a Layout");
        }
        if (!Number.isInteger(offset)) {
          throw new TypeError("offset must be integer or undefined");
        }
        super(layout.span, property || layout.property);
        this.layout = layout;
        this.offset = offset;
      }
      /** @override */
      isCount() {
        return this.layout instanceof UInt || this.layout instanceof UIntBE;
      }
      /** @override */
      decode(b, offset = 0) {
        return this.layout.decode(b, offset + this.offset);
      }
      /** @override */
      encode(src, b, offset = 0) {
        return this.layout.encode(src, b, offset + this.offset);
      }
    };
    exports2.OffsetLayout = OffsetLayout;
    var UInt = class extends Layout {
      constructor(span, property) {
        super(span, property);
        if (6 < this.span) {
          throw new RangeError("span must not exceed 6 bytes");
        }
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readUIntLE(offset, this.span);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeUIntLE(src, offset, this.span);
        return this.span;
      }
    };
    exports2.UInt = UInt;
    var UIntBE = class extends Layout {
      constructor(span, property) {
        super(span, property);
        if (6 < this.span) {
          throw new RangeError("span must not exceed 6 bytes");
        }
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readUIntBE(offset, this.span);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeUIntBE(src, offset, this.span);
        return this.span;
      }
    };
    exports2.UIntBE = UIntBE;
    var Int = class extends Layout {
      constructor(span, property) {
        super(span, property);
        if (6 < this.span) {
          throw new RangeError("span must not exceed 6 bytes");
        }
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readIntLE(offset, this.span);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeIntLE(src, offset, this.span);
        return this.span;
      }
    };
    exports2.Int = Int;
    var IntBE = class extends Layout {
      constructor(span, property) {
        super(span, property);
        if (6 < this.span) {
          throw new RangeError("span must not exceed 6 bytes");
        }
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readIntBE(offset, this.span);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeIntBE(src, offset, this.span);
        return this.span;
      }
    };
    exports2.IntBE = IntBE;
    var V2E32 = Math.pow(2, 32);
    function divmodInt64(src) {
      const hi32 = Math.floor(src / V2E32);
      const lo32 = src - hi32 * V2E32;
      return { hi32, lo32 };
    }
    function roundedInt64(hi32, lo32) {
      return hi32 * V2E32 + lo32;
    }
    var NearUInt64 = class extends Layout {
      constructor(property) {
        super(8, property);
      }
      /** @override */
      decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const lo32 = buffer.readUInt32LE(offset);
        const hi32 = buffer.readUInt32LE(offset + 4);
        return roundedInt64(hi32, lo32);
      }
      /** @override */
      encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeUInt32LE(split.lo32, offset);
        buffer.writeUInt32LE(split.hi32, offset + 4);
        return 8;
      }
    };
    exports2.NearUInt64 = NearUInt64;
    var NearUInt64BE = class extends Layout {
      constructor(property) {
        super(8, property);
      }
      /** @override */
      decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const hi32 = buffer.readUInt32BE(offset);
        const lo32 = buffer.readUInt32BE(offset + 4);
        return roundedInt64(hi32, lo32);
      }
      /** @override */
      encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeUInt32BE(split.hi32, offset);
        buffer.writeUInt32BE(split.lo32, offset + 4);
        return 8;
      }
    };
    exports2.NearUInt64BE = NearUInt64BE;
    var NearInt64 = class extends Layout {
      constructor(property) {
        super(8, property);
      }
      /** @override */
      decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const lo32 = buffer.readUInt32LE(offset);
        const hi32 = buffer.readInt32LE(offset + 4);
        return roundedInt64(hi32, lo32);
      }
      /** @override */
      encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeUInt32LE(split.lo32, offset);
        buffer.writeInt32LE(split.hi32, offset + 4);
        return 8;
      }
    };
    exports2.NearInt64 = NearInt64;
    var NearInt64BE = class extends Layout {
      constructor(property) {
        super(8, property);
      }
      /** @override */
      decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const hi32 = buffer.readInt32BE(offset);
        const lo32 = buffer.readUInt32BE(offset + 4);
        return roundedInt64(hi32, lo32);
      }
      /** @override */
      encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeInt32BE(split.hi32, offset);
        buffer.writeUInt32BE(split.lo32, offset + 4);
        return 8;
      }
    };
    exports2.NearInt64BE = NearInt64BE;
    var Float = class extends Layout {
      constructor(property) {
        super(4, property);
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readFloatLE(offset);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeFloatLE(src, offset);
        return 4;
      }
    };
    exports2.Float = Float;
    var FloatBE = class extends Layout {
      constructor(property) {
        super(4, property);
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readFloatBE(offset);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeFloatBE(src, offset);
        return 4;
      }
    };
    exports2.FloatBE = FloatBE;
    var Double = class extends Layout {
      constructor(property) {
        super(8, property);
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readDoubleLE(offset);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeDoubleLE(src, offset);
        return 8;
      }
    };
    exports2.Double = Double;
    var DoubleBE = class extends Layout {
      constructor(property) {
        super(8, property);
      }
      /** @override */
      decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readDoubleBE(offset);
      }
      /** @override */
      encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeDoubleBE(src, offset);
        return 8;
      }
    };
    exports2.DoubleBE = DoubleBE;
    var Sequence = class extends Layout {
      constructor(elementLayout, count, property) {
        if (!(elementLayout instanceof Layout)) {
          throw new TypeError("elementLayout must be a Layout");
        }
        if (!(count instanceof ExternalLayout && count.isCount() || Number.isInteger(count) && 0 <= count)) {
          throw new TypeError("count must be non-negative integer or an unsigned integer ExternalLayout");
        }
        let span = -1;
        if (!(count instanceof ExternalLayout) && 0 < elementLayout.span) {
          span = count * elementLayout.span;
        }
        super(span, property);
        this.elementLayout = elementLayout;
        this.count = count;
      }
      /** @override */
      getSpan(b, offset = 0) {
        if (0 <= this.span) {
          return this.span;
        }
        let span = 0;
        let count = this.count;
        if (count instanceof ExternalLayout) {
          count = count.decode(b, offset);
        }
        if (0 < this.elementLayout.span) {
          span = count * this.elementLayout.span;
        } else {
          let idx = 0;
          while (idx < count) {
            span += this.elementLayout.getSpan(b, offset + span);
            ++idx;
          }
        }
        return span;
      }
      /** @override */
      decode(b, offset = 0) {
        const rv = [];
        let i = 0;
        let count = this.count;
        if (count instanceof ExternalLayout) {
          count = count.decode(b, offset);
        }
        while (i < count) {
          rv.push(this.elementLayout.decode(b, offset));
          offset += this.elementLayout.getSpan(b, offset);
          i += 1;
        }
        return rv;
      }
      /** Implement {@link Layout#encode|encode} for {@link Sequence}.
       *
       * **NOTE** If `src` is shorter than {@link Sequence#count|count} then
       * the unused space in the buffer is left unchanged.  If `src` is
       * longer than {@link Sequence#count|count} the unneeded elements are
       * ignored.
       *
       * **NOTE** If {@link Layout#count|count} is an instance of {@link
       * ExternalLayout} then the length of `src` will be encoded as the
       * count after `src` is encoded. */
      encode(src, b, offset = 0) {
        const elo = this.elementLayout;
        const span = src.reduce((span2, v) => {
          return span2 + elo.encode(v, b, offset + span2);
        }, 0);
        if (this.count instanceof ExternalLayout) {
          this.count.encode(src.length, b, offset);
        }
        return span;
      }
    };
    exports2.Sequence = Sequence;
    var Structure = class extends Layout {
      constructor(fields, property, decodePrefixes) {
        if (!(Array.isArray(fields) && fields.reduce((acc, v) => acc && v instanceof Layout, true))) {
          throw new TypeError("fields must be array of Layout instances");
        }
        if ("boolean" === typeof property && void 0 === decodePrefixes) {
          decodePrefixes = property;
          property = void 0;
        }
        for (const fd of fields) {
          if (0 > fd.span && void 0 === fd.property) {
            throw new Error("fields cannot contain unnamed variable-length layout");
          }
        }
        let span = -1;
        try {
          span = fields.reduce((span2, fd) => span2 + fd.getSpan(), 0);
        } catch (e) {
        }
        super(span, property);
        this.fields = fields;
        this.decodePrefixes = !!decodePrefixes;
      }
      /** @override */
      getSpan(b, offset = 0) {
        if (0 <= this.span) {
          return this.span;
        }
        let span = 0;
        try {
          span = this.fields.reduce((span2, fd) => {
            const fsp = fd.getSpan(b, offset);
            offset += fsp;
            return span2 + fsp;
          }, 0);
        } catch (e) {
          throw new RangeError("indeterminate span");
        }
        return span;
      }
      /** @override */
      decode(b, offset = 0) {
        checkUint8Array(b);
        const dest = this.makeDestinationObject();
        for (const fd of this.fields) {
          if (void 0 !== fd.property) {
            dest[fd.property] = fd.decode(b, offset);
          }
          offset += fd.getSpan(b, offset);
          if (this.decodePrefixes && b.length === offset) {
            break;
          }
        }
        return dest;
      }
      /** Implement {@link Layout#encode|encode} for {@link Structure}.
       *
       * If `src` is missing a property for a member with a defined {@link
       * Layout#property|property} the corresponding region of the buffer is
       * left unmodified. */
      encode(src, b, offset = 0) {
        const firstOffset = offset;
        let lastOffset = 0;
        let lastWrote = 0;
        for (const fd of this.fields) {
          let span = fd.span;
          lastWrote = 0 < span ? span : 0;
          if (void 0 !== fd.property) {
            const fv = src[fd.property];
            if (void 0 !== fv) {
              lastWrote = fd.encode(fv, b, offset);
              if (0 > span) {
                span = fd.getSpan(b, offset);
              }
            }
          }
          lastOffset = offset;
          offset += span;
        }
        return lastOffset + lastWrote - firstOffset;
      }
      /** @override */
      fromArray(values) {
        const dest = this.makeDestinationObject();
        for (const fd of this.fields) {
          if (void 0 !== fd.property && 0 < values.length) {
            dest[fd.property] = values.shift();
          }
        }
        return dest;
      }
      /**
       * Get access to the layout of a given property.
       *
       * @param {String} property - the structure member of interest.
       *
       * @return {Layout} - the layout associated with `property`, or
       * undefined if there is no such property.
       */
      layoutFor(property) {
        if ("string" !== typeof property) {
          throw new TypeError("property must be string");
        }
        for (const fd of this.fields) {
          if (fd.property === property) {
            return fd;
          }
        }
        return void 0;
      }
      /**
       * Get the offset of a structure member.
       *
       * @param {String} property - the structure member of interest.
       *
       * @return {Number} - the offset in bytes to the start of `property`
       * within the structure, or undefined if `property` is not a field
       * within the structure.  If the property is a member but follows a
       * variable-length structure member a negative number will be
       * returned.
       */
      offsetOf(property) {
        if ("string" !== typeof property) {
          throw new TypeError("property must be string");
        }
        let offset = 0;
        for (const fd of this.fields) {
          if (fd.property === property) {
            return offset;
          }
          if (0 > fd.span) {
            offset = -1;
          } else if (0 <= offset) {
            offset += fd.span;
          }
        }
        return void 0;
      }
    };
    exports2.Structure = Structure;
    var UnionDiscriminator = class {
      constructor(property) {
        this.property = property;
      }
      /** Analog to {@link Layout#decode|Layout decode} for union discriminators.
       *
       * The implementation of this method need not reference the buffer if
       * variant information is available through other means. */
      decode(b, offset) {
        throw new Error("UnionDiscriminator is abstract");
      }
      /** Analog to {@link Layout#decode|Layout encode} for union discriminators.
       *
       * The implementation of this method need not store the value if
       * variant information is maintained through other means. */
      encode(src, b, offset) {
        throw new Error("UnionDiscriminator is abstract");
      }
    };
    exports2.UnionDiscriminator = UnionDiscriminator;
    var UnionLayoutDiscriminator = class extends UnionDiscriminator {
      constructor(layout, property) {
        if (!(layout instanceof ExternalLayout && layout.isCount())) {
          throw new TypeError("layout must be an unsigned integer ExternalLayout");
        }
        super(property || layout.property || "variant");
        this.layout = layout;
      }
      /** Delegate decoding to {@link UnionLayoutDiscriminator#layout|layout}. */
      decode(b, offset) {
        return this.layout.decode(b, offset);
      }
      /** Delegate encoding to {@link UnionLayoutDiscriminator#layout|layout}. */
      encode(src, b, offset) {
        return this.layout.encode(src, b, offset);
      }
    };
    exports2.UnionLayoutDiscriminator = UnionLayoutDiscriminator;
    var Union = class extends Layout {
      constructor(discr, defaultLayout, property) {
        let discriminator;
        if (discr instanceof UInt || discr instanceof UIntBE) {
          discriminator = new UnionLayoutDiscriminator(new OffsetLayout(discr));
        } else if (discr instanceof ExternalLayout && discr.isCount()) {
          discriminator = new UnionLayoutDiscriminator(discr);
        } else if (!(discr instanceof UnionDiscriminator)) {
          throw new TypeError("discr must be a UnionDiscriminator or an unsigned integer layout");
        } else {
          discriminator = discr;
        }
        if (void 0 === defaultLayout) {
          defaultLayout = null;
        }
        if (!(null === defaultLayout || defaultLayout instanceof Layout)) {
          throw new TypeError("defaultLayout must be null or a Layout");
        }
        if (null !== defaultLayout) {
          if (0 > defaultLayout.span) {
            throw new Error("defaultLayout must have constant span");
          }
          if (void 0 === defaultLayout.property) {
            defaultLayout = defaultLayout.replicate("content");
          }
        }
        let span = -1;
        if (defaultLayout) {
          span = defaultLayout.span;
          if (0 <= span && (discr instanceof UInt || discr instanceof UIntBE)) {
            span += discriminator.layout.span;
          }
        }
        super(span, property);
        this.discriminator = discriminator;
        this.usesPrefixDiscriminator = discr instanceof UInt || discr instanceof UIntBE;
        this.defaultLayout = defaultLayout;
        this.registry = {};
        let boundGetSourceVariant = this.defaultGetSourceVariant.bind(this);
        this.getSourceVariant = function(src) {
          return boundGetSourceVariant(src);
        };
        this.configGetSourceVariant = function(gsv) {
          boundGetSourceVariant = gsv.bind(this);
        };
      }
      /** @override */
      getSpan(b, offset = 0) {
        if (0 <= this.span) {
          return this.span;
        }
        const vlo = this.getVariant(b, offset);
        if (!vlo) {
          throw new Error("unable to determine span for unrecognized variant");
        }
        return vlo.getSpan(b, offset);
      }
      /**
       * Method to infer a registered Union variant compatible with `src`.
       *
       * The first satisfied rule in the following sequence defines the
       * return value:
       * * If `src` has properties matching the Union discriminator and
       *   the default layout, `undefined` is returned regardless of the
       *   value of the discriminator property (this ensures the default
       *   layout will be used);
       * * If `src` has a property matching the Union discriminator, the
       *   value of the discriminator identifies a registered variant, and
       *   either (a) the variant has no layout, or (b) `src` has the
       *   variant's property, then the variant is returned (because the
       *   source satisfies the constraints of the variant it identifies);
       * * If `src` does not have a property matching the Union
       *   discriminator, but does have a property matching a registered
       *   variant, then the variant is returned (because the source
       *   matches a variant without an explicit conflict);
       * * An error is thrown (because we either can't identify a variant,
       *   or we were explicitly told the variant but can't satisfy it).
       *
       * @param {Object} src - an object presumed to be compatible with
       * the content of the Union.
       *
       * @return {(undefined|VariantLayout)} - as described above.
       *
       * @throws {Error} - if `src` cannot be associated with a default or
       * registered variant.
       */
      defaultGetSourceVariant(src) {
        if (Object.prototype.hasOwnProperty.call(src, this.discriminator.property)) {
          if (this.defaultLayout && this.defaultLayout.property && Object.prototype.hasOwnProperty.call(src, this.defaultLayout.property)) {
            return void 0;
          }
          const vlo = this.registry[src[this.discriminator.property]];
          if (vlo && (!vlo.layout || vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property))) {
            return vlo;
          }
        } else {
          for (const tag in this.registry) {
            const vlo = this.registry[tag];
            if (vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property)) {
              return vlo;
            }
          }
        }
        throw new Error("unable to infer src variant");
      }
      /** Implement {@link Layout#decode|decode} for {@link Union}.
       *
       * If the variant is {@link Union#addVariant|registered} the return
       * value is an instance of that variant, with no explicit
       * discriminator.  Otherwise the {@link Union#defaultLayout|default
       * layout} is used to decode the content. */
      decode(b, offset = 0) {
        let dest;
        const dlo = this.discriminator;
        const discr = dlo.decode(b, offset);
        const clo = this.registry[discr];
        if (void 0 === clo) {
          const defaultLayout = this.defaultLayout;
          let contentOffset = 0;
          if (this.usesPrefixDiscriminator) {
            contentOffset = dlo.layout.span;
          }
          dest = this.makeDestinationObject();
          dest[dlo.property] = discr;
          dest[defaultLayout.property] = defaultLayout.decode(b, offset + contentOffset);
        } else {
          dest = clo.decode(b, offset);
        }
        return dest;
      }
      /** Implement {@link Layout#encode|encode} for {@link Union}.
       *
       * This API assumes the `src` object is consistent with the union's
       * {@link Union#defaultLayout|default layout}.  To encode variants
       * use the appropriate variant-specific {@link VariantLayout#encode}
       * method. */
      encode(src, b, offset = 0) {
        const vlo = this.getSourceVariant(src);
        if (void 0 === vlo) {
          const dlo = this.discriminator;
          const clo = this.defaultLayout;
          let contentOffset = 0;
          if (this.usesPrefixDiscriminator) {
            contentOffset = dlo.layout.span;
          }
          dlo.encode(src[dlo.property], b, offset);
          return contentOffset + clo.encode(src[clo.property], b, offset + contentOffset);
        }
        return vlo.encode(src, b, offset);
      }
      /** Register a new variant structure within a union.  The newly
       * created variant is returned.
       *
       * @param {Number} variant - initializer for {@link
       * VariantLayout#variant|variant}.
       *
       * @param {Layout} layout - initializer for {@link
       * VariantLayout#layout|layout}.
       *
       * @param {String} property - initializer for {@link
       * Layout#property|property}.
       *
       * @return {VariantLayout} */
      addVariant(variant, layout, property) {
        const rv = new VariantLayout(this, variant, layout, property);
        this.registry[variant] = rv;
        return rv;
      }
      /**
       * Get the layout associated with a registered variant.
       *
       * If `vb` does not produce a registered variant the function returns
       * `undefined`.
       *
       * @param {(Number|Uint8Array)} vb - either the variant number, or a
       * buffer from which the discriminator is to be read.
       *
       * @param {Number} offset - offset into `vb` for the start of the
       * union.  Used only when `vb` is an instance of {Uint8Array}.
       *
       * @return {({VariantLayout}|undefined)}
       */
      getVariant(vb, offset = 0) {
        let variant;
        if (vb instanceof Uint8Array) {
          variant = this.discriminator.decode(vb, offset);
        } else {
          variant = vb;
        }
        return this.registry[variant];
      }
    };
    exports2.Union = Union;
    var VariantLayout = class extends Layout {
      constructor(union, variant, layout, property) {
        if (!(union instanceof Union)) {
          throw new TypeError("union must be a Union");
        }
        if (!Number.isInteger(variant) || 0 > variant) {
          throw new TypeError("variant must be a (non-negative) integer");
        }
        if ("string" === typeof layout && void 0 === property) {
          property = layout;
          layout = null;
        }
        if (layout) {
          if (!(layout instanceof Layout)) {
            throw new TypeError("layout must be a Layout");
          }
          if (null !== union.defaultLayout && 0 <= layout.span && layout.span > union.defaultLayout.span) {
            throw new Error("variant span exceeds span of containing union");
          }
          if ("string" !== typeof property) {
            throw new TypeError("variant must have a String property");
          }
        }
        let span = union.span;
        if (0 > union.span) {
          span = layout ? layout.span : 0;
          if (0 <= span && union.usesPrefixDiscriminator) {
            span += union.discriminator.layout.span;
          }
        }
        super(span, property);
        this.union = union;
        this.variant = variant;
        this.layout = layout || null;
      }
      /** @override */
      getSpan(b, offset = 0) {
        if (0 <= this.span) {
          return this.span;
        }
        let contentOffset = 0;
        if (this.union.usesPrefixDiscriminator) {
          contentOffset = this.union.discriminator.layout.span;
        }
        let span = 0;
        if (this.layout) {
          span = this.layout.getSpan(b, offset + contentOffset);
        }
        return contentOffset + span;
      }
      /** @override */
      decode(b, offset = 0) {
        const dest = this.makeDestinationObject();
        if (this !== this.union.getVariant(b, offset)) {
          throw new Error("variant mismatch");
        }
        let contentOffset = 0;
        if (this.union.usesPrefixDiscriminator) {
          contentOffset = this.union.discriminator.layout.span;
        }
        if (this.layout) {
          dest[this.property] = this.layout.decode(b, offset + contentOffset);
        } else if (this.property) {
          dest[this.property] = true;
        } else if (this.union.usesPrefixDiscriminator) {
          dest[this.union.discriminator.property] = this.variant;
        }
        return dest;
      }
      /** @override */
      encode(src, b, offset = 0) {
        let contentOffset = 0;
        if (this.union.usesPrefixDiscriminator) {
          contentOffset = this.union.discriminator.layout.span;
        }
        if (this.layout && !Object.prototype.hasOwnProperty.call(src, this.property)) {
          throw new TypeError("variant lacks property " + this.property);
        }
        this.union.discriminator.encode(this.variant, b, offset);
        let span = contentOffset;
        if (this.layout) {
          this.layout.encode(src[this.property], b, offset + contentOffset);
          span += this.layout.getSpan(b, offset + contentOffset);
          if (0 <= this.union.span && span > this.union.span) {
            throw new Error("encoded variant overruns containing union");
          }
        }
        return span;
      }
      /** Delegate {@link Layout#fromArray|fromArray} to {@link
       * VariantLayout#layout|layout}. */
      fromArray(values) {
        if (this.layout) {
          return this.layout.fromArray(values);
        }
        return void 0;
      }
    };
    exports2.VariantLayout = VariantLayout;
    function fixBitwiseResult(v) {
      if (0 > v) {
        v += 4294967296;
      }
      return v;
    }
    var BitStructure = class extends Layout {
      constructor(word, msb, property) {
        if (!(word instanceof UInt || word instanceof UIntBE)) {
          throw new TypeError("word must be a UInt or UIntBE layout");
        }
        if ("string" === typeof msb && void 0 === property) {
          property = msb;
          msb = false;
        }
        if (4 < word.span) {
          throw new RangeError("word cannot exceed 32 bits");
        }
        super(word.span, property);
        this.word = word;
        this.msb = !!msb;
        this.fields = [];
        let value = 0;
        this._packedSetValue = function(v) {
          value = fixBitwiseResult(v);
          return this;
        };
        this._packedGetValue = function() {
          return value;
        };
      }
      /** @override */
      decode(b, offset = 0) {
        const dest = this.makeDestinationObject();
        const value = this.word.decode(b, offset);
        this._packedSetValue(value);
        for (const fd of this.fields) {
          if (void 0 !== fd.property) {
            dest[fd.property] = fd.decode(b);
          }
        }
        return dest;
      }
      /** Implement {@link Layout#encode|encode} for {@link BitStructure}.
       *
       * If `src` is missing a property for a member with a defined {@link
       * Layout#property|property} the corresponding region of the packed
       * value is left unmodified.  Unused bits are also left unmodified. */
      encode(src, b, offset = 0) {
        const value = this.word.decode(b, offset);
        this._packedSetValue(value);
        for (const fd of this.fields) {
          if (void 0 !== fd.property) {
            const fv = src[fd.property];
            if (void 0 !== fv) {
              fd.encode(fv);
            }
          }
        }
        return this.word.encode(this._packedGetValue(), b, offset);
      }
      /** Register a new bitfield with a containing bit structure.  The
       * resulting bitfield is returned.
       *
       * @param {Number} bits - initializer for {@link BitField#bits|bits}.
       *
       * @param {string} property - initializer for {@link
       * Layout#property|property}.
       *
       * @return {BitField} */
      addField(bits, property) {
        const bf = new BitField(this, bits, property);
        this.fields.push(bf);
        return bf;
      }
      /** As with {@link BitStructure#addField|addField} for single-bit
       * fields with `boolean` value representation.
       *
       * @param {string} property - initializer for {@link
       * Layout#property|property}.
       *
       * @return {Boolean} */
      // `Boolean` conflicts with the native primitive type
      // eslint-disable-next-line @typescript-eslint/ban-types
      addBoolean(property) {
        const bf = new Boolean2(this, property);
        this.fields.push(bf);
        return bf;
      }
      /**
       * Get access to the bit field for a given property.
       *
       * @param {String} property - the bit field of interest.
       *
       * @return {BitField} - the field associated with `property`, or
       * undefined if there is no such property.
       */
      fieldFor(property) {
        if ("string" !== typeof property) {
          throw new TypeError("property must be string");
        }
        for (const fd of this.fields) {
          if (fd.property === property) {
            return fd;
          }
        }
        return void 0;
      }
    };
    exports2.BitStructure = BitStructure;
    var BitField = class {
      constructor(container, bits, property) {
        if (!(container instanceof BitStructure)) {
          throw new TypeError("container must be a BitStructure");
        }
        if (!Number.isInteger(bits) || 0 >= bits) {
          throw new TypeError("bits must be positive integer");
        }
        const totalBits = 8 * container.span;
        const usedBits = container.fields.reduce((sum, fd) => sum + fd.bits, 0);
        if (bits + usedBits > totalBits) {
          throw new Error("bits too long for span remainder (" + (totalBits - usedBits) + " of " + totalBits + " remain)");
        }
        this.container = container;
        this.bits = bits;
        this.valueMask = (1 << bits) - 1;
        if (32 === bits) {
          this.valueMask = 4294967295;
        }
        this.start = usedBits;
        if (this.container.msb) {
          this.start = totalBits - usedBits - bits;
        }
        this.wordMask = fixBitwiseResult(this.valueMask << this.start);
        this.property = property;
      }
      /** Store a value into the corresponding subsequence of the containing
       * bit field. */
      decode(b, offset) {
        const word = this.container._packedGetValue();
        const wordValue = fixBitwiseResult(word & this.wordMask);
        const value = wordValue >>> this.start;
        return value;
      }
      /** Store a value into the corresponding subsequence of the containing
       * bit field.
       *
       * **NOTE** This is not a specialization of {@link
       * Layout#encode|Layout.encode} and there is no return value. */
      encode(value) {
        if ("number" !== typeof value || !Number.isInteger(value) || value !== fixBitwiseResult(value & this.valueMask)) {
          throw new TypeError(nameWithProperty("BitField.encode", this) + " value must be integer not exceeding " + this.valueMask);
        }
        const word = this.container._packedGetValue();
        const wordValue = fixBitwiseResult(value << this.start);
        this.container._packedSetValue(fixBitwiseResult(word & ~this.wordMask) | wordValue);
      }
    };
    exports2.BitField = BitField;
    var Boolean2 = class extends BitField {
      constructor(container, property) {
        super(container, 1, property);
      }
      /** Override {@link BitField#decode|decode} for {@link Boolean|Boolean}.
       *
       * @returns {boolean} */
      decode(b, offset) {
        return !!super.decode(b, offset);
      }
      /** @override */
      encode(value) {
        if ("boolean" === typeof value) {
          value = +value;
        }
        super.encode(value);
      }
    };
    exports2.Boolean = Boolean2;
    var Blob = class extends Layout {
      constructor(length, property) {
        if (!(length instanceof ExternalLayout && length.isCount() || Number.isInteger(length) && 0 <= length)) {
          throw new TypeError("length must be positive integer or an unsigned integer ExternalLayout");
        }
        let span = -1;
        if (!(length instanceof ExternalLayout)) {
          span = length;
        }
        super(span, property);
        this.length = length;
      }
      /** @override */
      getSpan(b, offset) {
        let span = this.span;
        if (0 > span) {
          span = this.length.decode(b, offset);
        }
        return span;
      }
      /** @override */
      decode(b, offset = 0) {
        let span = this.span;
        if (0 > span) {
          span = this.length.decode(b, offset);
        }
        return uint8ArrayToBuffer(b).slice(offset, offset + span);
      }
      /** Implement {@link Layout#encode|encode} for {@link Blob}.
       *
       * **NOTE** If {@link Layout#count|count} is an instance of {@link
       * ExternalLayout} then the length of `src` will be encoded as the
       * count after `src` is encoded. */
      encode(src, b, offset) {
        let span = this.length;
        if (this.length instanceof ExternalLayout) {
          span = src.length;
        }
        if (!(src instanceof Uint8Array && span === src.length)) {
          throw new TypeError(nameWithProperty("Blob.encode", this) + " requires (length " + span + ") Uint8Array as src");
        }
        if (offset + span > b.length) {
          throw new RangeError("encoding overruns Uint8Array");
        }
        const srcBuffer = uint8ArrayToBuffer(src);
        uint8ArrayToBuffer(b).write(srcBuffer.toString("hex"), offset, span, "hex");
        if (this.length instanceof ExternalLayout) {
          this.length.encode(span, b, offset);
        }
        return span;
      }
    };
    exports2.Blob = Blob;
    var CString = class extends Layout {
      constructor(property) {
        super(-1, property);
      }
      /** @override */
      getSpan(b, offset = 0) {
        checkUint8Array(b);
        let idx = offset;
        while (idx < b.length && 0 !== b[idx]) {
          idx += 1;
        }
        return 1 + idx - offset;
      }
      /** @override */
      decode(b, offset = 0) {
        const span = this.getSpan(b, offset);
        return uint8ArrayToBuffer(b).slice(offset, offset + span - 1).toString("utf-8");
      }
      /** @override */
      encode(src, b, offset = 0) {
        if ("string" !== typeof src) {
          src = String(src);
        }
        const srcb = buffer_1.Buffer.from(src, "utf8");
        const span = srcb.length;
        if (offset + span > b.length) {
          throw new RangeError("encoding overruns Buffer");
        }
        const buffer = uint8ArrayToBuffer(b);
        srcb.copy(buffer, offset);
        buffer[offset + span] = 0;
        return span + 1;
      }
    };
    exports2.CString = CString;
    var UTF8 = class extends Layout {
      constructor(maxSpan, property) {
        if ("string" === typeof maxSpan && void 0 === property) {
          property = maxSpan;
          maxSpan = void 0;
        }
        if (void 0 === maxSpan) {
          maxSpan = -1;
        } else if (!Number.isInteger(maxSpan)) {
          throw new TypeError("maxSpan must be an integer");
        }
        super(-1, property);
        this.maxSpan = maxSpan;
      }
      /** @override */
      getSpan(b, offset = 0) {
        checkUint8Array(b);
        return b.length - offset;
      }
      /** @override */
      decode(b, offset = 0) {
        const span = this.getSpan(b, offset);
        if (0 <= this.maxSpan && this.maxSpan < span) {
          throw new RangeError("text length exceeds maxSpan");
        }
        return uint8ArrayToBuffer(b).slice(offset, offset + span).toString("utf-8");
      }
      /** @override */
      encode(src, b, offset = 0) {
        if ("string" !== typeof src) {
          src = String(src);
        }
        const srcb = buffer_1.Buffer.from(src, "utf8");
        const span = srcb.length;
        if (0 <= this.maxSpan && this.maxSpan < span) {
          throw new RangeError("text length exceeds maxSpan");
        }
        if (offset + span > b.length) {
          throw new RangeError("encoding overruns Buffer");
        }
        srcb.copy(uint8ArrayToBuffer(b), offset);
        return span;
      }
    };
    exports2.UTF8 = UTF8;
    var Constant = class extends Layout {
      constructor(value, property) {
        super(0, property);
        this.value = value;
      }
      /** @override */
      decode(b, offset) {
        return this.value;
      }
      /** @override */
      encode(src, b, offset) {
        return 0;
      }
    };
    exports2.Constant = Constant;
    exports2.greedy = (elementSpan, property) => new GreedyCount(elementSpan, property);
    exports2.offset = (layout, offset, property) => new OffsetLayout(layout, offset, property);
    exports2.u8 = (property) => new UInt(1, property);
    exports2.u16 = (property) => new UInt(2, property);
    exports2.u24 = (property) => new UInt(3, property);
    exports2.u32 = (property) => new UInt(4, property);
    exports2.u40 = (property) => new UInt(5, property);
    exports2.u48 = (property) => new UInt(6, property);
    exports2.nu64 = (property) => new NearUInt64(property);
    exports2.u16be = (property) => new UIntBE(2, property);
    exports2.u24be = (property) => new UIntBE(3, property);
    exports2.u32be = (property) => new UIntBE(4, property);
    exports2.u40be = (property) => new UIntBE(5, property);
    exports2.u48be = (property) => new UIntBE(6, property);
    exports2.nu64be = (property) => new NearUInt64BE(property);
    exports2.s8 = (property) => new Int(1, property);
    exports2.s16 = (property) => new Int(2, property);
    exports2.s24 = (property) => new Int(3, property);
    exports2.s32 = (property) => new Int(4, property);
    exports2.s40 = (property) => new Int(5, property);
    exports2.s48 = (property) => new Int(6, property);
    exports2.ns64 = (property) => new NearInt64(property);
    exports2.s16be = (property) => new IntBE(2, property);
    exports2.s24be = (property) => new IntBE(3, property);
    exports2.s32be = (property) => new IntBE(4, property);
    exports2.s40be = (property) => new IntBE(5, property);
    exports2.s48be = (property) => new IntBE(6, property);
    exports2.ns64be = (property) => new NearInt64BE(property);
    exports2.f32 = (property) => new Float(property);
    exports2.f32be = (property) => new FloatBE(property);
    exports2.f64 = (property) => new Double(property);
    exports2.f64be = (property) => new DoubleBE(property);
    exports2.struct = (fields, property, decodePrefixes) => new Structure(fields, property, decodePrefixes);
    exports2.bits = (word, msb, property) => new BitStructure(word, msb, property);
    exports2.seq = (elementLayout, count, property) => new Sequence(elementLayout, count, property);
    exports2.union = (discr, defaultLayout, property) => new Union(discr, defaultLayout, property);
    exports2.unionLayoutDiscriminator = (layout, property) => new UnionLayoutDiscriminator(layout, property);
    exports2.blob = (length, property) => new Blob(length, property);
    exports2.cstr = (property) => new CString(property);
    exports2.utf8 = (maxSpan, property) => new UTF8(maxSpan, property);
    exports2.constant = (value, property) => new Constant(value, property);
  }
});

// ../node_modules/file-uri-to-path/index.js
var require_file_uri_to_path = __commonJS({
  "../node_modules/file-uri-to-path/index.js"(exports2, module2) {
    "use strict";
    var sep = require("path").sep || "/";
    module2.exports = fileUriToPath;
    function fileUriToPath(uri) {
      if ("string" != typeof uri || uri.length <= 7 || "file://" != uri.substring(0, 7)) {
        throw new TypeError("must pass in a file:// URI to convert to a file path");
      }
      var rest = decodeURI(uri.substring(7));
      var firstSlash = rest.indexOf("/");
      var host = rest.substring(0, firstSlash);
      var path = rest.substring(firstSlash + 1);
      if ("localhost" == host) host = "";
      if (host) {
        host = sep + sep + host;
      }
      path = path.replace(/^(.+)\|/, "$1:");
      if (sep == "\\") {
        path = path.replace(/\//g, "\\");
      }
      if (/^.+\:/.test(path)) {
      } else {
        path = sep + path;
      }
      return host + path;
    }
  }
});

// ../node_modules/bindings/bindings.js
var require_bindings = __commonJS({
  "../node_modules/bindings/bindings.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path = require("path");
    var fileURLToPath = require_file_uri_to_path();
    var join = path.join;
    var dirname = path.dirname;
    var exists = fs2.accessSync && function(path2) {
      try {
        fs2.accessSync(path2);
      } catch (e) {
        return false;
      }
      return true;
    } || fs2.existsSync || path.existsSync;
    var defaults = {
      arrow: process.env.NODE_BINDINGS_ARROW || " \u2192 ",
      compiled: process.env.NODE_BINDINGS_COMPILED_DIR || "compiled",
      platform: process.platform,
      arch: process.arch,
      nodePreGyp: "node-v" + process.versions.modules + "-" + process.platform + "-" + process.arch,
      version: process.versions.node,
      bindings: "bindings.node",
      try: [
        // node-gyp's linked version in the "build" dir
        ["module_root", "build", "bindings"],
        // node-waf and gyp_addon (a.k.a node-gyp)
        ["module_root", "build", "Debug", "bindings"],
        ["module_root", "build", "Release", "bindings"],
        // Debug files, for development (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Debug", "bindings"],
        ["module_root", "Debug", "bindings"],
        // Release files, but manually compiled (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Release", "bindings"],
        ["module_root", "Release", "bindings"],
        // Legacy from node-waf, node <= 0.4.x
        ["module_root", "build", "default", "bindings"],
        // Production "Release" buildtype binary (meh...)
        ["module_root", "compiled", "version", "platform", "arch", "bindings"],
        // node-qbs builds
        ["module_root", "addon-build", "release", "install-root", "bindings"],
        ["module_root", "addon-build", "debug", "install-root", "bindings"],
        ["module_root", "addon-build", "default", "install-root", "bindings"],
        // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
        ["module_root", "lib", "binding", "nodePreGyp", "bindings"]
      ]
    };
    function bindings(opts) {
      if (typeof opts == "string") {
        opts = { bindings: opts };
      } else if (!opts) {
        opts = {};
      }
      Object.keys(defaults).map(function(i2) {
        if (!(i2 in opts)) opts[i2] = defaults[i2];
      });
      if (!opts.module_root) {
        opts.module_root = exports2.getRoot(exports2.getFileName());
      }
      if (path.extname(opts.bindings) != ".node") {
        opts.bindings += ".node";
      }
      var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
      var tries = [], i = 0, l = opts.try.length, n, b, err;
      for (; i < l; i++) {
        n = join.apply(
          null,
          opts.try[i].map(function(p) {
            return opts[p] || p;
          })
        );
        tries.push(n);
        try {
          b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
          if (!opts.path) {
            b.path = n;
          }
          return b;
        } catch (e) {
          if (e.code !== "MODULE_NOT_FOUND" && e.code !== "QUALIFIED_PATH_RESOLUTION_FAILED" && !/not find/i.test(e.message)) {
            throw e;
          }
        }
      }
      err = new Error(
        "Could not locate the bindings file. Tried:\n" + tries.map(function(a) {
          return opts.arrow + a;
        }).join("\n")
      );
      err.tries = tries;
      throw err;
    }
    module2.exports = exports2 = bindings;
    exports2.getFileName = function getFileName(calling_file) {
      var origPST = Error.prepareStackTrace, origSTL = Error.stackTraceLimit, dummy = {}, fileName;
      Error.stackTraceLimit = 10;
      Error.prepareStackTrace = function(e, st) {
        for (var i = 0, l = st.length; i < l; i++) {
          fileName = st[i].getFileName();
          if (fileName !== __filename) {
            if (calling_file) {
              if (fileName !== calling_file) {
                return;
              }
            } else {
              return;
            }
          }
        }
      };
      Error.captureStackTrace(dummy);
      dummy.stack;
      Error.prepareStackTrace = origPST;
      Error.stackTraceLimit = origSTL;
      var fileSchema = "file://";
      if (fileName.indexOf(fileSchema) === 0) {
        fileName = fileURLToPath(fileName);
      }
      return fileName;
    };
    exports2.getRoot = function getRoot(file) {
      var dir = dirname(file), prev;
      while (true) {
        if (dir === ".") {
          dir = process.cwd();
        }
        if (exists(join(dir, "package.json")) || exists(join(dir, "node_modules"))) {
          return dir;
        }
        if (prev === dir) {
          throw new Error(
            'Could not find module root given file: "' + file + '". Do you have a `package.json` file? '
          );
        }
        prev = dir;
        dir = join(dir, "..");
      }
    };
  }
});

// ../node_modules/bigint-buffer/dist/node.js
var require_node = __commonJS({
  "../node_modules/bigint-buffer/dist/node.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var converter;
    {
      try {
        converter = require_bindings()("bigint_buffer");
      } catch (e) {
        console.warn("bigint: Failed to load bindings, pure JS will be used (try npm run rebuild?)");
      }
    }
    function toBigIntLE2(buf) {
      if (converter === void 0) {
        const reversed = Buffer.from(buf);
        reversed.reverse();
        const hex = reversed.toString("hex");
        if (hex.length === 0) {
          return BigInt(0);
        }
        return BigInt(`0x${hex}`);
      }
      return converter.toBigInt(buf, false);
    }
    exports2.toBigIntLE = toBigIntLE2;
    function toBigIntBE2(buf) {
      if (converter === void 0) {
        const hex = buf.toString("hex");
        if (hex.length === 0) {
          return BigInt(0);
        }
        return BigInt(`0x${hex}`);
      }
      return converter.toBigInt(buf, true);
    }
    exports2.toBigIntBE = toBigIntBE2;
    function toBufferLE2(num, width) {
      if (converter === void 0) {
        const hex = num.toString(16);
        const buffer = Buffer.from(hex.padStart(width * 2, "0").slice(0, width * 2), "hex");
        buffer.reverse();
        return buffer;
      }
      return converter.fromBigInt(num, Buffer.allocUnsafe(width), false);
    }
    exports2.toBufferLE = toBufferLE2;
    function toBufferBE2(num, width) {
      if (converter === void 0) {
        const hex = num.toString(16);
        return Buffer.from(hex.padStart(width * 2, "0").slice(0, width * 2), "hex");
      }
      return converter.fromBigInt(num, Buffer.allocUnsafe(width), true);
    }
    exports2.toBufferBE = toBufferBE2;
  }
});

// ../node_modules/@metaplex-foundation/umi-options/dist/cjs/common.cjs
var require_common = __commonJS({
  "../node_modules/@metaplex-foundation/umi-options/dist/cjs/common.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var some = (value) => ({
      __option: "Some",
      value
    });
    var none = () => ({
      __option: "None"
    });
    var isOption = (input) => input && typeof input === "object" && "__option" in input && (input.__option === "Some" && "value" in input || input.__option === "None");
    var isSome = (option) => option.__option === "Some";
    var isNone = (option) => option.__option === "None";
    exports2.isNone = isNone;
    exports2.isOption = isOption;
    exports2.isSome = isSome;
    exports2.none = none;
    exports2.some = some;
  }
});

// ../node_modules/@metaplex-foundation/umi-options/dist/cjs/unwrapOption.cjs
var require_unwrapOption = __commonJS({
  "../node_modules/@metaplex-foundation/umi-options/dist/cjs/unwrapOption.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var common = require_common();
    function unwrapOption(option, fallback) {
      if (common.isSome(option)) return option.value;
      return fallback ? fallback() : null;
    }
    var wrapNullable = (nullable) => nullable !== null ? common.some(nullable) : common.none();
    var wrapNullish = (nullish) => nullish !== null && nullish !== void 0 ? common.some(nullish) : common.none();
    var unwrapSome = (option) => common.isSome(option) ? option.value : null;
    var unwrapSomeOrElse = (option, fallback) => common.isSome(option) ? option.value : fallback();
    exports2.unwrapOption = unwrapOption;
    exports2.unwrapSome = unwrapSome;
    exports2.unwrapSomeOrElse = unwrapSomeOrElse;
    exports2.wrapNullable = wrapNullable;
    exports2.wrapNullish = wrapNullish;
  }
});

// ../node_modules/@metaplex-foundation/umi-options/dist/cjs/unwrapOptionRecursively.cjs
var require_unwrapOptionRecursively = __commonJS({
  "../node_modules/@metaplex-foundation/umi-options/dist/cjs/unwrapOptionRecursively.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var common = require_common();
    function unwrapOptionRecursively(input, fallback) {
      if (!input || ArrayBuffer.isView(input)) {
        return input;
      }
      const next = (x) => fallback ? unwrapOptionRecursively(x, fallback) : unwrapOptionRecursively(x);
      if (common.isOption(input)) {
        if (common.isSome(input)) return next(input.value);
        return fallback ? fallback() : null;
      }
      if (Array.isArray(input)) {
        return input.map(next);
      }
      if (typeof input === "object") {
        return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, next(v)]));
      }
      return input;
    }
    exports2.unwrapOptionRecursively = unwrapOptionRecursively;
  }
});

// ../node_modules/@metaplex-foundation/umi-options/dist/cjs/index.cjs
var require_cjs = __commonJS({
  "../node_modules/@metaplex-foundation/umi-options/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var common = require_common();
    var unwrapOption = require_unwrapOption();
    var unwrapOptionRecursively = require_unwrapOptionRecursively();
    exports2.isNone = common.isNone;
    exports2.isOption = common.isOption;
    exports2.isSome = common.isSome;
    exports2.none = common.none;
    exports2.some = common.some;
    exports2.unwrapOption = unwrapOption.unwrapOption;
    exports2.unwrapSome = unwrapOption.unwrapSome;
    exports2.unwrapSomeOrElse = unwrapOption.unwrapSomeOrElse;
    exports2.wrapNullable = unwrapOption.wrapNullable;
    exports2.wrapNullish = unwrapOption.wrapNullish;
    exports2.unwrapOptionRecursively = unwrapOptionRecursively.unwrapOptionRecursively;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/errors.cjs
var require_errors = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/errors.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InvalidBaseStringError = class extends Error {
      constructor(value, base, cause) {
        const message = `Expected a string of base ${base}, got [${value}].`;
        super(message);
        __publicField(this, "name", "InvalidBaseStringError");
        this.cause = cause;
      }
    };
    exports2.InvalidBaseStringError = InvalidBaseStringError;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/baseX.cjs
var require_baseX = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/baseX.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var errors = require_errors();
    var baseX = (alphabet) => {
      const base = alphabet.length;
      const baseBigInt = BigInt(base);
      return {
        description: `base${base}`,
        fixedSize: null,
        maxSize: null,
        serialize(value) {
          if (!value.match(new RegExp(`^[${alphabet}]*$`))) {
            throw new errors.InvalidBaseStringError(value, base);
          }
          if (value === "") return new Uint8Array();
          const chars = [...value];
          let trailIndex = chars.findIndex((c) => c !== alphabet[0]);
          trailIndex = trailIndex === -1 ? chars.length : trailIndex;
          const leadingZeroes = Array(trailIndex).fill(0);
          if (trailIndex === chars.length) return Uint8Array.from(leadingZeroes);
          const tailChars = chars.slice(trailIndex);
          let base10Number = 0n;
          let baseXPower = 1n;
          for (let i = tailChars.length - 1; i >= 0; i -= 1) {
            base10Number += baseXPower * BigInt(alphabet.indexOf(tailChars[i]));
            baseXPower *= baseBigInt;
          }
          const tailBytes = [];
          while (base10Number > 0n) {
            tailBytes.unshift(Number(base10Number % 256n));
            base10Number /= 256n;
          }
          return Uint8Array.from(leadingZeroes.concat(tailBytes));
        },
        deserialize(buffer, offset = 0) {
          if (buffer.length === 0) return ["", 0];
          const bytes = buffer.slice(offset);
          let trailIndex = bytes.findIndex((n) => n !== 0);
          trailIndex = trailIndex === -1 ? bytes.length : trailIndex;
          const leadingZeroes = alphabet[0].repeat(trailIndex);
          if (trailIndex === bytes.length) return [leadingZeroes, buffer.length];
          let base10Number = bytes.slice(trailIndex).reduce((sum, byte) => sum * 256n + BigInt(byte), 0n);
          const tailChars = [];
          while (base10Number > 0n) {
            tailChars.unshift(alphabet[Number(base10Number % baseBigInt)]);
            base10Number /= baseBigInt;
          }
          return [leadingZeroes + tailChars.join(""), buffer.length];
        }
      };
    };
    exports2.baseX = baseX;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base10.cjs
var require_base10 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base10.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var baseX = require_baseX();
    var base10 = baseX.baseX("0123456789");
    exports2.base10 = base10;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base16.cjs
var require_base16 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base16.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var errors = require_errors();
    var base16 = {
      description: "base16",
      fixedSize: null,
      maxSize: null,
      serialize(value) {
        const lowercaseValue = value.toLowerCase();
        if (!lowercaseValue.match(/^[0123456789abcdef]*$/)) {
          throw new errors.InvalidBaseStringError(value, 16);
        }
        const matches = lowercaseValue.match(/.{1,2}/g);
        return Uint8Array.from(matches ? matches.map((byte) => parseInt(byte, 16)) : []);
      },
      deserialize(buffer, offset = 0) {
        const value = buffer.slice(offset).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
        return [value, buffer.length];
      }
    };
    exports2.base16 = base16;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base58.cjs
var require_base58 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base58.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var baseX = require_baseX();
    var base58 = baseX.baseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
    exports2.base58 = base58;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/bytes.cjs
var require_bytes = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/bytes.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var mergeBytes = (bytesArr) => {
      const totalLength = bytesArr.reduce((total, arr) => total + arr.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      bytesArr.forEach((arr) => {
        result.set(arr, offset);
        offset += arr.length;
      });
      return result;
    };
    var padBytes = (bytes, length) => {
      if (bytes.length >= length) return bytes;
      const paddedBytes = new Uint8Array(length).fill(0);
      paddedBytes.set(bytes);
      return paddedBytes;
    };
    var fixBytes = (bytes, length) => padBytes(bytes.slice(0, length), length);
    exports2.fixBytes = fixBytes;
    exports2.mergeBytes = mergeBytes;
    exports2.padBytes = padBytes;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/errors.cjs
var require_errors2 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/errors.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var DeserializingEmptyBufferError = class extends Error {
      constructor(serializer) {
        super(`Serializer [${serializer}] cannot deserialize empty buffers.`);
        __publicField(this, "name", "DeserializingEmptyBufferError");
      }
    };
    var NotEnoughBytesError = class extends Error {
      constructor(serializer, expected, actual) {
        super(`Serializer [${serializer}] expected ${expected} bytes, got ${actual}.`);
        __publicField(this, "name", "NotEnoughBytesError");
      }
    };
    var ExpectedFixedSizeSerializerError = class extends Error {
      constructor(message) {
        message ?? (message = "Expected a fixed-size serializer, got a variable-size one.");
        super(message);
        __publicField(this, "name", "ExpectedFixedSizeSerializerError");
      }
    };
    exports2.DeserializingEmptyBufferError = DeserializingEmptyBufferError;
    exports2.ExpectedFixedSizeSerializerError = ExpectedFixedSizeSerializerError;
    exports2.NotEnoughBytesError = NotEnoughBytesError;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/fixSerializer.cjs
var require_fixSerializer = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/fixSerializer.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var bytes = require_bytes();
    var errors = require_errors2();
    function fixSerializer(serializer, fixedBytes, description) {
      return {
        description: description ?? `fixed(${fixedBytes}, ${serializer.description})`,
        fixedSize: fixedBytes,
        maxSize: fixedBytes,
        serialize: (value) => bytes.fixBytes(serializer.serialize(value), fixedBytes),
        deserialize: (buffer, offset = 0) => {
          buffer = buffer.slice(offset, offset + fixedBytes);
          if (buffer.length < fixedBytes) {
            throw new errors.NotEnoughBytesError("fixSerializer", fixedBytes, buffer.length);
          }
          if (serializer.fixedSize !== null) {
            buffer = bytes.fixBytes(buffer, serializer.fixedSize);
          }
          const [value] = serializer.deserialize(buffer, 0);
          return [value, offset + fixedBytes];
        }
      };
    }
    exports2.fixSerializer = fixSerializer;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/mapSerializer.cjs
var require_mapSerializer = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/mapSerializer.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function mapSerializer(serializer, unmap, map) {
      return {
        description: serializer.description,
        fixedSize: serializer.fixedSize,
        maxSize: serializer.maxSize,
        serialize: (value) => serializer.serialize(unmap(value)),
        deserialize: (buffer, offset = 0) => {
          const [value, length] = serializer.deserialize(buffer, offset);
          return map ? [map(value, buffer, offset), length] : [value, length];
        }
      };
    }
    exports2.mapSerializer = mapSerializer;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/reverseSerializer.cjs
var require_reverseSerializer = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/reverseSerializer.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var bytes = require_bytes();
    var errors = require_errors2();
    function reverseSerializer(serializer) {
      if (serializer.fixedSize === null) {
        throw new errors.ExpectedFixedSizeSerializerError("Cannot reverse a serializer of variable size.");
      }
      return {
        ...serializer,
        serialize: (value) => serializer.serialize(value).reverse(),
        deserialize: (bytes$1, offset = 0) => {
          const fixedSize = serializer.fixedSize;
          const newBytes = bytes.mergeBytes([bytes$1.slice(0, offset), bytes$1.slice(offset, offset + fixedSize).reverse(), bytes$1.slice(offset + fixedSize)]);
          return serializer.deserialize(newBytes, offset);
        }
      };
    }
    exports2.reverseSerializer = reverseSerializer;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/index.cjs
var require_cjs2 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-core/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var bytes = require_bytes();
    var errors = require_errors2();
    var fixSerializer = require_fixSerializer();
    var mapSerializer = require_mapSerializer();
    var reverseSerializer = require_reverseSerializer();
    exports2.fixBytes = bytes.fixBytes;
    exports2.mergeBytes = bytes.mergeBytes;
    exports2.padBytes = bytes.padBytes;
    exports2.DeserializingEmptyBufferError = errors.DeserializingEmptyBufferError;
    exports2.ExpectedFixedSizeSerializerError = errors.ExpectedFixedSizeSerializerError;
    exports2.NotEnoughBytesError = errors.NotEnoughBytesError;
    exports2.fixSerializer = fixSerializer.fixSerializer;
    exports2.mapSerializer = mapSerializer.mapSerializer;
    exports2.reverseSerializer = reverseSerializer.reverseSerializer;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/baseXReslice.cjs
var require_baseXReslice = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/baseXReslice.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var errors = require_errors();
    var baseXReslice = (alphabet, bits) => {
      const base = alphabet.length;
      const reslice = (input, inputBits, outputBits, useRemainder) => {
        const output = [];
        let accumulator = 0;
        let bitsInAccumulator = 0;
        const mask = (1 << outputBits) - 1;
        for (const value of input) {
          accumulator = accumulator << inputBits | value;
          bitsInAccumulator += inputBits;
          while (bitsInAccumulator >= outputBits) {
            bitsInAccumulator -= outputBits;
            output.push(accumulator >> bitsInAccumulator & mask);
          }
        }
        if (useRemainder && bitsInAccumulator > 0) {
          output.push(accumulator << outputBits - bitsInAccumulator & mask);
        }
        return output;
      };
      return {
        description: `base${base}`,
        fixedSize: null,
        maxSize: null,
        serialize(value) {
          if (!value.match(new RegExp(`^[${alphabet}]*$`))) {
            throw new errors.InvalidBaseStringError(value, base);
          }
          if (value === "") return new Uint8Array();
          const charIndices = [...value].map((c) => alphabet.indexOf(c));
          const bytes = reslice(charIndices, bits, 8, false);
          return Uint8Array.from(bytes);
        },
        deserialize(buffer, offset = 0) {
          if (buffer.length === 0) return ["", 0];
          const bytes = [...buffer.slice(offset)];
          const charIndices = reslice(bytes, 8, bits, true);
          return [charIndices.map((i) => alphabet[i]).join(""), buffer.length];
        }
      };
    };
    exports2.baseXReslice = baseXReslice;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base64.cjs
var require_base64 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/base64.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var baseXReslice = require_baseXReslice();
    var base64 = umiSerializersCore.mapSerializer(baseXReslice.baseXReslice("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", 6), (value) => value.replace(/=/g, ""), (value) => value.padEnd(Math.ceil(value.length / 4) * 4, "="));
    exports2.base64 = base64;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/nullCharacters.cjs
var require_nullCharacters = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/nullCharacters.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var removeNullCharacters = (value) => (
      // eslint-disable-next-line no-control-regex
      value.replace(/\u0000/g, "")
    );
    var padNullCharacters = (value, chars) => value.padEnd(chars, "\0");
    exports2.padNullCharacters = padNullCharacters;
    exports2.removeNullCharacters = removeNullCharacters;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/utf8.cjs
var require_utf8 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/utf8.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var nullCharacters = require_nullCharacters();
    var utf8 = {
      description: "utf8",
      fixedSize: null,
      maxSize: null,
      serialize(value) {
        return new TextEncoder().encode(value);
      },
      deserialize(buffer, offset = 0) {
        const value = new TextDecoder().decode(buffer.slice(offset));
        return [nullCharacters.removeNullCharacters(value), buffer.length];
      }
    };
    exports2.utf8 = utf8;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/index.cjs
var require_cjs3 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-encodings/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var base10 = require_base10();
    var base16 = require_base16();
    var base58 = require_base58();
    var base64 = require_base64();
    var baseX = require_baseX();
    var baseXReslice = require_baseXReslice();
    var errors = require_errors();
    var nullCharacters = require_nullCharacters();
    var utf8 = require_utf8();
    exports2.base10 = base10.base10;
    exports2.base16 = base16.base16;
    exports2.base58 = base58.base58;
    exports2.base64 = base64.base64;
    exports2.baseX = baseX.baseX;
    exports2.baseXReslice = baseXReslice.baseXReslice;
    exports2.InvalidBaseStringError = errors.InvalidBaseStringError;
    exports2.padNullCharacters = nullCharacters.padNullCharacters;
    exports2.removeNullCharacters = nullCharacters.removeNullCharacters;
    exports2.utf8 = utf8.utf8;
  }
});

// ../node_modules/@metaplex-foundation/umi-public-keys/dist/cjs/errors.cjs
var require_errors3 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-public-keys/dist/cjs/errors.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InvalidPublicKeyError = class extends Error {
      constructor(invalidPublicKey, reason) {
        reason = reason ? `. ${reason}` : "";
        super(`The provided public key is invalid: ${invalidPublicKey}${reason}`);
        __publicField(this, "name", "InvalidPublicKeyError");
        this.invalidPublicKey = invalidPublicKey;
      }
    };
    exports2.InvalidPublicKeyError = InvalidPublicKeyError;
  }
});

// ../node_modules/@metaplex-foundation/umi-public-keys/dist/cjs/common.cjs
var require_common2 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-public-keys/dist/cjs/common.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersEncodings = require_cjs3();
    var errors = require_errors3();
    var PUBLIC_KEY_LENGTH = 32;
    function publicKey2(input, assertValidPublicKey = true) {
      const key = (() => {
        if (typeof input === "string") {
          return input;
        }
        if (typeof input === "object" && "publicKey" in input) {
          return input.publicKey;
        }
        if (typeof input === "object" && "toBase58" in input) {
          return input.toBase58();
        }
        if (Array.isArray(input)) {
          return input[0];
        }
        return umiSerializersEncodings.base58.deserialize(input)[0];
      })();
      if (assertValidPublicKey) {
        assertPublicKey(key);
      }
      return key;
    }
    var defaultPublicKey = () => "11111111111111111111111111111111";
    var isPublicKey = (value) => {
      try {
        assertPublicKey(value);
        return true;
      } catch (error) {
        return false;
      }
    };
    var isPda = (value) => Array.isArray(value) && value.length === 2 && typeof value[1] === "number" && isPublicKey(value[0]);
    function assertPublicKey(value) {
      if (typeof value !== "string") {
        throw new errors.InvalidPublicKeyError(value, "Public keys must be strings.");
      }
      publicKeyBytes(value);
    }
    var uniquePublicKeys = (publicKeys) => [...new Set(publicKeys)];
    var publicKeyBytes = (value) => {
      if (value.length < 32 || value.length > 44) {
        throw new errors.InvalidPublicKeyError(value, "Public keys must be between 32 and 44 characters.");
      }
      let bytes;
      try {
        bytes = umiSerializersEncodings.base58.serialize(value);
      } catch (error) {
        throw new errors.InvalidPublicKeyError(value, "Public keys must be base58 encoded.");
      }
      if (bytes.length !== PUBLIC_KEY_LENGTH) {
        throw new errors.InvalidPublicKeyError(value, `Public keys must be ${PUBLIC_KEY_LENGTH} bytes.`);
      }
      return bytes;
    };
    var base58PublicKey = (key) => publicKey2(key);
    var samePublicKey = (left, right) => publicKey2(left) === publicKey2(right);
    exports2.PUBLIC_KEY_LENGTH = PUBLIC_KEY_LENGTH;
    exports2.assertPublicKey = assertPublicKey;
    exports2.base58PublicKey = base58PublicKey;
    exports2.defaultPublicKey = defaultPublicKey;
    exports2.isPda = isPda;
    exports2.isPublicKey = isPublicKey;
    exports2.publicKey = publicKey2;
    exports2.publicKeyBytes = publicKeyBytes;
    exports2.samePublicKey = samePublicKey;
    exports2.uniquePublicKeys = uniquePublicKeys;
  }
});

// ../node_modules/@metaplex-foundation/umi-public-keys/dist/cjs/index.cjs
var require_cjs4 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-public-keys/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var common = require_common2();
    var errors = require_errors3();
    exports2.PUBLIC_KEY_LENGTH = common.PUBLIC_KEY_LENGTH;
    exports2.assertPublicKey = common.assertPublicKey;
    exports2.base58PublicKey = common.base58PublicKey;
    exports2.defaultPublicKey = common.defaultPublicKey;
    exports2.isPda = common.isPda;
    exports2.isPublicKey = common.isPublicKey;
    exports2.publicKey = common.publicKey;
    exports2.publicKeyBytes = common.publicKeyBytes;
    exports2.samePublicKey = common.samePublicKey;
    exports2.uniquePublicKeys = common.uniquePublicKeys;
    exports2.InvalidPublicKeyError = errors.InvalidPublicKeyError;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/common.cjs
var require_common3 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/common.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Endian = void 0;
    (function(Endian) {
      Endian["Little"] = "le";
      Endian["Big"] = "be";
    })(exports2.Endian || (exports2.Endian = {}));
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/errors.cjs
var require_errors4 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/errors.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var NumberOutOfRangeError = class extends RangeError {
      constructor(serializer, min, max, actual) {
        super(`Serializer [${serializer}] expected number to be between ${min} and ${max}, got ${actual}.`);
        __publicField(this, "name", "NumberOutOfRangeError");
      }
    };
    exports2.NumberOutOfRangeError = NumberOutOfRangeError;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/utils.cjs
var require_utils = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/utils.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var common = require_common3();
    var errors = require_errors4();
    function numberFactory(input) {
      let littleEndian;
      let defaultDescription = input.name;
      if (input.size > 1) {
        littleEndian = !("endian" in input.options) || input.options.endian === common.Endian.Little;
        defaultDescription += littleEndian ? "(le)" : "(be)";
      }
      return {
        description: input.options.description ?? defaultDescription,
        fixedSize: input.size,
        maxSize: input.size,
        serialize(value) {
          if (input.range) {
            assertRange(input.name, input.range[0], input.range[1], value);
          }
          const buffer = new ArrayBuffer(input.size);
          input.set(new DataView(buffer), value, littleEndian);
          return new Uint8Array(buffer);
        },
        deserialize(bytes, offset = 0) {
          const slice = bytes.slice(offset, offset + input.size);
          assertEnoughBytes("i8", slice, input.size);
          const view = toDataView(slice);
          return [input.get(view, littleEndian), offset + input.size];
        }
      };
    }
    var toArrayBuffer = (array) => array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
    var toDataView = (array) => new DataView(toArrayBuffer(array));
    var assertRange = (serializer, min, max, value) => {
      if (value < min || value > max) {
        throw new errors.NumberOutOfRangeError(serializer, min, max, value);
      }
    };
    var assertEnoughBytes = (serializer, bytes, expected) => {
      if (bytes.length === 0) {
        throw new umiSerializersCore.DeserializingEmptyBufferError(serializer);
      }
      if (bytes.length < expected) {
        throw new umiSerializersCore.NotEnoughBytesError(serializer, expected, bytes.length);
      }
    };
    exports2.assertEnoughBytes = assertEnoughBytes;
    exports2.assertRange = assertRange;
    exports2.numberFactory = numberFactory;
    exports2.toArrayBuffer = toArrayBuffer;
    exports2.toDataView = toDataView;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/f32.cjs
var require_f32 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/f32.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var f32 = (options = {}) => utils.numberFactory({
      name: "f32",
      size: 4,
      set: (view, value, le) => view.setFloat32(0, Number(value), le),
      get: (view, le) => view.getFloat32(0, le),
      options
    });
    exports2.f32 = f32;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/f64.cjs
var require_f64 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/f64.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var f64 = (options = {}) => utils.numberFactory({
      name: "f64",
      size: 8,
      set: (view, value, le) => view.setFloat64(0, Number(value), le),
      get: (view, le) => view.getFloat64(0, le),
      options
    });
    exports2.f64 = f64;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i8.cjs
var require_i8 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i8.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var i8 = (options = {}) => utils.numberFactory({
      name: "i8",
      size: 1,
      range: [-Number("0x7f") - 1, Number("0x7f")],
      set: (view, value) => view.setInt8(0, Number(value)),
      get: (view) => view.getInt8(0),
      options
    });
    exports2.i8 = i8;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i16.cjs
var require_i16 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i16.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var i16 = (options = {}) => utils.numberFactory({
      name: "i16",
      size: 2,
      range: [-Number("0x7fff") - 1, Number("0x7fff")],
      set: (view, value, le) => view.setInt16(0, Number(value), le),
      get: (view, le) => view.getInt16(0, le),
      options
    });
    exports2.i16 = i16;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i32.cjs
var require_i32 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i32.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var i32 = (options = {}) => utils.numberFactory({
      name: "i32",
      size: 4,
      range: [-Number("0x7fffffff") - 1, Number("0x7fffffff")],
      set: (view, value, le) => view.setInt32(0, Number(value), le),
      get: (view, le) => view.getInt32(0, le),
      options
    });
    exports2.i32 = i32;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i64.cjs
var require_i64 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i64.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var i64 = (options = {}) => utils.numberFactory({
      name: "i64",
      size: 8,
      range: [-BigInt("0x7fffffffffffffff") - 1n, BigInt("0x7fffffffffffffff")],
      set: (view, value, le) => view.setBigInt64(0, BigInt(value), le),
      get: (view, le) => view.getBigInt64(0, le),
      options
    });
    exports2.i64 = i64;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i128.cjs
var require_i128 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/i128.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var i128 = (options = {}) => utils.numberFactory({
      name: "i128",
      size: 16,
      range: [-BigInt("0x7fffffffffffffffffffffffffffffff") - 1n, BigInt("0x7fffffffffffffffffffffffffffffff")],
      set: (view, value, le) => {
        const leftOffset = le ? 8 : 0;
        const rightOffset = le ? 0 : 8;
        const rightMask = 0xffffffffffffffffn;
        view.setBigInt64(leftOffset, BigInt(value) >> 64n, le);
        view.setBigUint64(rightOffset, BigInt(value) & rightMask, le);
      },
      get: (view, le) => {
        const leftOffset = le ? 8 : 0;
        const rightOffset = le ? 0 : 8;
        const left = view.getBigInt64(leftOffset, le);
        const right = view.getBigUint64(rightOffset, le);
        return (left << 64n) + right;
      },
      options
    });
    exports2.i128 = i128;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u8.cjs
var require_u8 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u8.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var u83 = (options = {}) => utils.numberFactory({
      name: "u8",
      size: 1,
      range: [0, Number("0xff")],
      set: (view, value) => view.setUint8(0, Number(value)),
      get: (view) => view.getUint8(0),
      options
    });
    exports2.u8 = u83;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u16.cjs
var require_u16 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u16.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var u16 = (options = {}) => utils.numberFactory({
      name: "u16",
      size: 2,
      range: [0, Number("0xffff")],
      set: (view, value, le) => view.setUint16(0, Number(value), le),
      get: (view, le) => view.getUint16(0, le),
      options
    });
    exports2.u16 = u16;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u32.cjs
var require_u32 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u32.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var u322 = (options = {}) => utils.numberFactory({
      name: "u32",
      size: 4,
      range: [0, Number("0xffffffff")],
      set: (view, value, le) => view.setUint32(0, Number(value), le),
      get: (view, le) => view.getUint32(0, le),
      options
    });
    exports2.u32 = u322;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u64.cjs
var require_u64 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u64.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var u642 = (options = {}) => utils.numberFactory({
      name: "u64",
      size: 8,
      range: [0, BigInt("0xffffffffffffffff")],
      set: (view, value, le) => view.setBigUint64(0, BigInt(value), le),
      get: (view, le) => view.getBigUint64(0, le),
      options
    });
    exports2.u64 = u642;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u128.cjs
var require_u128 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/u128.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var u1282 = (options = {}) => utils.numberFactory({
      name: "u128",
      size: 16,
      range: [0, BigInt("0xffffffffffffffffffffffffffffffff")],
      set: (view, value, le) => {
        const leftOffset = le ? 8 : 0;
        const rightOffset = le ? 0 : 8;
        const rightMask = 0xffffffffffffffffn;
        view.setBigUint64(leftOffset, BigInt(value) >> 64n, le);
        view.setBigUint64(rightOffset, BigInt(value) & rightMask, le);
      },
      get: (view, le) => {
        const leftOffset = le ? 8 : 0;
        const rightOffset = le ? 0 : 8;
        const left = view.getBigUint64(leftOffset, le);
        const right = view.getBigUint64(rightOffset, le);
        return (left << 64n) + right;
      },
      options
    });
    exports2.u128 = u1282;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/shortU16.cjs
var require_shortU16 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/shortU16.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils = require_utils();
    var shortU16 = (options = {}) => ({
      description: options.description ?? "shortU16",
      fixedSize: null,
      maxSize: 3,
      serialize: (value) => {
        utils.assertRange("shortU16", 0, 65535, value);
        const bytes = [0];
        for (let ii = 0; ; ii += 1) {
          const alignedValue = value >> ii * 7;
          if (alignedValue === 0) {
            break;
          }
          const nextSevenBits = 127 & alignedValue;
          bytes[ii] = nextSevenBits;
          if (ii > 0) {
            bytes[ii - 1] |= 128;
          }
        }
        return new Uint8Array(bytes);
      },
      deserialize: (bytes, offset = 0) => {
        let value = 0;
        let byteCount = 0;
        while (++byteCount) {
          const byteIndex = byteCount - 1;
          const currentByte = bytes[offset + byteIndex];
          const nextSevenBits = 127 & currentByte;
          value |= nextSevenBits << byteIndex * 7;
          if ((currentByte & 128) === 0) {
            break;
          }
        }
        return [value, offset + byteCount];
      }
    });
    exports2.shortU16 = shortU16;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/index.cjs
var require_cjs5 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers-numbers/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var common = require_common3();
    var errors = require_errors4();
    var f32 = require_f32();
    var f64 = require_f64();
    var i8 = require_i8();
    var i16 = require_i16();
    var i32 = require_i32();
    var i64 = require_i64();
    var i128 = require_i128();
    var u83 = require_u8();
    var u16 = require_u16();
    var u322 = require_u32();
    var u642 = require_u64();
    var u1282 = require_u128();
    var shortU16 = require_shortU16();
    Object.defineProperty(exports2, "Endian", {
      enumerable: true,
      get: function() {
        return common.Endian;
      }
    });
    exports2.NumberOutOfRangeError = errors.NumberOutOfRangeError;
    exports2.f32 = f32.f32;
    exports2.f64 = f64.f64;
    exports2.i8 = i8.i8;
    exports2.i16 = i16.i16;
    exports2.i32 = i32.i32;
    exports2.i64 = i64.i64;
    exports2.i128 = i128.i128;
    exports2.u8 = u83.u8;
    exports2.u16 = u16.u16;
    exports2.u32 = u322.u32;
    exports2.u64 = u642.u64;
    exports2.u128 = u1282.u128;
    exports2.shortU16 = shortU16.shortU16;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/errors.cjs
var require_errors5 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/errors.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InvalidNumberOfItemsError = class extends Error {
      constructor(serializer, expected, actual) {
        super(`Expected [${serializer}] to have ${expected} items, got ${actual}.`);
        __publicField(this, "name", "InvalidNumberOfItemsError");
      }
    };
    var InvalidArrayLikeRemainderSizeError = class extends Error {
      constructor(remainderSize, itemSize) {
        super(`The remainder of the buffer (${remainderSize} bytes) cannot be split into chunks of ${itemSize} bytes. Serializers of "remainder" size must have a remainder that is a multiple of its item size. In other words, ${remainderSize} modulo ${itemSize} should be equal to zero.`);
        __publicField(this, "name", "InvalidArrayLikeRemainderSizeError");
      }
    };
    var UnrecognizedArrayLikeSerializerSizeError = class extends Error {
      constructor(size) {
        super(`Unrecognized array-like serializer size: ${JSON.stringify(size)}`);
        __publicField(this, "name", "UnrecognizedArrayLikeSerializerSizeError");
      }
    };
    var InvalidDataEnumVariantError = class extends Error {
      constructor(invalidVariant, validVariants) {
        super(`Invalid data enum variant. Expected one of [${validVariants.join(", ")}], got "${invalidVariant}".`);
        __publicField(this, "name", "InvalidDataEnumVariantError");
      }
    };
    var InvalidScalarEnumVariantError = class extends Error {
      constructor(invalidVariant, validVariants, min, max) {
        super(`Invalid scalar enum variant. Expected one of [${validVariants.join(", ")}] or a number between ${min} and ${max}, got "${invalidVariant}".`);
        __publicField(this, "name", "InvalidScalarEnumVariantError");
      }
    };
    var EnumDiscriminatorOutOfRangeError = class extends RangeError {
      constructor(discriminator, min, max) {
        super(`Enum discriminator out of range. Expected a number between ${min} and ${max}, got ${discriminator}.`);
        __publicField(this, "name", "EnumDiscriminatorOutOfRangeError");
      }
    };
    exports2.EnumDiscriminatorOutOfRangeError = EnumDiscriminatorOutOfRangeError;
    exports2.InvalidArrayLikeRemainderSizeError = InvalidArrayLikeRemainderSizeError;
    exports2.InvalidDataEnumVariantError = InvalidDataEnumVariantError;
    exports2.InvalidNumberOfItemsError = InvalidNumberOfItemsError;
    exports2.InvalidScalarEnumVariantError = InvalidScalarEnumVariantError;
    exports2.UnrecognizedArrayLikeSerializerSizeError = UnrecognizedArrayLikeSerializerSizeError;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/sumSerializerSizes.cjs
var require_sumSerializerSizes = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/sumSerializerSizes.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function sumSerializerSizes(sizes) {
      return sizes.reduce((all, size) => all === null || size === null ? null : all + size, 0);
    }
    exports2.sumSerializerSizes = sumSerializerSizes;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/utils.cjs
var require_utils2 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/utils.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var errors = require_errors5();
    var sumSerializerSizes = require_sumSerializerSizes();
    function getResolvedSize(size, bytes, offset) {
      if (typeof size === "number") {
        return [size, offset];
      }
      if (typeof size === "object") {
        return size.deserialize(bytes, offset);
      }
      throw new errors.UnrecognizedArrayLikeSerializerSizeError(size);
    }
    function getSizeDescription(size) {
      return typeof size === "object" ? size.description : `${size}`;
    }
    function getSizeFromChildren(size, childrenSizes) {
      if (typeof size !== "number") return null;
      if (size === 0) return 0;
      const childrenSize = sumSerializerSizes.sumSerializerSizes(childrenSizes);
      return childrenSize === null ? null : childrenSize * size;
    }
    function getSizePrefix(size, realSize) {
      return typeof size === "object" ? size.serialize(realSize) : new Uint8Array();
    }
    exports2.getResolvedSize = getResolvedSize;
    exports2.getSizeDescription = getSizeDescription;
    exports2.getSizeFromChildren = getSizeFromChildren;
    exports2.getSizePrefix = getSizePrefix;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/array.cjs
var require_array = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/array.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    var errors = require_errors5();
    var utils = require_utils2();
    function array(item, options = {}) {
      const size = options.size ?? umiSerializersNumbers.u32();
      return {
        description: options.description ?? `array(${item.description}; ${utils.getSizeDescription(size)})`,
        fixedSize: utils.getSizeFromChildren(size, [item.fixedSize]),
        maxSize: utils.getSizeFromChildren(size, [item.maxSize]),
        serialize: (value) => {
          if (typeof size === "number" && value.length !== size) {
            throw new errors.InvalidNumberOfItemsError("array", size, value.length);
          }
          return umiSerializersCore.mergeBytes([utils.getSizePrefix(size, value.length), ...value.map((v) => item.serialize(v))]);
        },
        deserialize: (bytes, offset = 0) => {
          const values = [];
          if (typeof size === "object" && bytes.slice(offset).length === 0) {
            return [values, offset];
          }
          if (size === "remainder") {
            while (offset < bytes.length) {
              const [value, newOffset2] = item.deserialize(bytes, offset);
              values.push(value);
              offset = newOffset2;
            }
            return [values, offset];
          }
          const [resolvedSize, newOffset] = utils.getResolvedSize(size, bytes, offset);
          offset = newOffset;
          for (let i = 0; i < resolvedSize; i += 1) {
            const [value, newOffset2] = item.deserialize(bytes, offset);
            values.push(value);
            offset = newOffset2;
          }
          return [values, offset];
        }
      };
    }
    exports2.array = array;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/bitArray.cjs
var require_bitArray = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/bitArray.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var bitArray = (size, options = {}) => {
      const parsedOptions = typeof options === "boolean" ? {
        backward: options
      } : options;
      const backward = parsedOptions.backward ?? false;
      const backwardSuffix = backward ? "; backward" : "";
      return {
        description: parsedOptions.description ?? `bitArray(${size}${backwardSuffix})`,
        fixedSize: size,
        maxSize: size,
        serialize(value) {
          const bytes = [];
          for (let i = 0; i < size; i += 1) {
            let byte = 0;
            for (let j = 0; j < 8; j += 1) {
              const feature = Number(value[i * 8 + j] ?? 0);
              byte |= feature << (backward ? j : 7 - j);
            }
            if (backward) {
              bytes.unshift(byte);
            } else {
              bytes.push(byte);
            }
          }
          return new Uint8Array(bytes);
        },
        deserialize(bytes, offset = 0) {
          const booleans = [];
          let slice = bytes.slice(offset, offset + size);
          slice = backward ? slice.reverse() : slice;
          if (slice.length !== size) {
            throw new umiSerializersCore.NotEnoughBytesError("bitArray", size, slice.length);
          }
          slice.forEach((byte) => {
            for (let i = 0; i < 8; i += 1) {
              if (backward) {
                booleans.push(Boolean(byte & 1));
                byte >>= 1;
              } else {
                booleans.push(Boolean(byte & 128));
                byte <<= 1;
              }
            }
          });
          return [booleans, offset + size];
        }
      };
    };
    exports2.bitArray = bitArray;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/bool.cjs
var require_bool = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/bool.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    function bool2(options = {}) {
      const size = options.size ?? umiSerializersNumbers.u8();
      if (size.fixedSize === null) {
        throw new umiSerializersCore.ExpectedFixedSizeSerializerError("Serializer [bool] requires a fixed size.");
      }
      return {
        description: options.description ?? `bool(${size.description})`,
        fixedSize: size.fixedSize,
        maxSize: size.fixedSize,
        serialize: (value) => size.serialize(value ? 1 : 0),
        deserialize: (bytes, offset = 0) => {
          if (bytes.slice(offset).length === 0) {
            throw new umiSerializersCore.DeserializingEmptyBufferError("bool");
          }
          const [value, vOffset] = size.deserialize(bytes, offset);
          return [value === 1, vOffset];
        }
      };
    }
    exports2.bool = bool2;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/bytes.cjs
var require_bytes2 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/bytes.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var utils = require_utils2();
    function bytes(options = {}) {
      const size = options.size ?? "variable";
      const description = options.description ?? `bytes(${utils.getSizeDescription(size)})`;
      const byteSerializer = {
        description,
        fixedSize: null,
        maxSize: null,
        serialize: (value) => new Uint8Array(value),
        deserialize: (bytes2, offset = 0) => {
          const slice = bytes2.slice(offset);
          return [slice, offset + slice.length];
        }
      };
      if (size === "variable") {
        return byteSerializer;
      }
      if (typeof size === "number") {
        return umiSerializersCore.fixSerializer(byteSerializer, size, description);
      }
      return {
        description,
        fixedSize: null,
        maxSize: null,
        serialize: (value) => {
          const contentBytes = byteSerializer.serialize(value);
          const lengthBytes = size.serialize(contentBytes.length);
          return umiSerializersCore.mergeBytes([lengthBytes, contentBytes]);
        },
        deserialize: (buffer, offset = 0) => {
          if (buffer.slice(offset).length === 0) {
            throw new umiSerializersCore.DeserializingEmptyBufferError("bytes");
          }
          const [lengthBigInt, lengthOffset] = size.deserialize(buffer, offset);
          const length = Number(lengthBigInt);
          offset = lengthOffset;
          const contentBuffer = buffer.slice(offset, offset + length);
          if (contentBuffer.length < length) {
            throw new umiSerializersCore.NotEnoughBytesError("bytes", length, contentBuffer.length);
          }
          const [value, contentOffset] = byteSerializer.deserialize(contentBuffer);
          offset += contentOffset;
          return [value, offset];
        }
      };
    }
    exports2.bytes = bytes;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/maxSerializerSizes.cjs
var require_maxSerializerSizes = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/maxSerializerSizes.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function maxSerializerSizes(sizes) {
      return sizes.reduce((all, size) => all === null || size === null ? null : Math.max(all, size), 0);
    }
    exports2.maxSerializerSizes = maxSerializerSizes;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/dataEnum.cjs
var require_dataEnum = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/dataEnum.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    var errors = require_errors5();
    var maxSerializerSizes = require_maxSerializerSizes();
    var sumSerializerSizes = require_sumSerializerSizes();
    function dataEnum(variants, options = {}) {
      const prefix = options.size ?? umiSerializersNumbers.u8();
      const fieldDescriptions = variants.map(([name, serializer]) => `${String(name)}${serializer ? `: ${serializer.description}` : ""}`).join(", ");
      const allVariantHaveTheSameFixedSize = variants.every((one, i, all) => one[1].fixedSize === all[0][1].fixedSize);
      const fixedVariantSize = allVariantHaveTheSameFixedSize ? variants[0][1].fixedSize : null;
      const maxVariantSize = maxSerializerSizes.maxSerializerSizes(variants.map(([, field]) => field.maxSize));
      return {
        description: options.description ?? `dataEnum(${fieldDescriptions}; ${prefix.description})`,
        fixedSize: variants.length === 0 ? prefix.fixedSize : sumSerializerSizes.sumSerializerSizes([prefix.fixedSize, fixedVariantSize]),
        maxSize: variants.length === 0 ? prefix.maxSize : sumSerializerSizes.sumSerializerSizes([prefix.maxSize, maxVariantSize]),
        serialize: (variant) => {
          const discriminator = variants.findIndex(([key]) => variant.__kind === key);
          if (discriminator < 0) {
            throw new errors.InvalidDataEnumVariantError(variant.__kind, variants.map(([key]) => key));
          }
          const variantPrefix = prefix.serialize(discriminator);
          const variantSerializer = variants[discriminator][1];
          const variantBytes = variantSerializer.serialize(variant);
          return umiSerializersCore.mergeBytes([variantPrefix, variantBytes]);
        },
        deserialize: (bytes, offset = 0) => {
          if (bytes.slice(offset).length === 0) {
            throw new umiSerializersCore.DeserializingEmptyBufferError("dataEnum");
          }
          const [discriminator, dOffset] = prefix.deserialize(bytes, offset);
          offset = dOffset;
          const variantField = variants[Number(discriminator)] ?? null;
          if (!variantField) {
            throw new errors.EnumDiscriminatorOutOfRangeError(discriminator, 0, variants.length - 1);
          }
          const [variant, vOffset] = variantField[1].deserialize(bytes, offset);
          offset = vOffset;
          return [{
            __kind: variantField[0],
            ...variant ?? {}
          }, offset];
        }
      };
    }
    exports2.dataEnum = dataEnum;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/map.cjs
var require_map = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/map.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    var errors = require_errors5();
    var utils = require_utils2();
    function map(key, value, options = {}) {
      const size = options.size ?? umiSerializersNumbers.u32();
      return {
        description: options.description ?? `map(${key.description}, ${value.description}; ${utils.getSizeDescription(size)})`,
        fixedSize: utils.getSizeFromChildren(size, [key.fixedSize, value.fixedSize]),
        maxSize: utils.getSizeFromChildren(size, [key.maxSize, value.maxSize]),
        serialize: (map2) => {
          if (typeof size === "number" && map2.size !== size) {
            throw new errors.InvalidNumberOfItemsError("map", size, map2.size);
          }
          const itemBytes = Array.from(map2, ([k, v]) => umiSerializersCore.mergeBytes([key.serialize(k), value.serialize(v)]));
          return umiSerializersCore.mergeBytes([utils.getSizePrefix(size, map2.size), ...itemBytes]);
        },
        deserialize: (bytes, offset = 0) => {
          const map2 = /* @__PURE__ */ new Map();
          if (typeof size === "object" && bytes.slice(offset).length === 0) {
            return [map2, offset];
          }
          if (size === "remainder") {
            while (offset < bytes.length) {
              const [deserializedKey, kOffset] = key.deserialize(bytes, offset);
              offset = kOffset;
              const [deserializedValue, vOffset] = value.deserialize(bytes, offset);
              offset = vOffset;
              map2.set(deserializedKey, deserializedValue);
            }
            return [map2, offset];
          }
          const [resolvedSize, newOffset] = utils.getResolvedSize(size, bytes, offset);
          offset = newOffset;
          for (let i = 0; i < resolvedSize; i += 1) {
            const [deserializedKey, kOffset] = key.deserialize(bytes, offset);
            offset = kOffset;
            const [deserializedValue, vOffset] = value.deserialize(bytes, offset);
            offset = vOffset;
            map2.set(deserializedKey, deserializedValue);
          }
          return [map2, offset];
        }
      };
    }
    exports2.map = map;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/nullable.cjs
var require_nullable = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/nullable.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    var sumSerializerSizes = require_sumSerializerSizes();
    var utils = require_utils2();
    function nullable(item, options = {}) {
      const prefix = options.prefix ?? umiSerializersNumbers.u8();
      const fixed = options.fixed ?? false;
      let descriptionSuffix = `; ${utils.getSizeDescription(prefix)}`;
      let fixedSize = item.fixedSize === 0 ? prefix.fixedSize : null;
      if (fixed) {
        if (item.fixedSize === null || prefix.fixedSize === null) {
          throw new umiSerializersCore.ExpectedFixedSizeSerializerError("Fixed nullables can only be used with fixed-size serializers");
        }
        descriptionSuffix += "; fixed";
        fixedSize = prefix.fixedSize + item.fixedSize;
      }
      return {
        description: options.description ?? `nullable(${item.description + descriptionSuffix})`,
        fixedSize,
        maxSize: sumSerializerSizes.sumSerializerSizes([prefix.maxSize, item.maxSize]),
        serialize: (option) => {
          const prefixByte = prefix.serialize(Number(option !== null));
          if (fixed) {
            const itemFixedSize = item.fixedSize;
            const itemBytes2 = option !== null ? item.serialize(option).slice(0, itemFixedSize) : new Uint8Array(itemFixedSize).fill(0);
            return umiSerializersCore.mergeBytes([prefixByte, itemBytes2]);
          }
          const itemBytes = option !== null ? item.serialize(option) : new Uint8Array();
          return umiSerializersCore.mergeBytes([prefixByte, itemBytes]);
        },
        deserialize: (bytes, offset = 0) => {
          if (bytes.slice(offset).length === 0) {
            return [null, offset];
          }
          const fixedOffset = offset + (prefix.fixedSize ?? 0) + (item.fixedSize ?? 0);
          const [isSome, prefixOffset] = prefix.deserialize(bytes, offset);
          offset = prefixOffset;
          if (isSome === 0) {
            return [null, fixed ? fixedOffset : offset];
          }
          const [value, newOffset] = item.deserialize(bytes, offset);
          offset = newOffset;
          return [value, fixed ? fixedOffset : offset];
        }
      };
    }
    exports2.nullable = nullable;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/option.cjs
var require_option = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/option.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiOptions = require_cjs();
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    var sumSerializerSizes = require_sumSerializerSizes();
    var utils = require_utils2();
    function option(item, options = {}) {
      const prefix = options.prefix ?? umiSerializersNumbers.u8();
      const fixed = options.fixed ?? false;
      let descriptionSuffix = `; ${utils.getSizeDescription(prefix)}`;
      let fixedSize = item.fixedSize === 0 ? prefix.fixedSize : null;
      if (fixed) {
        if (item.fixedSize === null || prefix.fixedSize === null) {
          throw new umiSerializersCore.ExpectedFixedSizeSerializerError("Fixed options can only be used with fixed-size serializers");
        }
        descriptionSuffix += "; fixed";
        fixedSize = prefix.fixedSize + item.fixedSize;
      }
      return {
        description: options.description ?? `option(${item.description + descriptionSuffix})`,
        fixedSize,
        maxSize: sumSerializerSizes.sumSerializerSizes([prefix.maxSize, item.maxSize]),
        serialize: (optionOrNullable) => {
          const option2 = umiOptions.isOption(optionOrNullable) ? optionOrNullable : umiOptions.wrapNullable(optionOrNullable);
          const prefixByte = prefix.serialize(Number(umiOptions.isSome(option2)));
          if (fixed) {
            const itemFixedSize = item.fixedSize;
            const itemBytes2 = umiOptions.isSome(option2) ? item.serialize(option2.value).slice(0, itemFixedSize) : new Uint8Array(itemFixedSize).fill(0);
            return umiSerializersCore.mergeBytes([prefixByte, itemBytes2]);
          }
          const itemBytes = umiOptions.isSome(option2) ? item.serialize(option2.value) : new Uint8Array();
          return umiSerializersCore.mergeBytes([prefixByte, itemBytes]);
        },
        deserialize: (bytes, offset = 0) => {
          if (bytes.slice(offset).length === 0) {
            return [umiOptions.none(), offset];
          }
          const fixedOffset = offset + (prefix.fixedSize ?? 0) + (item.fixedSize ?? 0);
          const [isSome, prefixOffset] = prefix.deserialize(bytes, offset);
          offset = prefixOffset;
          if (isSome === 0) {
            return [umiOptions.none(), fixed ? fixedOffset : offset];
          }
          const [value, newOffset] = item.deserialize(bytes, offset);
          offset = newOffset;
          return [umiOptions.some(value), fixed ? fixedOffset : offset];
        }
      };
    }
    exports2.option = option;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/publicKey.cjs
var require_publicKey = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/publicKey.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiPublicKeys = require_cjs4();
    var umiSerializersCore = require_cjs2();
    function publicKey2(options = {}) {
      return {
        description: options.description ?? "publicKey",
        fixedSize: 32,
        maxSize: 32,
        serialize: (value) => umiPublicKeys.publicKeyBytes(umiPublicKeys.publicKey(value)),
        deserialize: (bytes, offset = 0) => {
          const pubkeyBytes = bytes.slice(offset, offset + 32);
          if (pubkeyBytes.length === 0) {
            throw new umiSerializersCore.DeserializingEmptyBufferError("publicKey");
          }
          if (pubkeyBytes.length < umiPublicKeys.PUBLIC_KEY_LENGTH) {
            throw new umiSerializersCore.NotEnoughBytesError("publicKey", umiPublicKeys.PUBLIC_KEY_LENGTH, pubkeyBytes.length);
          }
          return [umiPublicKeys.publicKey(pubkeyBytes), offset + 32];
        }
      };
    }
    exports2.publicKey = publicKey2;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/scalarEnum.cjs
var require_scalarEnum = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/scalarEnum.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    var errors = require_errors5();
    function scalarEnum(constructor, options = {}) {
      const prefix = options.size ?? umiSerializersNumbers.u8();
      const enumKeys = Object.keys(constructor);
      const enumValues = Object.values(constructor);
      const isNumericEnum = enumValues.some((v) => typeof v === "number");
      const valueDescriptions = enumValues.filter((v) => typeof v === "string").join(", ");
      const minRange = 0;
      const maxRange = isNumericEnum ? enumValues.length / 2 - 1 : enumValues.length - 1;
      const stringValues = isNumericEnum ? [...enumKeys] : [.../* @__PURE__ */ new Set([...enumKeys, ...enumValues])];
      function assertValidVariant(variant) {
        const isInvalidNumber = typeof variant === "number" && (variant < minRange || variant > maxRange);
        const isInvalidString = typeof variant === "string" && !stringValues.includes(variant);
        if (isInvalidNumber || isInvalidString) {
          throw new errors.InvalidScalarEnumVariantError(variant, stringValues, minRange, maxRange);
        }
      }
      return {
        description: options.description ?? `enum(${valueDescriptions}; ${prefix.description})`,
        fixedSize: prefix.fixedSize,
        maxSize: prefix.maxSize,
        serialize: (value) => {
          assertValidVariant(value);
          if (typeof value === "number") return prefix.serialize(value);
          const valueIndex = enumValues.indexOf(value);
          if (valueIndex >= 0) return prefix.serialize(valueIndex);
          return prefix.serialize(enumKeys.indexOf(value));
        },
        deserialize: (bytes, offset = 0) => {
          if (bytes.slice(offset).length === 0) {
            throw new umiSerializersCore.DeserializingEmptyBufferError("enum");
          }
          const [value, newOffset] = prefix.deserialize(bytes, offset);
          const valueAsNumber = Number(value);
          offset = newOffset;
          if (valueAsNumber < minRange || valueAsNumber > maxRange) {
            throw new errors.EnumDiscriminatorOutOfRangeError(valueAsNumber, minRange, maxRange);
          }
          return [isNumericEnum ? valueAsNumber : enumValues[valueAsNumber], offset];
        }
      };
    }
    exports2.scalarEnum = scalarEnum;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/set.cjs
var require_set = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/set.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersNumbers = require_cjs5();
    var errors = require_errors5();
    var utils = require_utils2();
    function set(item, options = {}) {
      const size = options.size ?? umiSerializersNumbers.u32();
      return {
        description: options.description ?? `set(${item.description}; ${utils.getSizeDescription(size)})`,
        fixedSize: utils.getSizeFromChildren(size, [item.fixedSize]),
        maxSize: utils.getSizeFromChildren(size, [item.maxSize]),
        serialize: (set2) => {
          if (typeof size === "number" && set2.size !== size) {
            throw new errors.InvalidNumberOfItemsError("set", size, set2.size);
          }
          const itemBytes = Array.from(set2, (value) => item.serialize(value));
          return umiSerializersCore.mergeBytes([utils.getSizePrefix(size, set2.size), ...itemBytes]);
        },
        deserialize: (bytes, offset = 0) => {
          const set2 = /* @__PURE__ */ new Set();
          if (typeof size === "object" && bytes.slice(offset).length === 0) {
            return [set2, offset];
          }
          if (size === "remainder") {
            while (offset < bytes.length) {
              const [value, newOffset2] = item.deserialize(bytes, offset);
              set2.add(value);
              offset = newOffset2;
            }
            return [set2, offset];
          }
          const [resolvedSize, newOffset] = utils.getResolvedSize(size, bytes, offset);
          offset = newOffset;
          for (let i = 0; i < resolvedSize; i += 1) {
            const [value, newOffset2] = item.deserialize(bytes, offset);
            set2.add(value);
            offset = newOffset2;
          }
          return [set2, offset];
        }
      };
    }
    exports2.set = set;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/string.cjs
var require_string = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/string.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersEncodings = require_cjs3();
    var umiSerializersNumbers = require_cjs5();
    var utils = require_utils2();
    function string(options = {}) {
      const size = options.size ?? umiSerializersNumbers.u32();
      const encoding = options.encoding ?? umiSerializersEncodings.utf8;
      const description = options.description ?? `string(${encoding.description}; ${utils.getSizeDescription(size)})`;
      if (size === "variable") {
        return {
          ...encoding,
          description
        };
      }
      if (typeof size === "number") {
        return umiSerializersCore.fixSerializer(encoding, size, description);
      }
      return {
        description,
        fixedSize: null,
        maxSize: null,
        serialize: (value) => {
          const contentBytes = encoding.serialize(value);
          const lengthBytes = size.serialize(contentBytes.length);
          return umiSerializersCore.mergeBytes([lengthBytes, contentBytes]);
        },
        deserialize: (buffer, offset = 0) => {
          if (buffer.slice(offset).length === 0) {
            throw new umiSerializersCore.DeserializingEmptyBufferError("string");
          }
          const [lengthBigInt, lengthOffset] = size.deserialize(buffer, offset);
          const length = Number(lengthBigInt);
          offset = lengthOffset;
          const contentBuffer = buffer.slice(offset, offset + length);
          if (contentBuffer.length < length) {
            throw new umiSerializersCore.NotEnoughBytesError("string", length, contentBuffer.length);
          }
          const [value, contentOffset] = encoding.deserialize(contentBuffer);
          offset += contentOffset;
          return [value, offset];
        }
      };
    }
    exports2.string = string;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/struct.cjs
var require_struct = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/struct.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var sumSerializerSizes = require_sumSerializerSizes();
    function struct2(fields, options = {}) {
      const fieldDescriptions = fields.map(([name, serializer]) => `${String(name)}: ${serializer.description}`).join(", ");
      return {
        description: options.description ?? `struct(${fieldDescriptions})`,
        fixedSize: sumSerializerSizes.sumSerializerSizes(fields.map(([, field]) => field.fixedSize)),
        maxSize: sumSerializerSizes.sumSerializerSizes(fields.map(([, field]) => field.maxSize)),
        serialize: (struct3) => {
          const fieldBytes = fields.map(([key, serializer]) => serializer.serialize(struct3[key]));
          return umiSerializersCore.mergeBytes(fieldBytes);
        },
        deserialize: (bytes, offset = 0) => {
          const struct3 = {};
          fields.forEach(([key, serializer]) => {
            const [value, newOffset] = serializer.deserialize(bytes, offset);
            offset = newOffset;
            struct3[key] = value;
          });
          return [struct3, offset];
        }
      };
    }
    exports2.struct = struct2;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/tuple.cjs
var require_tuple = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/tuple.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var sumSerializerSizes = require_sumSerializerSizes();
    var errors = require_errors5();
    function tuple(items, options = {}) {
      const itemDescriptions = items.map((item) => item.description).join(", ");
      return {
        description: options.description ?? `tuple(${itemDescriptions})`,
        fixedSize: sumSerializerSizes.sumSerializerSizes(items.map((item) => item.fixedSize)),
        maxSize: sumSerializerSizes.sumSerializerSizes(items.map((item) => item.maxSize)),
        serialize: (value) => {
          if (value.length !== items.length) {
            throw new errors.InvalidNumberOfItemsError("tuple", items.length, value.length);
          }
          return umiSerializersCore.mergeBytes(items.map((item, index) => item.serialize(value[index])));
        },
        deserialize: (bytes, offset = 0) => {
          const values = [];
          items.forEach((serializer) => {
            const [newValue, newOffset] = serializer.deserialize(bytes, offset);
            values.push(newValue);
            offset = newOffset;
          });
          return [values, offset];
        }
      };
    }
    exports2.tuple = tuple;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/unit.cjs
var require_unit = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/unit.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function unit(options = {}) {
      return {
        description: options.description ?? "unit",
        fixedSize: 0,
        maxSize: 0,
        serialize: () => new Uint8Array(),
        deserialize: (_bytes, offset = 0) => [void 0, offset]
      };
    }
    exports2.unit = unit;
  }
});

// ../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/index.cjs
var require_cjs6 = __commonJS({
  "../node_modules/@metaplex-foundation/umi-serializers/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializersCore = require_cjs2();
    var umiSerializersEncodings = require_cjs3();
    var umiSerializersNumbers = require_cjs5();
    var array = require_array();
    var bitArray = require_bitArray();
    var bool2 = require_bool();
    var bytes = require_bytes2();
    var dataEnum = require_dataEnum();
    var errors = require_errors5();
    var map = require_map();
    var nullable = require_nullable();
    var option = require_option();
    var publicKey2 = require_publicKey();
    var scalarEnum = require_scalarEnum();
    var set = require_set();
    var string = require_string();
    var struct2 = require_struct();
    var tuple = require_tuple();
    var unit = require_unit();
    var maxSerializerSizes = require_maxSerializerSizes();
    var sumSerializerSizes = require_sumSerializerSizes();
    exports2.array = array.array;
    exports2.bitArray = bitArray.bitArray;
    exports2.bool = bool2.bool;
    exports2.bytes = bytes.bytes;
    exports2.dataEnum = dataEnum.dataEnum;
    exports2.EnumDiscriminatorOutOfRangeError = errors.EnumDiscriminatorOutOfRangeError;
    exports2.InvalidArrayLikeRemainderSizeError = errors.InvalidArrayLikeRemainderSizeError;
    exports2.InvalidDataEnumVariantError = errors.InvalidDataEnumVariantError;
    exports2.InvalidNumberOfItemsError = errors.InvalidNumberOfItemsError;
    exports2.InvalidScalarEnumVariantError = errors.InvalidScalarEnumVariantError;
    exports2.UnrecognizedArrayLikeSerializerSizeError = errors.UnrecognizedArrayLikeSerializerSizeError;
    exports2.map = map.map;
    exports2.nullable = nullable.nullable;
    exports2.option = option.option;
    exports2.publicKey = publicKey2.publicKey;
    exports2.scalarEnum = scalarEnum.scalarEnum;
    exports2.set = set.set;
    exports2.string = string.string;
    exports2.struct = struct2.struct;
    exports2.tuple = tuple.tuple;
    exports2.unit = unit.unit;
    exports2.maxSerializerSizes = maxSerializerSizes.maxSerializerSizes;
    exports2.sumSerializerSizes = sumSerializerSizes.sumSerializerSizes;
    Object.keys(umiSerializersCore).forEach(function(k) {
      if (k !== "default" && !exports2.hasOwnProperty(k)) Object.defineProperty(exports2, k, {
        enumerable: true,
        get: function() {
          return umiSerializersCore[k];
        }
      });
    });
    Object.keys(umiSerializersEncodings).forEach(function(k) {
      if (k !== "default" && !exports2.hasOwnProperty(k)) Object.defineProperty(exports2, k, {
        enumerable: true,
        get: function() {
          return umiSerializersEncodings[k];
        }
      });
    });
    Object.keys(umiSerializersNumbers).forEach(function(k) {
      if (k !== "default" && !exports2.hasOwnProperty(k)) Object.defineProperty(exports2, k, {
        enumerable: true,
        get: function() {
          return umiSerializersNumbers[k];
        }
      });
    });
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/serializersInternal.cjs
var require_serializersInternal = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/serializersInternal.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializers = require_cjs6();
    var mapSerializer = umiSerializers.mapSerializer;
    var fixSerializer = umiSerializers.fixSerializer;
    var reverseSerializer = umiSerializers.reverseSerializer;
    var mergeBytes = umiSerializers.mergeBytes;
    var padBytes = umiSerializers.padBytes;
    var fixBytes = umiSerializers.fixBytes;
    var utf8 = umiSerializers.utf8;
    var baseX = umiSerializers.baseX;
    var base10 = umiSerializers.base10;
    var base58 = umiSerializers.base58;
    var base64 = umiSerializers.base64;
    var base16 = umiSerializers.base16;
    var bitArray = umiSerializers.bitArray;
    var removeNullCharacters = umiSerializers.removeNullCharacters;
    var padNullCharacters = umiSerializers.padNullCharacters;
    var Endian = umiSerializers.Endian;
    exports2.Endian = Endian;
    exports2.base10 = base10;
    exports2.base16 = base16;
    exports2.base58 = base58;
    exports2.base64 = base64;
    exports2.baseX = baseX;
    exports2.bitArray = bitArray;
    exports2.fixBytes = fixBytes;
    exports2.fixSerializer = fixSerializer;
    exports2.mapSerializer = mapSerializer;
    exports2.mergeBytes = mergeBytes;
    exports2.padBytes = padBytes;
    exports2.padNullCharacters = padNullCharacters;
    exports2.removeNullCharacters = removeNullCharacters;
    exports2.reverseSerializer = reverseSerializer;
    exports2.utf8 = utf8;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/UmiError.cjs
var require_UmiError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/UmiError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var UmiError = class extends Error {
      constructor(message, source, sourceDetails, cause) {
        super(message);
        __publicField(this, "name", "UmiError");
        this.source = source;
        this.sourceDetails = sourceDetails;
        this.cause = cause;
        this.message = `${this.message}

Source: ${this.getFullSource()}${this.cause ? `

Caused By: ${this.cause}` : ""}
`;
      }
      getCapitalizedSource() {
        if (this.source === "sdk" || this.source === "rpc") {
          return this.source.toUpperCase();
        }
        return this.source[0].toUpperCase() + this.source.slice(1);
      }
      getFullSource() {
        const capitalizedSource = this.getCapitalizedSource();
        const sourceDetails = this.sourceDetails ? ` > ${this.sourceDetails}` : "";
        return capitalizedSource + sourceDetails;
      }
      toString() {
        return `[${this.name}] ${this.message}`;
      }
    };
    exports2.UmiError = UmiError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/SdkError.cjs
var require_SdkError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/SdkError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var UmiError = require_UmiError();
    var SdkError = class extends UmiError.UmiError {
      constructor(message, cause) {
        super(message, "sdk", void 0, cause);
        __publicField(this, "name", "SdkError");
      }
    };
    exports2.SdkError = SdkError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/UnexpectedAccountError.cjs
var require_UnexpectedAccountError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/UnexpectedAccountError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var SdkError = require_SdkError();
    var UnexpectedAccountError = class extends SdkError.SdkError {
      constructor(publicKey2, expectedType, cause) {
        const message = `The account at the provided address [${publicKey2}] is not of the expected type [${expectedType}].`;
        super(message, cause);
        __publicField(this, "name", "UnexpectedAccountError");
      }
    };
    exports2.UnexpectedAccountError = UnexpectedAccountError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/AccountNotFoundError.cjs
var require_AccountNotFoundError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/AccountNotFoundError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var SdkError = require_SdkError();
    var AccountNotFoundError = class extends SdkError.SdkError {
      constructor(publicKey2, accountType, solution) {
        const message = `${accountType ? `The account of type [${accountType}] was not found` : "No account was found"} at the provided address [${publicKey2}].${solution ? ` ${solution}` : ""}`;
        super(message);
        __publicField(this, "name", "AccountNotFoundError");
      }
    };
    exports2.AccountNotFoundError = AccountNotFoundError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Account.cjs
var require_Account = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Account.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var UnexpectedAccountError = require_UnexpectedAccountError();
    var AccountNotFoundError = require_AccountNotFoundError();
    var ACCOUNT_HEADER_SIZE = 128;
    function deserializeAccount(rawAccount, dataSerializer) {
      const {
        data,
        publicKey: publicKey2,
        ...rest
      } = rawAccount;
      try {
        const [parsedData] = dataSerializer.deserialize(data);
        return {
          publicKey: publicKey2,
          header: rest,
          ...parsedData
        };
      } catch (error) {
        throw new UnexpectedAccountError.UnexpectedAccountError(publicKey2, dataSerializer.description, error);
      }
    }
    function assertAccountExists(account, name, solution) {
      if (!account.exists) {
        throw new AccountNotFoundError.AccountNotFoundError(account.publicKey, name, solution);
      }
    }
    exports2.ACCOUNT_HEADER_SIZE = ACCOUNT_HEADER_SIZE;
    exports2.assertAccountExists = assertAccountExists;
    exports2.deserializeAccount = deserializeAccount;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/BigInt.cjs
var require_BigInt = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/BigInt.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var createBigInt = (input) => {
      input = typeof input === "object" ? input.toString() : input;
      return BigInt(input);
    };
    exports2.createBigInt = createBigInt;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/UnexpectedAmountError.cjs
var require_UnexpectedAmountError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/UnexpectedAmountError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var SdkError = require_SdkError();
    var UnexpectedAmountError = class extends SdkError.SdkError {
      constructor(amount, expectedIdentifier, expectedDecimals) {
        const message = `Expected amount of type [${expectedIdentifier} with ${expectedDecimals} decimals] but got [${amount.identifier} with ${amount.decimals} decimals]. Ensure the provided Amount is of the expected type.`;
        super(message);
        __publicField(this, "name", "UnexpectedAmountError");
        this.amount = amount;
        this.expectedIdentifier = expectedIdentifier;
        this.expectedDecimals = expectedDecimals;
      }
    };
    exports2.UnexpectedAmountError = UnexpectedAmountError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/AmountMismatchError.cjs
var require_AmountMismatchError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/AmountMismatchError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var SdkError = require_SdkError();
    var AmountMismatchError = class extends SdkError.SdkError {
      constructor(left, right, operation) {
        const wrappedOperation = operation ? ` [${operation}]` : "";
        const message = `The SDK tried to execute an operation${wrappedOperation} on two amounts of different types: [${left.identifier} with ${left.decimals} decimals] and [${right.identifier} with ${right.decimals} decimals]. Provide both amounts in the same type to perform this operation.`;
        super(message);
        __publicField(this, "name", "AmountMismatchError");
        this.left = left;
        this.right = right;
        this.operation = operation;
      }
    };
    exports2.AmountMismatchError = AmountMismatchError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Amount.cjs
var require_Amount = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Amount.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializers = require_cjs6();
    var BigInt$1 = require_BigInt();
    var UnexpectedAmountError = require_UnexpectedAmountError();
    var AmountMismatchError = require_AmountMismatchError();
    var createAmount = (basisPoints, identifier, decimals) => ({
      basisPoints: BigInt$1.createBigInt(basisPoints),
      identifier,
      decimals
    });
    var createAmountFromDecimals = (decimalAmount, identifier, decimals) => {
      const exponentAmount = createAmount(BigInt(10) ** BigInt(decimals ?? 0), identifier, decimals);
      return multiplyAmount(exponentAmount, decimalAmount);
    };
    var percentAmount = (percent, decimals = 2) => createAmountFromDecimals(percent, "%", decimals);
    var tokenAmount = (tokens, identifier, decimals) => createAmountFromDecimals(tokens, identifier ?? "splToken", decimals ?? 0);
    var lamports = (lamports2) => createAmount(lamports2, "SOL", 9);
    var sol = (sol2) => createAmountFromDecimals(sol2, "SOL", 9);
    var usd = (usd2) => createAmountFromDecimals(usd2, "USD", 2);
    var isAmount = (amount, identifier, decimals) => amount.identifier === identifier && amount.decimals === decimals;
    var isSolAmount = (amount) => isAmount(amount, "SOL", 9);
    var sameAmounts = (left, right) => isAmount(left, right.identifier, right.decimals);
    function assertAmount(amount, identifier, decimals) {
      if (!isAmount(amount, identifier, decimals)) {
        throw new UnexpectedAmountError.UnexpectedAmountError(amount, identifier, decimals);
      }
    }
    function assertSolAmount(actual) {
      assertAmount(actual, "SOL", 9);
    }
    function assertSameAmounts(left, right, operation) {
      if (!sameAmounts(left, right)) {
        throw new AmountMismatchError.AmountMismatchError(left, right, operation);
      }
    }
    var addAmounts = (left, right) => {
      assertSameAmounts(left, right, "add");
      return {
        ...left,
        basisPoints: left.basisPoints + right.basisPoints
      };
    };
    var subtractAmounts = (left, right) => {
      assertSameAmounts(left, right, "subtract");
      return {
        ...left,
        basisPoints: left.basisPoints - right.basisPoints
      };
    };
    var multiplyAmount = (left, multiplier) => {
      if (typeof multiplier === "bigint") {
        return {
          ...left,
          basisPoints: left.basisPoints * multiplier
        };
      }
      const [units, decimals] = multiplier.toString().split(".");
      const multiplierBasisPoints = BigInt(units + (decimals ?? ""));
      const multiplierExponents = BigInt(10) ** BigInt(decimals?.length ?? 0);
      return {
        ...left,
        basisPoints: left.basisPoints * multiplierBasisPoints / multiplierExponents
      };
    };
    var divideAmount = (left, divisor) => {
      if (typeof divisor === "bigint") {
        return {
          ...left,
          basisPoints: left.basisPoints / divisor
        };
      }
      const [units, decimals] = divisor.toString().split(".");
      const divisorBasisPoints = BigInt(units + (decimals ?? ""));
      const divisorExponents = BigInt(10) ** BigInt(decimals?.length ?? 0);
      return {
        ...left,
        basisPoints: left.basisPoints * divisorExponents / divisorBasisPoints
      };
    };
    var absoluteAmount = (value) => {
      const x = value.basisPoints;
      return {
        ...value,
        basisPoints: x < 0 ? -x : x
      };
    };
    var compareAmounts = (left, right) => {
      assertSameAmounts(left, right, "compare");
      if (left.basisPoints > right.basisPoints) return 1;
      if (left.basisPoints < right.basisPoints) return -1;
      return 0;
    };
    var isEqualToAmount = (left, right, tolerance) => {
      tolerance = tolerance ?? createAmount(0, left.identifier, left.decimals);
      assertSameAmounts(left, right, "isEqualToAmount");
      assertSameAmounts(left, tolerance, "isEqualToAmount");
      const delta = absoluteAmount(subtractAmounts(left, right));
      return isLessThanOrEqualToAmount(delta, tolerance);
    };
    var isLessThanAmount = (left, right) => compareAmounts(left, right) < 0;
    var isLessThanOrEqualToAmount = (left, right) => compareAmounts(left, right) <= 0;
    var isGreaterThanAmount = (left, right) => compareAmounts(left, right) > 0;
    var isGreaterThanOrEqualToAmount = (left, right) => compareAmounts(left, right) >= 0;
    var isZeroAmount = (value) => value.basisPoints === BigInt(0);
    var isPositiveAmount = (value) => value.basisPoints >= BigInt(0);
    var isNegativeAmount = (value) => value.basisPoints < BigInt(0);
    var amountToString = (value, maxDecimals) => {
      let text = value.basisPoints.toString();
      if (value.decimals === 0) {
        return text;
      }
      const sign = text.startsWith("-") ? "-" : "";
      text = text.replace("-", "");
      text = text.padStart(value.decimals + 1, "0");
      const units = text.slice(0, -value.decimals);
      let decimals = text.slice(-value.decimals);
      if (maxDecimals !== void 0) {
        decimals = decimals.slice(0, maxDecimals);
      }
      return `${sign + units}.${decimals}`;
    };
    var amountToNumber = (value) => parseFloat(amountToString(value));
    var displayAmount = (value, maxDecimals) => {
      const amountAsString = amountToString(value, maxDecimals);
      switch (value.identifier) {
        case "%":
          return `${amountAsString}%`;
        case "splToken":
          return /^1(\.0+)?$/.test(amountAsString) ? `${amountAsString} Token` : `${amountAsString} Tokens`;
        default:
          if (value.identifier.startsWith("splToken.")) {
            const [, identifier] = value.identifier.split(".");
            return `${identifier} ${amountAsString}`;
          }
          return `${value.identifier} ${amountAsString}`;
      }
    };
    var mapAmountSerializer = (serializer, identifier, decimals) => umiSerializers.mapSerializer(serializer, (value) => value.basisPoints > Number.MAX_SAFE_INTEGER ? value.basisPoints : Number(value.basisPoints), (value) => createAmount(value, identifier, decimals));
    exports2.absoluteAmount = absoluteAmount;
    exports2.addAmounts = addAmounts;
    exports2.amountToNumber = amountToNumber;
    exports2.amountToString = amountToString;
    exports2.assertAmount = assertAmount;
    exports2.assertSameAmounts = assertSameAmounts;
    exports2.assertSolAmount = assertSolAmount;
    exports2.compareAmounts = compareAmounts;
    exports2.createAmount = createAmount;
    exports2.createAmountFromDecimals = createAmountFromDecimals;
    exports2.displayAmount = displayAmount;
    exports2.divideAmount = divideAmount;
    exports2.isAmount = isAmount;
    exports2.isEqualToAmount = isEqualToAmount;
    exports2.isGreaterThanAmount = isGreaterThanAmount;
    exports2.isGreaterThanOrEqualToAmount = isGreaterThanOrEqualToAmount;
    exports2.isLessThanAmount = isLessThanAmount;
    exports2.isLessThanOrEqualToAmount = isLessThanOrEqualToAmount;
    exports2.isNegativeAmount = isNegativeAmount;
    exports2.isPositiveAmount = isPositiveAmount;
    exports2.isSolAmount = isSolAmount;
    exports2.isZeroAmount = isZeroAmount;
    exports2.lamports = lamports;
    exports2.mapAmountSerializer = mapAmountSerializer;
    exports2.multiplyAmount = multiplyAmount;
    exports2.percentAmount = percentAmount;
    exports2.sameAmounts = sameAmounts;
    exports2.sol = sol;
    exports2.subtractAmounts = subtractAmounts;
    exports2.tokenAmount = tokenAmount;
    exports2.usd = usd;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Cluster.cjs
var require_Cluster = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Cluster.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var MAINNET_BETA_DOMAINS = ["api.mainnet-beta.solana.com", "ssc-dao.genesysgo.net"];
    var DEVNET_DOMAINS = ["api.devnet.solana.com", "psytrbhymqlkfrhudd.dev.genesysgo.net"];
    var TESTNET_DOMAINS = ["api.testnet.solana.com"];
    var LOCALNET_DOMAINS = ["localhost", "127.0.0.1"];
    var resolveClusterFromEndpoint = (endpoint) => {
      const domain = new URL(endpoint).hostname;
      if (MAINNET_BETA_DOMAINS.includes(domain)) return "mainnet-beta";
      if (DEVNET_DOMAINS.includes(domain)) return "devnet";
      if (TESTNET_DOMAINS.includes(domain)) return "testnet";
      if (LOCALNET_DOMAINS.includes(domain)) return "localnet";
      if (endpoint.includes("mainnet")) return "mainnet-beta";
      if (endpoint.includes("devnet")) return "devnet";
      if (endpoint.includes("testnet")) return "testnet";
      if (endpoint.includes("local")) return "localnet";
      return "custom";
    };
    exports2.resolveClusterFromEndpoint = resolveClusterFromEndpoint;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/InterfaceImplementationMissingError.cjs
var require_InterfaceImplementationMissingError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/InterfaceImplementationMissingError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var SdkError = require_SdkError();
    var InterfaceImplementationMissingError = class extends SdkError.SdkError {
      constructor(interfaceName, contextVariable) {
        const interfaceBasename = interfaceName.replace(/Interface$/, "");
        const message = `Tried using ${interfaceName} but no implementation of that interface was found. Make sure an implementation is registered, e.g. via "context.${contextVariable} = new My${interfaceBasename}();".`;
        super(message);
        __publicField(this, "name", "InterfaceImplementationMissingError");
      }
    };
    exports2.InterfaceImplementationMissingError = InterfaceImplementationMissingError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/DownloaderInterface.cjs
var require_DownloaderInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/DownloaderInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullDownloader() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("DownloaderInterface", "downloader");
      };
      return {
        download: errorHandler,
        downloadJson: errorHandler
      };
    }
    exports2.createNullDownloader = createNullDownloader;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/EddsaInterface.cjs
var require_EddsaInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/EddsaInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullEddsa() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("EddsaInterface", "eddsa");
      };
      return {
        generateKeypair: errorHandler,
        createKeypairFromSecretKey: errorHandler,
        createKeypairFromSeed: errorHandler,
        createKeypairFromFile: errorHandler,
        createKeypairFromSolanaConfig: errorHandler,
        isOnCurve: errorHandler,
        findPda: errorHandler,
        sign: errorHandler,
        verify: errorHandler
      };
    }
    exports2.createNullEddsa = createNullEddsa;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/HttpInterface.cjs
var require_HttpInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/HttpInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullHttp() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("HttpInterface", "http");
      };
      return {
        send: errorHandler
      };
    }
    exports2.createNullHttp = createNullHttp;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/ProgramRepositoryInterface.cjs
var require_ProgramRepositoryInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/ProgramRepositoryInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullProgramRepository() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("ProgramRepositoryInterface", "programs");
      };
      return {
        has: errorHandler,
        get: errorHandler,
        getPublicKey: errorHandler,
        all: errorHandler,
        add: errorHandler,
        bind: errorHandler,
        unbind: errorHandler,
        clone: errorHandler,
        resolveError: errorHandler
      };
    }
    exports2.createNullProgramRepository = createNullProgramRepository;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/RpcInterface.cjs
var require_RpcInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/RpcInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullRpc() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("RpcInterface", "rpc");
      };
      return {
        getEndpoint: errorHandler,
        getCluster: errorHandler,
        getAccount: errorHandler,
        getAccounts: errorHandler,
        getProgramAccounts: errorHandler,
        getBlockTime: errorHandler,
        getBalance: errorHandler,
        getRent: errorHandler,
        getSlot: errorHandler,
        getGenesisHash: errorHandler,
        getLatestBlockhash: errorHandler,
        getTransaction: errorHandler,
        getSignatureStatuses: errorHandler,
        accountExists: errorHandler,
        airdrop: errorHandler,
        call: errorHandler,
        sendTransaction: errorHandler,
        simulateTransaction: errorHandler,
        confirmTransaction: errorHandler
      };
    }
    exports2.createNullRpc = createNullRpc;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/SerializerInterface.cjs
var require_SerializerInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/SerializerInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullSerializer() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("SerializerInterface", "serializer");
      };
      return {
        tuple: errorHandler,
        array: errorHandler,
        map: errorHandler,
        set: errorHandler,
        option: errorHandler,
        nullable: errorHandler,
        struct: errorHandler,
        enum: errorHandler,
        dataEnum: errorHandler,
        string: errorHandler,
        bool: errorHandler,
        unit: errorHandler,
        u8: errorHandler,
        u16: errorHandler,
        u32: errorHandler,
        u64: errorHandler,
        u128: errorHandler,
        i8: errorHandler,
        i16: errorHandler,
        i32: errorHandler,
        i64: errorHandler,
        i128: errorHandler,
        f32: errorHandler,
        f64: errorHandler,
        bytes: errorHandler,
        publicKey: errorHandler
      };
    }
    exports2.createNullSerializer = createNullSerializer;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/utils/arrays.cjs
var require_arrays = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/utils/arrays.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var chunk = (array, chunkSize) => array.reduce((chunks, item, index) => {
      const chunkIndex = Math.floor(index / chunkSize);
      if (!chunks[chunkIndex]) {
        chunks[chunkIndex] = [];
      }
      chunks[chunkIndex].push(item);
      return chunks;
    }, []);
    var zipMap = (left, right, fn) => left.map((t, index) => fn(t, right?.[index] ?? null, index));
    var uniqueBy = (array, fn) => array.reduce((acc, v) => {
      if (!acc.some((x) => fn(v, x))) acc.push(v);
      return acc;
    }, []);
    exports2.chunk = chunk;
    exports2.uniqueBy = uniqueBy;
    exports2.zipMap = zipMap;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Signer.cjs
var require_Signer = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Signer.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var arrays = require_arrays();
    var signTransaction = async (transaction, signers) => signers.reduce(async (promise, signer) => {
      const unsigned = await promise;
      return signer.signTransaction(unsigned);
    }, Promise.resolve(transaction));
    var signAllTransactions = async (transactionsWithSigners) => {
      const transactions = transactionsWithSigners.map((item) => item.transaction);
      const signersWithTransactions = transactionsWithSigners.reduce((all, {
        signers
      }, index) => {
        signers.forEach((signer) => {
          const item = all.find((item2) => item2.signer.publicKey === signer.publicKey);
          if (item) {
            item.indices.push(index);
          } else {
            all.push({
              signer,
              indices: [index]
            });
          }
        });
        return all;
      }, []);
      return signersWithTransactions.reduce(async (promise, {
        signer,
        indices
      }) => {
        const transactions2 = await promise;
        if (indices.length === 1) {
          const unsigned2 = transactions2[indices[0]];
          transactions2[indices[0]] = await signer.signTransaction(unsigned2);
          return transactions2;
        }
        const unsigned = indices.map((index) => transactions2[index]);
        const signed = await signer.signAllTransactions(unsigned);
        indices.forEach((index, position) => {
          transactions2[index] = signed[position];
        });
        return transactions2;
      }, Promise.resolve(transactions));
    };
    var isSigner = (value) => typeof value === "object" && "publicKey" in value && "signMessage" in value;
    var uniqueSigners = (signers) => arrays.uniqueBy(signers, (a, b) => a.publicKey === b.publicKey);
    var createNoopSigner = (publicKey2) => ({
      publicKey: publicKey2,
      async signMessage(message) {
        return message;
      },
      async signTransaction(transaction) {
        return transaction;
      },
      async signAllTransactions(transactions) {
        return transactions;
      }
    });
    function createNullSigner() {
      const error = new Error("Trying to use a NullSigner. Did you forget to set a Signer on your Umi instance? See the `signerIdentity` method for more information.");
      const errorHandler = () => {
        throw error;
      };
      return {
        get publicKey() {
          throw error;
        },
        signMessage: errorHandler,
        signTransaction: errorHandler,
        signAllTransactions: errorHandler
      };
    }
    exports2.createNoopSigner = createNoopSigner;
    exports2.createNullSigner = createNullSigner;
    exports2.isSigner = isSigner;
    exports2.signAllTransactions = signAllTransactions;
    exports2.signTransaction = signTransaction;
    exports2.uniqueSigners = uniqueSigners;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/TransactionFactoryInterface.cjs
var require_TransactionFactoryInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/TransactionFactoryInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullTransactionFactory() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("TransactionFactoryInterface", "transactions");
      };
      return {
        create: errorHandler,
        serialize: errorHandler,
        deserialize: errorHandler,
        serializeMessage: errorHandler,
        deserializeMessage: errorHandler
      };
    }
    exports2.createNullTransactionFactory = createNullTransactionFactory;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/UploaderInterface.cjs
var require_UploaderInterface = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/UploaderInterface.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    function createNullUploader() {
      const errorHandler = () => {
        throw new InterfaceImplementationMissingError.InterfaceImplementationMissingError("UploaderInterface", "uploader");
      };
      return {
        upload: errorHandler,
        uploadJson: errorHandler,
        getUploadPrice: errorHandler
      };
    }
    exports2.createNullUploader = createNullUploader;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Context.cjs
var require_Context = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Context.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var DownloaderInterface = require_DownloaderInterface();
    var EddsaInterface = require_EddsaInterface();
    var HttpInterface = require_HttpInterface();
    var ProgramRepositoryInterface = require_ProgramRepositoryInterface();
    var RpcInterface = require_RpcInterface();
    var SerializerInterface = require_SerializerInterface();
    var Signer = require_Signer();
    var TransactionFactoryInterface = require_TransactionFactoryInterface();
    var UploaderInterface = require_UploaderInterface();
    var createNullContext = () => ({
      downloader: DownloaderInterface.createNullDownloader(),
      eddsa: EddsaInterface.createNullEddsa(),
      http: HttpInterface.createNullHttp(),
      identity: Signer.createNullSigner(),
      payer: Signer.createNullSigner(),
      programs: ProgramRepositoryInterface.createNullProgramRepository(),
      rpc: RpcInterface.createNullRpc(),
      serializer: SerializerInterface.createNullSerializer(),
      transactions: TransactionFactoryInterface.createNullTransactionFactory(),
      uploader: UploaderInterface.createNullUploader()
    });
    exports2.createNullContext = createNullContext;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/DateTime.cjs
var require_DateTime = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/DateTime.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializers = require_cjs6();
    var BigInt2 = require_BigInt();
    var dateTime = (value) => {
      if (typeof value === "string" || isDateObject(value)) {
        const date = new Date(value);
        const timestamp = Math.floor(date.getTime() / 1e3);
        return BigInt2.createBigInt(timestamp);
      }
      return BigInt2.createBigInt(value);
    };
    var now = () => dateTime(new Date(Date.now()));
    var isDateObject = (value) => Object.prototype.toString.call(value) === "[object Date]";
    var formatDateTime = (value, locales = "en-US", options = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZone: "UTC"
    }) => {
      const date = new Date(Number(value * 1000n));
      return date.toLocaleDateString(locales, options);
    };
    var mapDateTimeSerializer = (serializer) => umiSerializers.mapSerializer(serializer, (value) => {
      const date = dateTime(value);
      return date > Number.MAX_SAFE_INTEGER ? date : Number(date);
    }, (value) => dateTime(value));
    exports2.dateTime = dateTime;
    exports2.formatDateTime = formatDateTime;
    exports2.mapDateTimeSerializer = mapDateTimeSerializer;
    exports2.now = now;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/utils/randomStrings.cjs
var require_randomStrings = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/utils/randomStrings.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var generateRandomString = (length = 20, alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") => {
      let result = "";
      const alphabetLength = alphabet.length;
      for (let i = 0; i < length; i += 1) {
        result += alphabet.charAt(Math.floor(Math.random() * alphabetLength));
      }
      return result;
    };
    exports2.generateRandomString = generateRandomString;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/GenericFile.cjs
var require_GenericFile = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/GenericFile.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializers = require_cjs6();
    var randomStrings = require_randomStrings();
    var createGenericFile = (content, fileName, options = {}) => ({
      buffer: typeof content === "string" ? umiSerializers.utf8.serialize(content) : content,
      fileName,
      displayName: options.displayName ?? fileName,
      uniqueName: options.uniqueName ?? randomStrings.generateRandomString(),
      contentType: options.contentType ?? null,
      extension: options.extension ?? getExtension(fileName),
      tags: options.tags ?? []
    });
    var createGenericFileFromBrowserFile = async (browserFile, options = {}) => createGenericFile(new Uint8Array(await browserFile.arrayBuffer()), browserFile.name, options);
    var createGenericFileFromJson = (json, fileName = "inline.json", options = {}) => createGenericFile(JSON.stringify(json), fileName, {
      contentType: "application/json",
      ...options
    });
    var createBrowserFileFromGenericFile = (file) => new File([file.buffer], file.fileName);
    var parseJsonFromGenericFile = (file) => JSON.parse(new TextDecoder().decode(file.buffer));
    var getBytesFromGenericFiles = (...files) => files.reduce((acc, file) => acc + file.buffer.byteLength, 0);
    var isGenericFile = (file) => file != null && typeof file === "object" && "buffer" in file && "fileName" in file && "displayName" in file && "uniqueName" in file && "contentType" in file && "extension" in file && "tags" in file;
    var getExtension = (fileName) => {
      const lastDotIndex = fileName.lastIndexOf(".");
      return lastDotIndex < 0 ? null : fileName.slice(lastDotIndex + 1);
    };
    exports2.createBrowserFileFromGenericFile = createBrowserFileFromGenericFile;
    exports2.createGenericFile = createGenericFile;
    exports2.createGenericFileFromBrowserFile = createGenericFileFromBrowserFile;
    exports2.createGenericFileFromJson = createGenericFileFromJson;
    exports2.getBytesFromGenericFiles = getBytesFromGenericFiles;
    exports2.isGenericFile = isGenericFile;
    exports2.parseJsonFromGenericFile = parseJsonFromGenericFile;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/GpaBuilder.cjs
var require_GpaBuilder = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/GpaBuilder.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiPublicKeys = require_cjs4();
    var umiSerializers = require_cjs6();
    var SdkError = require_SdkError();
    var GpaBuilder = class _GpaBuilder {
      constructor(context, programId, options = {}) {
        this.context = context;
        this.programId = programId;
        this.options = options;
      }
      reset() {
        return new _GpaBuilder(this.context, this.programId, {
          fields: this.options.fields,
          deserializeCallback: this.options.deserializeCallback
        });
      }
      registerFields(fields) {
        return new _GpaBuilder(this.context, this.programId, {
          ...this.options,
          fields
        });
      }
      registerFieldsFromStruct(structFields) {
        let offset = 0;
        const fields = structFields.reduce((acc, [field, serializer]) => {
          acc[field] = [offset, serializer];
          offset = offset === null || serializer.fixedSize === null ? null : offset + serializer.fixedSize;
          return acc;
        }, {});
        return this.registerFields(fields);
      }
      deserializeUsing(callback) {
        return new _GpaBuilder(this.context, this.programId, {
          ...this.options,
          deserializeCallback: callback
        });
      }
      slice(offset, length) {
        return new _GpaBuilder(this.context, this.programId, {
          ...this.options,
          dataSlice: {
            offset,
            length
          }
        });
      }
      sliceField(field, offset) {
        const [effectiveOffset, serializer] = this.getField(field, offset);
        if (!serializer.fixedSize) {
          throw new SdkError.SdkError(`Cannot slice field [${field}] because its size is variable.`);
        }
        return this.slice(effectiveOffset, serializer.fixedSize);
      }
      withoutData() {
        return this.slice(0, 0);
      }
      addFilter(...filters) {
        return new _GpaBuilder(this.context, this.programId, {
          ...this.options,
          filters: [...this.options.filters ?? [], ...filters]
        });
      }
      where(offset, data) {
        let bytes;
        if (typeof data === "string") {
          bytes = umiSerializers.base58.serialize(data);
        } else if (typeof data === "number" || typeof data === "bigint" || typeof data === "boolean") {
          bytes = umiSerializers.base10.serialize(BigInt(data).toString());
        } else {
          bytes = new Uint8Array(data);
        }
        return this.addFilter({
          memcmp: {
            offset,
            bytes
          }
        });
      }
      whereField(field, data, offset) {
        const [effectiveOffset, serializer] = this.getField(field, offset);
        return this.where(effectiveOffset, serializer.serialize(data));
      }
      whereSize(dataSize) {
        return this.addFilter({
          dataSize
        });
      }
      sortUsing(callback) {
        return new _GpaBuilder(this.context, this.programId, {
          ...this.options,
          sortCallback: callback
        });
      }
      async get(options = {}) {
        const accounts = await this.context.rpc.getProgramAccounts(this.programId, {
          ...options,
          dataSlice: options.dataSlice ?? this.options.dataSlice,
          filters: [...options.filters ?? [], ...this.options.filters ?? []]
        });
        if (this.options.sortCallback) {
          accounts.sort(this.options.sortCallback);
        }
        return accounts;
      }
      async getAndMap(callback, options = {}) {
        return (await this.get(options)).map(callback);
      }
      async getDeserialized(options = {}) {
        const rpcAccounts = await this.get(options);
        if (!this.options.deserializeCallback) return rpcAccounts;
        return rpcAccounts.map(this.options.deserializeCallback);
      }
      async getPublicKeys(options = {}) {
        return this.getAndMap((account) => account.publicKey, options);
      }
      async getDataAsPublicKeys(options = {}) {
        return this.getAndMap((account) => {
          try {
            return umiPublicKeys.publicKey(account.data);
          } catch (error) {
            const message = `Following a getProgramAccount call, you are trying to use an account's data (or a slice of it) as a public key. However, we encountered an account [${account.publicKey}] whose data [base64=${umiSerializers.base64.deserialize(account.data)}] is not a valid public key.`;
            throw new SdkError.SdkError(message);
          }
        }, options);
      }
      getField(fieldName, forcedOffset) {
        if (!this.options.fields) {
          throw new SdkError.SdkError("Fields are not defined in this GpaBuilder.");
        }
        const field = this.options.fields[fieldName];
        if (!field) {
          throw new SdkError.SdkError(`Field [${fieldName}] is not defined in this GpaBuilder.`);
        }
        const [offset, serializer] = field;
        if (forcedOffset !== void 0) {
          return [forcedOffset, serializer];
        }
        if (offset === null) {
          throw new SdkError.SdkError(`Field [${fieldName}] does not have a fixed offset. This is likely because it is not in the fixed part of the account's data. In other words, it is located after a field of variable length which means we cannot find a fixed offset for the filter. You may go around this by providing an offset explicitly.`);
        }
        return [offset, serializer];
      }
    };
    var gpaBuilder = (context, programId) => new GpaBuilder(context, programId);
    exports2.GpaBuilder = GpaBuilder;
    exports2.gpaBuilder = gpaBuilder;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/HttpRequest.cjs
var require_HttpRequest = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/HttpRequest.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var request = () => new HttpRequestBuilder({
      method: "get",
      data: void 0,
      headers: {},
      url: ""
    });
    var HttpRequestBuilder = class _HttpRequestBuilder {
      constructor(request2) {
        this.request = request2;
      }
      asJson() {
        return this.contentType("application/json");
      }
      asMultipart() {
        return this.contentType("multipart/form-data");
      }
      asForm() {
        return this.contentType("application/x-www-form-urlencoded");
      }
      accept(contentType) {
        return this.withHeader("accept", contentType);
      }
      contentType(contentType) {
        return this.withHeader("content-type", contentType);
      }
      userAgent(userAgent) {
        return this.withHeader("user-agent", userAgent);
      }
      withToken(token, type = "Bearer") {
        return this.withHeader("authorization", `${type} ${token}`);
      }
      withHeader(key, value) {
        return this.withHeaders({
          [key]: value
        });
      }
      withHeaders(headers) {
        return new _HttpRequestBuilder({
          ...this.request,
          headers: {
            ...this.request.headers,
            ...headers
          }
        });
      }
      dontFollowRedirects() {
        return this.followRedirects(0);
      }
      followRedirects(maxRedirects) {
        return new _HttpRequestBuilder({
          ...this.request,
          maxRedirects
        });
      }
      withoutTimeout() {
        return this.withTimeout(0);
      }
      withTimeout(timeout) {
        return new _HttpRequestBuilder({
          ...this.request,
          timeout
        });
      }
      withAbortSignal(signal) {
        return new _HttpRequestBuilder({
          ...this.request,
          signal
        });
      }
      withEndpoint(method, url) {
        return new _HttpRequestBuilder({
          ...this.request,
          method,
          url
        });
      }
      withParams(params) {
        const url = new URL(this.request.url);
        const newSearch = new URLSearchParams(params);
        const search = new URLSearchParams(url.searchParams);
        [...newSearch.entries()].forEach(([key, val]) => {
          search.append(key, val);
        });
        url.search = search.toString();
        return new _HttpRequestBuilder({
          ...this.request,
          url: url.toString()
        });
      }
      withData(data) {
        return new _HttpRequestBuilder({
          ...this.request,
          data
        });
      }
      get(url) {
        return this.withEndpoint("get", url);
      }
      post(url) {
        return this.withEndpoint("post", url);
      }
      put(url) {
        return this.withEndpoint("put", url);
      }
      patch(url) {
        return this.withEndpoint("patch", url);
      }
      delete(url) {
        return this.withEndpoint("delete", url);
      }
      get method() {
        return this.request.method;
      }
      get url() {
        return this.request.url;
      }
      get data() {
        return this.request.data;
      }
      get headers() {
        return this.request.headers;
      }
      get maxRedirects() {
        return this.request.maxRedirects;
      }
      get timeout() {
        return this.request.timeout;
      }
      get signal() {
        return this.request.signal;
      }
    };
    exports2.HttpRequestBuilder = HttpRequestBuilder;
    exports2.request = request;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Transaction.cjs
var require_Transaction = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Transaction.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var TRANSACTION_SIZE_LIMIT = 1232;
    var addTransactionSignature = (transaction, signature, signerPublicKey) => {
      const maxSigners = transaction.message.header.numRequiredSignatures;
      const signerPublicKeys = transaction.message.accounts.slice(0, maxSigners);
      const signerIndex = signerPublicKeys.findIndex((key) => key === signerPublicKey);
      if (signerIndex < 0) {
        throw new Error("The provided signer is not required to sign this transaction.");
      }
      const newSignatures = [...transaction.signatures];
      newSignatures[signerIndex] = signature;
      return {
        ...transaction,
        signatures: newSignatures
      };
    };
    exports2.TRANSACTION_SIZE_LIMIT = TRANSACTION_SIZE_LIMIT;
    exports2.addTransactionSignature = addTransactionSignature;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Keypair.cjs
var require_Keypair = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Keypair.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Transaction = require_Transaction();
    var generateSigner = (context) => createSignerFromKeypair(context, context.eddsa.generateKeypair());
    var createSignerFromKeypair = (context, keypair) => ({
      publicKey: keypair.publicKey,
      secretKey: keypair.secretKey,
      async signMessage(message) {
        return context.eddsa.sign(message, keypair);
      },
      async signTransaction(transaction) {
        const message = transaction.serializedMessage;
        const signature = context.eddsa.sign(message, keypair);
        return Transaction.addTransactionSignature(transaction, signature, keypair.publicKey);
      },
      async signAllTransactions(transactions) {
        return Promise.all(transactions.map((transaction) => this.signTransaction(transaction)));
      }
    });
    var isKeypairSigner = (signer) => signer.secretKey !== void 0;
    exports2.createSignerFromKeypair = createSignerFromKeypair;
    exports2.generateSigner = generateSigner;
    exports2.isKeypairSigner = isKeypairSigner;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Program.cjs
var require_Program = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Program.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var isErrorWithLogs = (error) => error instanceof Error && "logs" in error;
    exports2.isErrorWithLogs = isErrorWithLogs;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/SignerPlugins.cjs
var require_SignerPlugins = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/SignerPlugins.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Keypair = require_Keypair();
    var signerIdentity = (signer, setPayer = true) => ({
      install(umi) {
        umi.identity = signer;
        if (setPayer) {
          umi.payer = signer;
        }
      }
    });
    var signerPayer = (signer) => ({
      install(umi) {
        umi.payer = signer;
      }
    });
    var generatedSignerIdentity = (setPayer = true) => ({
      install(umi) {
        const signer = Keypair.generateSigner(umi);
        umi.use(signerIdentity(signer, setPayer));
      }
    });
    var generatedSignerPayer = () => ({
      install(umi) {
        const signer = Keypair.generateSigner(umi);
        umi.use(signerPayer(signer));
      }
    });
    var keypairIdentity = (keypair, setPayer = true) => ({
      install(umi) {
        const signer = Keypair.createSignerFromKeypair(umi, keypair);
        umi.use(signerIdentity(signer, setPayer));
      }
    });
    var keypairPayer = (keypair) => ({
      install(umi) {
        const signer = Keypair.createSignerFromKeypair(umi, keypair);
        umi.use(signerPayer(signer));
      }
    });
    exports2.generatedSignerIdentity = generatedSignerIdentity;
    exports2.generatedSignerPayer = generatedSignerPayer;
    exports2.keypairIdentity = keypairIdentity;
    exports2.keypairPayer = keypairPayer;
    exports2.signerIdentity = signerIdentity;
    exports2.signerPayer = signerPayer;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/TransactionBuilder.cjs
var require_TransactionBuilder = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/TransactionBuilder.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Signer = require_Signer();
    var Transaction = require_Transaction();
    var SdkError = require_SdkError();
    var TransactionBuilder = class _TransactionBuilder {
      constructor(items = [], options = {}) {
        this.items = items;
        this.options = options;
      }
      empty() {
        return new _TransactionBuilder([], this.options);
      }
      setItems(input) {
        return new _TransactionBuilder(this.parseItems(input), this.options);
      }
      prepend(input) {
        return new _TransactionBuilder([...this.parseItems(input), ...this.items], this.options);
      }
      append(input) {
        return new _TransactionBuilder([...this.items, ...this.parseItems(input)], this.options);
      }
      add(input) {
        return this.append(input);
      }
      mapInstructions(fn) {
        return new _TransactionBuilder(this.items.map(fn), this.options);
      }
      addRemainingAccounts(accountMeta, instructionIndex) {
        instructionIndex = instructionIndex ?? this.items.length - 1;
        const metas = Array.isArray(accountMeta) ? accountMeta : [accountMeta];
        const extraKeys = metas.map((meta) => "pubkey" in meta ? meta : {
          pubkey: meta.signer.publicKey,
          isSigner: true,
          isWritable: meta.isWritable
        });
        const extraSigners = metas.flatMap((meta) => "pubkey" in meta ? [] : [meta.signer]);
        return this.mapInstructions((wrappedInstruction, index) => {
          if (index !== instructionIndex) return wrappedInstruction;
          const keys = [...wrappedInstruction.instruction.keys, ...extraKeys];
          return {
            ...wrappedInstruction,
            instruction: {
              ...wrappedInstruction.instruction,
              keys
            },
            signers: [...wrappedInstruction.signers, ...extraSigners]
          };
        });
      }
      splitByIndex(index) {
        return [new _TransactionBuilder(this.items.slice(0, index), this.options), new _TransactionBuilder(this.items.slice(index), this.options)];
      }
      /**
       * Split the builder into multiple builders, such that
       * each of them should fit in a single transaction.
       *
       * This method is unsafe for several reasons:
       * - Because transactions are atomic, splitting the builder
       *   into multiple transactions may cause undesired side effects.
       *   For example, if the first transaction succeeds but the second
       *   one fails, you may end up with an inconsistent account state.
       *   This is why it is recommended to manually split your transactions
       *   such that each of them is valid on its own.
       * - It can only split the instructions of the builder. Meaning that,
       *   if the builder has a single instruction that is too big to fit in
       *   a single transaction, it will not be able to split it.
       */
      unsafeSplitByTransactionSize(context) {
        return this.items.reduce((builders, item) => {
          const lastBuilder = builders.pop();
          const lastBuilderWithItem = lastBuilder.add(item);
          if (lastBuilderWithItem.fitsInOneTransaction(context)) {
            builders.push(lastBuilderWithItem);
          } else {
            builders.push(lastBuilder);
            builders.push(lastBuilder.empty().add(item));
          }
          return builders;
        }, [this.empty()]);
      }
      setFeePayer(feePayer) {
        return new _TransactionBuilder(this.items, {
          ...this.options,
          feePayer
        });
      }
      getFeePayer(context) {
        return this.options.feePayer ?? context.payer;
      }
      setVersion(version) {
        return new _TransactionBuilder(this.items, {
          ...this.options,
          version
        });
      }
      useLegacyVersion() {
        return this.setVersion("legacy");
      }
      useV0() {
        return this.setVersion(0);
      }
      setAddressLookupTables(addressLookupTables) {
        return new _TransactionBuilder(this.items, {
          ...this.options,
          addressLookupTables
        });
      }
      getBlockhash() {
        return typeof this.options.blockhash === "object" ? this.options.blockhash.blockhash : this.options.blockhash;
      }
      setBlockhash(blockhash) {
        return new _TransactionBuilder(this.items, {
          ...this.options,
          blockhash
        });
      }
      async setLatestBlockhash(context, options = {}) {
        return this.setBlockhash(await context.rpc.getLatestBlockhash(options));
      }
      getInstructions() {
        return this.items.map((item) => item.instruction);
      }
      getSigners(context) {
        return Signer.uniqueSigners([this.getFeePayer(context), ...this.items.flatMap((item) => item.signers)]);
      }
      getBytesCreatedOnChain() {
        return this.items.reduce((sum, item) => sum + item.bytesCreatedOnChain, 0);
      }
      async getRentCreatedOnChain(context) {
        return context.rpc.getRent(this.getBytesCreatedOnChain(), {
          includesHeaderBytes: true
        });
      }
      getTransactionSize(context) {
        return context.transactions.serialize(this.setBlockhash("11111111111111111111111111111111").build(context)).length;
      }
      minimumTransactionsRequired(context) {
        return Math.ceil(this.getTransactionSize(context) / Transaction.TRANSACTION_SIZE_LIMIT);
      }
      fitsInOneTransaction(context) {
        return this.minimumTransactionsRequired(context) === 1;
      }
      build(context) {
        const blockhash = this.getBlockhash();
        if (!blockhash) {
          throw new SdkError.SdkError("Setting a blockhash is required to build a transaction. Please use the `setBlockhash` or `setLatestBlockhash` methods.");
        }
        const input = {
          version: this.options.version ?? 0,
          payer: this.getFeePayer(context).publicKey,
          instructions: this.getInstructions(),
          blockhash
        };
        if (input.version === 0 && this.options.addressLookupTables) {
          input.addressLookupTables = this.options.addressLookupTables;
        }
        return context.transactions.create(input);
      }
      async buildWithLatestBlockhash(context, options = {}) {
        let builder = this;
        if (!this.options.blockhash) {
          builder = await this.setLatestBlockhash(context, options);
        }
        return builder.build(context);
      }
      async buildAndSign(context) {
        return Signer.signTransaction(await this.buildWithLatestBlockhash(context), this.getSigners(context));
      }
      async send(context, options = {}) {
        const transaction = await this.buildAndSign(context);
        return context.rpc.sendTransaction(transaction, options);
      }
      async confirm(context, signature, options = {}) {
        let builder = this;
        if (!this.options.blockhash) {
          builder = await this.setLatestBlockhash(context);
        }
        let strategy;
        if (options.strategy) {
          strategy = options.strategy;
        } else {
          const blockhash = typeof builder.options.blockhash === "object" ? builder.options.blockhash : await context.rpc.getLatestBlockhash();
          strategy = options.strategy ?? {
            type: "blockhash",
            ...blockhash
          };
        }
        return context.rpc.confirmTransaction(signature, {
          ...options,
          strategy
        });
      }
      async sendAndConfirm(context, options = {}) {
        let builder = this;
        if (!this.options.blockhash) {
          builder = await this.setLatestBlockhash(context);
        }
        const signature = await builder.send(context, options.send);
        const result = await builder.confirm(context, signature, options.confirm);
        return {
          signature,
          result
        };
      }
      parseItems(input) {
        return (Array.isArray(input) ? input : [input]).flatMap((item) => "items" in item ? item.items : [item]);
      }
    };
    var transactionBuilder = (items = []) => new TransactionBuilder(items);
    exports2.TransactionBuilder = TransactionBuilder;
    exports2.transactionBuilder = transactionBuilder;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/TransactionBuilderGroup.cjs
var require_TransactionBuilderGroup = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/TransactionBuilderGroup.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Signer = require_Signer();
    var TransactionBuilder = require_TransactionBuilder();
    var arrays = require_arrays();
    var TransactionBuilderGroup = class _TransactionBuilderGroup {
      constructor(builders = [], options = {}) {
        this.builders = builders;
        this.options = options;
      }
      prepend(builder) {
        const newBuilders = Array.isArray(builder) ? builder : [builder];
        return new _TransactionBuilderGroup([...newBuilders, ...this.builders], this.options);
      }
      append(builder) {
        const newBuilders = Array.isArray(builder) ? builder : [builder];
        return new _TransactionBuilderGroup([...this.builders, ...newBuilders], this.options);
      }
      add(builder) {
        return this.append(builder);
      }
      sequential() {
        return new _TransactionBuilderGroup(this.builders, {
          ...this.options,
          parallel: false
        });
      }
      parallel() {
        return new _TransactionBuilderGroup(this.builders, {
          ...this.options,
          parallel: true
        });
      }
      isParallel() {
        return this.options.parallel ?? false;
      }
      merge() {
        if (this.builders.length === 0) {
          return new TransactionBuilder.TransactionBuilder();
        }
        return this.builders.reduce((builder, next) => builder.add(next), this.builders[0].empty());
      }
      build(context) {
        return this.builders.map((builder) => builder.build(context));
      }
      async setLatestBlockhash(context) {
        const hasBlockhashlessBuilder = this.builders.some((builder) => !builder.options.blockhash);
        if (!hasBlockhashlessBuilder) return this;
        const blockhash = await context.rpc.getLatestBlockhash();
        return this.map((builder) => builder.options.blockhash ? builder : builder.setBlockhash(blockhash));
      }
      async buildWithLatestBlockhash(context) {
        return (await this.setLatestBlockhash(context)).build(context);
      }
      async buildAndSign(context) {
        const transactions = await this.buildWithLatestBlockhash(context);
        const signers = this.builders.map((builder) => builder.getSigners(context));
        return Signer.signAllTransactions(arrays.zipMap(transactions, signers, (transaction, txSigners) => ({
          transaction,
          signers: txSigners ?? []
        })));
      }
      async send(context, options = {}) {
        return this.runAll(await this.buildAndSign(context), async (tx) => context.rpc.sendTransaction(tx, options));
      }
      async sendAndConfirm(context, options = {}) {
        const blockhashWithExpiryBlockHeight = this.builders.find((builder) => typeof builder.options.blockhash === "object")?.options.blockhash;
        let strategy;
        if (options.confirm?.strategy) {
          strategy = options.confirm.strategy;
        } else {
          const blockhash = blockhashWithExpiryBlockHeight ?? await context.rpc.getLatestBlockhash();
          strategy = options.confirm?.strategy ?? {
            type: "blockhash",
            ...blockhash
          };
        }
        return this.runAll(await this.buildAndSign(context), async (tx) => {
          const signature = await context.rpc.sendTransaction(tx, options.send);
          const result = await context.rpc.confirmTransaction(signature, {
            ...options.confirm,
            strategy
          });
          return {
            signature,
            result
          };
        });
      }
      map(fn) {
        return new _TransactionBuilderGroup(this.builders.map(fn));
      }
      filter(fn) {
        return new _TransactionBuilderGroup(this.builders.filter(fn));
      }
      async runAll(array, fn) {
        if (this.isParallel()) {
          return Promise.all(array.map(fn));
        }
        return array.reduce(async (promise, ...args) => [...await promise, await fn(...args)], Promise.resolve([]));
      }
    };
    function transactionBuilderGroup(builders = []) {
      return new TransactionBuilderGroup(builders);
    }
    exports2.TransactionBuilderGroup = TransactionBuilderGroup;
    exports2.transactionBuilderGroup = transactionBuilderGroup;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/Umi.cjs
var require_Umi = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/Umi.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Context = require_Context();
    var createUmi = () => ({
      ...Context.createNullContext(),
      use(plugin) {
        plugin.install(this);
        return this;
      }
    });
    exports2.createUmi = createUmi;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/InvalidBaseStringError.cjs
var require_InvalidBaseStringError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/InvalidBaseStringError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var SdkError = require_SdkError();
    var InvalidBaseStringError = class extends SdkError.SdkError {
      constructor(value, base, cause) {
        const message = `Expected a string of base ${base}, got [${value}].`;
        super(message, cause);
        __publicField(this, "name", "InvalidBaseStringError");
      }
    };
    exports2.InvalidBaseStringError = InvalidBaseStringError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/errors/ProgramError.cjs
var require_ProgramError = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/errors/ProgramError.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var UmiError = require_UmiError();
    var ProgramError = class extends UmiError.UmiError {
      constructor(message, program, cause) {
        super(message, "program", `${program.name} [${program.publicKey}]`, cause);
        __publicField(this, "name", "ProgramError");
        this.program = program;
        this.logs = cause?.logs;
        if (this.logs) {
          this.message += `
Program Logs:
${this.logs.map((log) => `| ${log}`).join("\n")}
`;
        }
      }
    };
    exports2.ProgramError = ProgramError;
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/index.cjs
var require_cjs7 = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiOptions = require_cjs();
    var umiPublicKeys = require_cjs4();
    var serializersInternal = require_serializersInternal();
    var Account = require_Account();
    var Amount = require_Amount();
    var BigInt2 = require_BigInt();
    var Cluster = require_Cluster();
    var Context = require_Context();
    var DateTime = require_DateTime();
    var DownloaderInterface = require_DownloaderInterface();
    var EddsaInterface = require_EddsaInterface();
    var GenericFile = require_GenericFile();
    var GpaBuilder = require_GpaBuilder();
    var HttpInterface = require_HttpInterface();
    var HttpRequest = require_HttpRequest();
    var Keypair = require_Keypair();
    var Program4 = require_Program();
    var ProgramRepositoryInterface = require_ProgramRepositoryInterface();
    var RpcInterface = require_RpcInterface();
    var SerializerInterface = require_SerializerInterface();
    var Signer = require_Signer();
    var SignerPlugins = require_SignerPlugins();
    var Transaction = require_Transaction();
    var TransactionBuilder = require_TransactionBuilder();
    var TransactionBuilderGroup = require_TransactionBuilderGroup();
    var TransactionFactoryInterface = require_TransactionFactoryInterface();
    var Umi = require_Umi();
    var UploaderInterface = require_UploaderInterface();
    var AccountNotFoundError = require_AccountNotFoundError();
    var AmountMismatchError = require_AmountMismatchError();
    var InterfaceImplementationMissingError = require_InterfaceImplementationMissingError();
    var InvalidBaseStringError = require_InvalidBaseStringError();
    var ProgramError = require_ProgramError();
    var SdkError = require_SdkError();
    var UmiError = require_UmiError();
    var UnexpectedAccountError = require_UnexpectedAccountError();
    var UnexpectedAmountError = require_UnexpectedAmountError();
    var arrays = require_arrays();
    var randomStrings = require_randomStrings();
    exports2.Endian = serializersInternal.Endian;
    exports2.base10 = serializersInternal.base10;
    exports2.base16 = serializersInternal.base16;
    exports2.base58 = serializersInternal.base58;
    exports2.base64 = serializersInternal.base64;
    exports2.baseX = serializersInternal.baseX;
    exports2.bitArray = serializersInternal.bitArray;
    exports2.fixBytes = serializersInternal.fixBytes;
    exports2.fixSerializer = serializersInternal.fixSerializer;
    exports2.mapSerializer = serializersInternal.mapSerializer;
    exports2.mergeBytes = serializersInternal.mergeBytes;
    exports2.padBytes = serializersInternal.padBytes;
    exports2.padNullCharacters = serializersInternal.padNullCharacters;
    exports2.removeNullCharacters = serializersInternal.removeNullCharacters;
    exports2.reverseSerializer = serializersInternal.reverseSerializer;
    exports2.utf8 = serializersInternal.utf8;
    exports2.ACCOUNT_HEADER_SIZE = Account.ACCOUNT_HEADER_SIZE;
    exports2.assertAccountExists = Account.assertAccountExists;
    exports2.deserializeAccount = Account.deserializeAccount;
    exports2.absoluteAmount = Amount.absoluteAmount;
    exports2.addAmounts = Amount.addAmounts;
    exports2.amountToNumber = Amount.amountToNumber;
    exports2.amountToString = Amount.amountToString;
    exports2.assertAmount = Amount.assertAmount;
    exports2.assertSameAmounts = Amount.assertSameAmounts;
    exports2.assertSolAmount = Amount.assertSolAmount;
    exports2.compareAmounts = Amount.compareAmounts;
    exports2.createAmount = Amount.createAmount;
    exports2.createAmountFromDecimals = Amount.createAmountFromDecimals;
    exports2.displayAmount = Amount.displayAmount;
    exports2.divideAmount = Amount.divideAmount;
    exports2.isAmount = Amount.isAmount;
    exports2.isEqualToAmount = Amount.isEqualToAmount;
    exports2.isGreaterThanAmount = Amount.isGreaterThanAmount;
    exports2.isGreaterThanOrEqualToAmount = Amount.isGreaterThanOrEqualToAmount;
    exports2.isLessThanAmount = Amount.isLessThanAmount;
    exports2.isLessThanOrEqualToAmount = Amount.isLessThanOrEqualToAmount;
    exports2.isNegativeAmount = Amount.isNegativeAmount;
    exports2.isPositiveAmount = Amount.isPositiveAmount;
    exports2.isSolAmount = Amount.isSolAmount;
    exports2.isZeroAmount = Amount.isZeroAmount;
    exports2.lamports = Amount.lamports;
    exports2.mapAmountSerializer = Amount.mapAmountSerializer;
    exports2.multiplyAmount = Amount.multiplyAmount;
    exports2.percentAmount = Amount.percentAmount;
    exports2.sameAmounts = Amount.sameAmounts;
    exports2.sol = Amount.sol;
    exports2.subtractAmounts = Amount.subtractAmounts;
    exports2.tokenAmount = Amount.tokenAmount;
    exports2.usd = Amount.usd;
    exports2.createBigInt = BigInt2.createBigInt;
    exports2.resolveClusterFromEndpoint = Cluster.resolveClusterFromEndpoint;
    exports2.createNullContext = Context.createNullContext;
    exports2.dateTime = DateTime.dateTime;
    exports2.formatDateTime = DateTime.formatDateTime;
    exports2.mapDateTimeSerializer = DateTime.mapDateTimeSerializer;
    exports2.now = DateTime.now;
    exports2.createNullDownloader = DownloaderInterface.createNullDownloader;
    exports2.createNullEddsa = EddsaInterface.createNullEddsa;
    exports2.createBrowserFileFromGenericFile = GenericFile.createBrowserFileFromGenericFile;
    exports2.createGenericFile = GenericFile.createGenericFile;
    exports2.createGenericFileFromBrowserFile = GenericFile.createGenericFileFromBrowserFile;
    exports2.createGenericFileFromJson = GenericFile.createGenericFileFromJson;
    exports2.getBytesFromGenericFiles = GenericFile.getBytesFromGenericFiles;
    exports2.isGenericFile = GenericFile.isGenericFile;
    exports2.parseJsonFromGenericFile = GenericFile.parseJsonFromGenericFile;
    exports2.GpaBuilder = GpaBuilder.GpaBuilder;
    exports2.gpaBuilder = GpaBuilder.gpaBuilder;
    exports2.createNullHttp = HttpInterface.createNullHttp;
    exports2.HttpRequestBuilder = HttpRequest.HttpRequestBuilder;
    exports2.request = HttpRequest.request;
    exports2.createSignerFromKeypair = Keypair.createSignerFromKeypair;
    exports2.generateSigner = Keypair.generateSigner;
    exports2.isKeypairSigner = Keypair.isKeypairSigner;
    exports2.isErrorWithLogs = Program4.isErrorWithLogs;
    exports2.createNullProgramRepository = ProgramRepositoryInterface.createNullProgramRepository;
    exports2.createNullRpc = RpcInterface.createNullRpc;
    exports2.createNullSerializer = SerializerInterface.createNullSerializer;
    exports2.createNoopSigner = Signer.createNoopSigner;
    exports2.createNullSigner = Signer.createNullSigner;
    exports2.isSigner = Signer.isSigner;
    exports2.signAllTransactions = Signer.signAllTransactions;
    exports2.signTransaction = Signer.signTransaction;
    exports2.uniqueSigners = Signer.uniqueSigners;
    exports2.generatedSignerIdentity = SignerPlugins.generatedSignerIdentity;
    exports2.generatedSignerPayer = SignerPlugins.generatedSignerPayer;
    exports2.keypairIdentity = SignerPlugins.keypairIdentity;
    exports2.keypairPayer = SignerPlugins.keypairPayer;
    exports2.signerIdentity = SignerPlugins.signerIdentity;
    exports2.signerPayer = SignerPlugins.signerPayer;
    exports2.TRANSACTION_SIZE_LIMIT = Transaction.TRANSACTION_SIZE_LIMIT;
    exports2.addTransactionSignature = Transaction.addTransactionSignature;
    exports2.TransactionBuilder = TransactionBuilder.TransactionBuilder;
    exports2.transactionBuilder = TransactionBuilder.transactionBuilder;
    exports2.TransactionBuilderGroup = TransactionBuilderGroup.TransactionBuilderGroup;
    exports2.transactionBuilderGroup = TransactionBuilderGroup.transactionBuilderGroup;
    exports2.createNullTransactionFactory = TransactionFactoryInterface.createNullTransactionFactory;
    exports2.createUmi = Umi.createUmi;
    exports2.createNullUploader = UploaderInterface.createNullUploader;
    exports2.AccountNotFoundError = AccountNotFoundError.AccountNotFoundError;
    exports2.AmountMismatchError = AmountMismatchError.AmountMismatchError;
    exports2.InterfaceImplementationMissingError = InterfaceImplementationMissingError.InterfaceImplementationMissingError;
    exports2.InvalidBaseStringError = InvalidBaseStringError.InvalidBaseStringError;
    exports2.ProgramError = ProgramError.ProgramError;
    exports2.SdkError = SdkError.SdkError;
    exports2.UmiError = UmiError.UmiError;
    exports2.UnexpectedAccountError = UnexpectedAccountError.UnexpectedAccountError;
    exports2.UnexpectedAmountError = UnexpectedAmountError.UnexpectedAmountError;
    exports2.chunk = arrays.chunk;
    exports2.uniqueBy = arrays.uniqueBy;
    exports2.zipMap = arrays.zipMap;
    exports2.generateRandomString = randomStrings.generateRandomString;
    Object.keys(umiOptions).forEach(function(k) {
      if (k !== "default" && !exports2.hasOwnProperty(k)) Object.defineProperty(exports2, k, {
        enumerable: true,
        get: function() {
          return umiOptions[k];
        }
      });
    });
    Object.keys(umiPublicKeys).forEach(function(k) {
      if (k !== "default" && !exports2.hasOwnProperty(k)) Object.defineProperty(exports2, k, {
        enumerable: true,
        get: function() {
          return umiPublicKeys[k];
        }
      });
    });
  }
});

// ../node_modules/@metaplex-foundation/umi/dist/cjs/serializers.cjs
var require_serializers = __commonJS({
  "../node_modules/@metaplex-foundation/umi/dist/cjs/serializers.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var umiSerializers = require_cjs6();
    Object.keys(umiSerializers).forEach(function(k) {
      if (k !== "default" && !exports2.hasOwnProperty(k)) Object.defineProperty(exports2, k, {
        enumerable: true,
        get: function() {
          return umiSerializers[k];
        }
      });
    });
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/assetSigner.js
var require_assetSigner = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/assetSigner.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.safeFetchAssetSignerFromSeeds = exports2.fetchAssetSignerFromSeeds = exports2.findAssetSignerPda = exports2.getAssetSignerSize = exports2.getAssetSignerGpaBuilder = exports2.safeFetchAllAssetSigner = exports2.fetchAllAssetSigner = exports2.safeFetchAssetSigner = exports2.fetchAssetSigner = exports2.deserializeAssetSigner = exports2.getAssetSignerAccountDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    function getAssetSignerAccountDataSerializer() {
      return (0, serializers_1.struct)([["data", (0, serializers_1.bytes)()]], {
        description: "AssetSignerAccountData"
      });
    }
    exports2.getAssetSignerAccountDataSerializer = getAssetSignerAccountDataSerializer;
    function deserializeAssetSigner(rawAccount) {
      return (0, umi_1.deserializeAccount)(rawAccount, getAssetSignerAccountDataSerializer());
    }
    exports2.deserializeAssetSigner = deserializeAssetSigner;
    async function fetchAssetSigner(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      (0, umi_1.assertAccountExists)(maybeAccount, "AssetSigner");
      return deserializeAssetSigner(maybeAccount);
    }
    exports2.fetchAssetSigner = fetchAssetSigner;
    async function safeFetchAssetSigner(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      return maybeAccount.exists ? deserializeAssetSigner(maybeAccount) : null;
    }
    exports2.safeFetchAssetSigner = safeFetchAssetSigner;
    async function fetchAllAssetSigner(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.map((maybeAccount) => {
        (0, umi_1.assertAccountExists)(maybeAccount, "AssetSigner");
        return deserializeAssetSigner(maybeAccount);
      });
    }
    exports2.fetchAllAssetSigner = fetchAllAssetSigner;
    async function safeFetchAllAssetSigner(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.filter((maybeAccount) => maybeAccount.exists).map((maybeAccount) => deserializeAssetSigner(maybeAccount));
    }
    exports2.safeFetchAllAssetSigner = safeFetchAllAssetSigner;
    function getAssetSignerGpaBuilder(context) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      return (0, umi_1.gpaBuilder)(context, programId).registerFields({ data: [0, (0, serializers_1.bytes)()] }).deserializeUsing((account) => deserializeAssetSigner(account));
    }
    exports2.getAssetSignerGpaBuilder = getAssetSignerGpaBuilder;
    function getAssetSignerSize() {
      return 0;
    }
    exports2.getAssetSignerSize = getAssetSignerSize;
    function findAssetSignerPda(context, seeds) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      return context.eddsa.findPda(programId, [
        (0, serializers_1.string)({ size: "variable" }).serialize("mpl-core-execute"),
        (0, serializers_1.publicKey)().serialize(seeds.asset)
      ]);
    }
    exports2.findAssetSignerPda = findAssetSignerPda;
    async function fetchAssetSignerFromSeeds(context, seeds, options) {
      return fetchAssetSigner(context, findAssetSignerPda(context, seeds), options);
    }
    exports2.fetchAssetSignerFromSeeds = fetchAssetSignerFromSeeds;
    async function safeFetchAssetSignerFromSeeds(context, seeds, options) {
      return safeFetchAssetSigner(context, findAssetSignerPda(context, seeds), options);
    }
    exports2.safeFetchAssetSignerFromSeeds = safeFetchAssetSignerFromSeeds;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/addBlocker.js
var require_addBlocker = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/addBlocker.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAddBlockerSerializer = void 0;
    var serializers_1 = require_serializers();
    function getAddBlockerSerializer() {
      return (0, serializers_1.struct)([], { description: "AddBlocker" });
    }
    exports2.getAddBlockerSerializer = getAddBlockerSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/attribute.js
var require_attribute = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/attribute.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAttributeSerializer = void 0;
    var serializers_1 = require_serializers();
    function getAttributeSerializer() {
      return (0, serializers_1.struct)([
        ["key", (0, serializers_1.string)()],
        ["value", (0, serializers_1.string)()]
      ], { description: "Attribute" });
    }
    exports2.getAttributeSerializer = getAttributeSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/attributes.js
var require_attributes = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/attributes.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAttributesSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getAttributesSerializer() {
      return (0, serializers_1.struct)([["attributeList", (0, serializers_1.array)((0, _1.getAttributeSerializer)())]], { description: "Attributes" });
    }
    exports2.getAttributesSerializer = getAttributesSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/autograph.js
var require_autograph = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/autograph.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAutographSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getAutographSerializer() {
      return (0, serializers_1.struct)([["signatures", (0, serializers_1.array)((0, _1.getAutographSignatureSerializer)())]], { description: "Autograph" });
    }
    exports2.getAutographSerializer = getAutographSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/autographSignature.js
var require_autographSignature = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/autographSignature.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAutographSignatureSerializer = void 0;
    var serializers_1 = require_serializers();
    function getAutographSignatureSerializer() {
      return (0, serializers_1.struct)([
        ["address", (0, serializers_1.publicKey)()],
        ["message", (0, serializers_1.string)()]
      ], { description: "AutographSignature" });
    }
    exports2.getAutographSignatureSerializer = getAutographSignatureSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseAppData.js
var require_baseAppData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseAppData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseAppDataSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseAppDataSerializer() {
      return (0, serializers_1.struct)([
        ["dataAuthority", (0, _1.getBasePluginAuthoritySerializer)()],
        ["schema", (0, _1.getExternalPluginAdapterSchemaSerializer)()]
      ], { description: "BaseAppData" });
    }
    exports2.getBaseAppDataSerializer = getBaseAppDataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseAppDataInitInfo.js
var require_baseAppDataInitInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseAppDataInitInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseAppDataInitInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseAppDataInitInfoSerializer() {
      return (0, serializers_1.struct)([
        ["dataAuthority", (0, _1.getBasePluginAuthoritySerializer)()],
        ["initPluginAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        ["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]
      ], { description: "BaseAppDataInitInfo" });
    }
    exports2.getBaseAppDataInitInfoSerializer = getBaseAppDataInitInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseAppDataUpdateInfo.js
var require_baseAppDataUpdateInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseAppDataUpdateInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseAppDataUpdateInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseAppDataUpdateInfoSerializer() {
      return (0, serializers_1.struct)([["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]], { description: "BaseAppDataUpdateInfo" });
    }
    exports2.getBaseAppDataUpdateInfoSerializer = getBaseAppDataUpdateInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseDataSection.js
var require_baseDataSection = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseDataSection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseDataSectionSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseDataSectionSerializer() {
      return (0, serializers_1.struct)([
        ["parentKey", (0, _1.getBaseLinkedDataKeySerializer)()],
        ["schema", (0, _1.getExternalPluginAdapterSchemaSerializer)()]
      ], { description: "BaseDataSection" });
    }
    exports2.getBaseDataSectionSerializer = getBaseDataSectionSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseDataSectionInitInfo.js
var require_baseDataSectionInitInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseDataSectionInitInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseDataSectionInitInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseDataSectionInitInfoSerializer() {
      return (0, serializers_1.struct)([
        ["parentKey", (0, _1.getBaseLinkedDataKeySerializer)()],
        ["schema", (0, _1.getExternalPluginAdapterSchemaSerializer)()]
      ], { description: "BaseDataSectionInitInfo" });
    }
    exports2.getBaseDataSectionInitInfoSerializer = getBaseDataSectionInitInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseDataSectionUpdateInfo.js
var require_baseDataSectionUpdateInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseDataSectionUpdateInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseDataSectionUpdateInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    function getBaseDataSectionUpdateInfoSerializer() {
      return (0, serializers_1.struct)([], {
        description: "BaseDataSectionUpdateInfo"
      });
    }
    exports2.getBaseDataSectionUpdateInfoSerializer = getBaseDataSectionUpdateInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExternalPluginAdapterInitInfo.js
var require_baseExternalPluginAdapterInitInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExternalPluginAdapterInitInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseExternalPluginAdapterInitInfo = exports2.baseExternalPluginAdapterInitInfo = exports2.getBaseExternalPluginAdapterInitInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseExternalPluginAdapterInitInfoSerializer() {
      return (0, serializers_1.dataEnum)([
        [
          "LifecycleHook",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseLifecycleHookInitInfoSerializer)()])]])
        ],
        [
          "Oracle",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseOracleInitInfoSerializer)()])]])
        ],
        [
          "AppData",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseAppDataInitInfoSerializer)()])]])
        ],
        [
          "LinkedLifecycleHook",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseLinkedLifecycleHookInitInfoSerializer)()])]
          ])
        ],
        [
          "LinkedAppData",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseLinkedAppDataInitInfoSerializer)()])]])
        ],
        [
          "DataSection",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseDataSectionInitInfoSerializer)()])]])
        ]
      ], { description: "BaseExternalPluginAdapterInitInfo" });
    }
    exports2.getBaseExternalPluginAdapterInitInfoSerializer = getBaseExternalPluginAdapterInitInfoSerializer;
    function baseExternalPluginAdapterInitInfo(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseExternalPluginAdapterInitInfo = baseExternalPluginAdapterInitInfo;
    function isBaseExternalPluginAdapterInitInfo(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseExternalPluginAdapterInitInfo = isBaseExternalPluginAdapterInitInfo;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExternalPluginAdapterKey.js
var require_baseExternalPluginAdapterKey = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExternalPluginAdapterKey.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseExternalPluginAdapterKey = exports2.baseExternalPluginAdapterKey = exports2.getBaseExternalPluginAdapterKeySerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseExternalPluginAdapterKeySerializer() {
      return (0, serializers_1.dataEnum)([
        [
          "LifecycleHook",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, serializers_1.publicKey)()])]])
        ],
        [
          "Oracle",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.publicKey)()])]
          ])
        ],
        [
          "AppData",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBasePluginAuthoritySerializer)()])]])
        ],
        [
          "LinkedLifecycleHook",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, serializers_1.publicKey)()])]])
        ],
        [
          "LinkedAppData",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBasePluginAuthoritySerializer)()])]])
        ],
        [
          "DataSection",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseLinkedDataKeySerializer)()])]])
        ]
      ], { description: "BaseExternalPluginAdapterKey" });
    }
    exports2.getBaseExternalPluginAdapterKeySerializer = getBaseExternalPluginAdapterKeySerializer;
    function baseExternalPluginAdapterKey(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseExternalPluginAdapterKey = baseExternalPluginAdapterKey;
    function isBaseExternalPluginAdapterKey(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseExternalPluginAdapterKey = isBaseExternalPluginAdapterKey;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExternalPluginAdapterUpdateInfo.js
var require_baseExternalPluginAdapterUpdateInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExternalPluginAdapterUpdateInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseExternalPluginAdapterUpdateInfo = exports2.baseExternalPluginAdapterUpdateInfo = exports2.getBaseExternalPluginAdapterUpdateInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseExternalPluginAdapterUpdateInfoSerializer() {
      return (0, serializers_1.dataEnum)([
        [
          "LifecycleHook",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseLifecycleHookUpdateInfoSerializer)()])]])
        ],
        [
          "Oracle",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseOracleUpdateInfoSerializer)()])]])
        ],
        [
          "AppData",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseAppDataUpdateInfoSerializer)()])]])
        ],
        [
          "LinkedLifecycleHook",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseLinkedLifecycleHookUpdateInfoSerializer)()])]
          ])
        ],
        [
          "LinkedAppData",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseLinkedAppDataUpdateInfoSerializer)()])]])
        ]
      ], { description: "BaseExternalPluginAdapterUpdateInfo" });
    }
    exports2.getBaseExternalPluginAdapterUpdateInfoSerializer = getBaseExternalPluginAdapterUpdateInfoSerializer;
    function baseExternalPluginAdapterUpdateInfo(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseExternalPluginAdapterUpdateInfo = baseExternalPluginAdapterUpdateInfo;
    function isBaseExternalPluginAdapterUpdateInfo(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseExternalPluginAdapterUpdateInfo = isBaseExternalPluginAdapterUpdateInfo;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExtraAccount.js
var require_baseExtraAccount = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseExtraAccount.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseExtraAccount = exports2.baseExtraAccount = exports2.getBaseExtraAccountSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseExtraAccountSerializer() {
      return (0, serializers_1.dataEnum)([
        [
          "PreconfiguredProgram",
          (0, serializers_1.struct)([
            ["isSigner", (0, serializers_1.bool)()],
            ["isWritable", (0, serializers_1.bool)()]
          ])
        ],
        [
          "PreconfiguredCollection",
          (0, serializers_1.struct)([
            ["isSigner", (0, serializers_1.bool)()],
            ["isWritable", (0, serializers_1.bool)()]
          ])
        ],
        [
          "PreconfiguredOwner",
          (0, serializers_1.struct)([
            ["isSigner", (0, serializers_1.bool)()],
            ["isWritable", (0, serializers_1.bool)()]
          ])
        ],
        [
          "PreconfiguredRecipient",
          (0, serializers_1.struct)([
            ["isSigner", (0, serializers_1.bool)()],
            ["isWritable", (0, serializers_1.bool)()]
          ])
        ],
        [
          "PreconfiguredAsset",
          (0, serializers_1.struct)([
            ["isSigner", (0, serializers_1.bool)()],
            ["isWritable", (0, serializers_1.bool)()]
          ])
        ],
        [
          "CustomPda",
          (0, serializers_1.struct)([
            ["seeds", (0, serializers_1.array)((0, _1.getBaseSeedSerializer)())],
            ["customProgramId", (0, serializers_1.option)((0, serializers_1.publicKey)())],
            ["isSigner", (0, serializers_1.bool)()],
            ["isWritable", (0, serializers_1.bool)()]
          ])
        ],
        [
          "Address",
          (0, serializers_1.struct)([
            ["address", (0, serializers_1.publicKey)()],
            ["isSigner", (0, serializers_1.bool)()],
            ["isWritable", (0, serializers_1.bool)()]
          ])
        ]
      ], { description: "BaseExtraAccount" });
    }
    exports2.getBaseExtraAccountSerializer = getBaseExtraAccountSerializer;
    function baseExtraAccount(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseExtraAccount = baseExtraAccount;
    function isBaseExtraAccount(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseExtraAccount = isBaseExtraAccount;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLifecycleHook.js
var require_baseLifecycleHook = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLifecycleHook.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLifecycleHookSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLifecycleHookSerializer() {
      return (0, serializers_1.struct)([
        ["hookedProgram", (0, serializers_1.publicKey)()],
        ["extraAccounts", (0, serializers_1.option)((0, serializers_1.array)((0, _1.getBaseExtraAccountSerializer)()))],
        ["dataAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        ["schema", (0, _1.getExternalPluginAdapterSchemaSerializer)()]
      ], { description: "BaseLifecycleHook" });
    }
    exports2.getBaseLifecycleHookSerializer = getBaseLifecycleHookSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLifecycleHookInitInfo.js
var require_baseLifecycleHookInitInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLifecycleHookInitInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLifecycleHookInitInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLifecycleHookInitInfoSerializer() {
      return (0, serializers_1.struct)([
        ["hookedProgram", (0, serializers_1.publicKey)()],
        ["initPluginAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        [
          "lifecycleChecks",
          (0, serializers_1.array)((0, serializers_1.tuple)([
            (0, _1.getHookableLifecycleEventSerializer)(),
            (0, _1.getExternalCheckResultSerializer)()
          ]))
        ],
        ["extraAccounts", (0, serializers_1.option)((0, serializers_1.array)((0, _1.getBaseExtraAccountSerializer)()))],
        ["dataAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        ["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]
      ], { description: "BaseLifecycleHookInitInfo" });
    }
    exports2.getBaseLifecycleHookInitInfoSerializer = getBaseLifecycleHookInitInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLifecycleHookUpdateInfo.js
var require_baseLifecycleHookUpdateInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLifecycleHookUpdateInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLifecycleHookUpdateInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLifecycleHookUpdateInfoSerializer() {
      return (0, serializers_1.struct)([
        [
          "lifecycleChecks",
          (0, serializers_1.option)((0, serializers_1.array)((0, serializers_1.tuple)([
            (0, _1.getHookableLifecycleEventSerializer)(),
            (0, _1.getExternalCheckResultSerializer)()
          ])))
        ],
        ["extraAccounts", (0, serializers_1.option)((0, serializers_1.array)((0, _1.getBaseExtraAccountSerializer)()))],
        ["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]
      ], { description: "BaseLifecycleHookUpdateInfo" });
    }
    exports2.getBaseLifecycleHookUpdateInfoSerializer = getBaseLifecycleHookUpdateInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedAppData.js
var require_baseLinkedAppData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedAppData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLinkedAppDataSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLinkedAppDataSerializer() {
      return (0, serializers_1.struct)([
        ["dataAuthority", (0, _1.getBasePluginAuthoritySerializer)()],
        ["schema", (0, _1.getExternalPluginAdapterSchemaSerializer)()]
      ], { description: "BaseLinkedAppData" });
    }
    exports2.getBaseLinkedAppDataSerializer = getBaseLinkedAppDataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedAppDataInitInfo.js
var require_baseLinkedAppDataInitInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedAppDataInitInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLinkedAppDataInitInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLinkedAppDataInitInfoSerializer() {
      return (0, serializers_1.struct)([
        ["dataAuthority", (0, _1.getBasePluginAuthoritySerializer)()],
        ["initPluginAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        ["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]
      ], { description: "BaseLinkedAppDataInitInfo" });
    }
    exports2.getBaseLinkedAppDataInitInfoSerializer = getBaseLinkedAppDataInitInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedAppDataUpdateInfo.js
var require_baseLinkedAppDataUpdateInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedAppDataUpdateInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLinkedAppDataUpdateInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLinkedAppDataUpdateInfoSerializer() {
      return (0, serializers_1.struct)([["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]], { description: "BaseLinkedAppDataUpdateInfo" });
    }
    exports2.getBaseLinkedAppDataUpdateInfoSerializer = getBaseLinkedAppDataUpdateInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedDataKey.js
var require_baseLinkedDataKey = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedDataKey.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseLinkedDataKey = exports2.baseLinkedDataKey = exports2.getBaseLinkedDataKeySerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLinkedDataKeySerializer() {
      return (0, serializers_1.dataEnum)([
        [
          "LinkedLifecycleHook",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, serializers_1.publicKey)()])]])
        ],
        [
          "LinkedAppData",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBasePluginAuthoritySerializer)()])]
          ])
        ]
      ], { description: "BaseLinkedDataKey" });
    }
    exports2.getBaseLinkedDataKeySerializer = getBaseLinkedDataKeySerializer;
    function baseLinkedDataKey(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseLinkedDataKey = baseLinkedDataKey;
    function isBaseLinkedDataKey(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseLinkedDataKey = isBaseLinkedDataKey;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedLifecycleHook.js
var require_baseLinkedLifecycleHook = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedLifecycleHook.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLinkedLifecycleHookSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLinkedLifecycleHookSerializer() {
      return (0, serializers_1.struct)([
        ["hookedProgram", (0, serializers_1.publicKey)()],
        ["extraAccounts", (0, serializers_1.option)((0, serializers_1.array)((0, _1.getBaseExtraAccountSerializer)()))],
        ["dataAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        ["schema", (0, _1.getExternalPluginAdapterSchemaSerializer)()]
      ], { description: "BaseLinkedLifecycleHook" });
    }
    exports2.getBaseLinkedLifecycleHookSerializer = getBaseLinkedLifecycleHookSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedLifecycleHookInitInfo.js
var require_baseLinkedLifecycleHookInitInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedLifecycleHookInitInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLinkedLifecycleHookInitInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLinkedLifecycleHookInitInfoSerializer() {
      return (0, serializers_1.struct)([
        ["hookedProgram", (0, serializers_1.publicKey)()],
        ["initPluginAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        [
          "lifecycleChecks",
          (0, serializers_1.array)((0, serializers_1.tuple)([
            (0, _1.getHookableLifecycleEventSerializer)(),
            (0, _1.getExternalCheckResultSerializer)()
          ]))
        ],
        ["extraAccounts", (0, serializers_1.option)((0, serializers_1.array)((0, _1.getBaseExtraAccountSerializer)()))],
        ["dataAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        ["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]
      ], { description: "BaseLinkedLifecycleHookInitInfo" });
    }
    exports2.getBaseLinkedLifecycleHookInitInfoSerializer = getBaseLinkedLifecycleHookInitInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedLifecycleHookUpdateInfo.js
var require_baseLinkedLifecycleHookUpdateInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseLinkedLifecycleHookUpdateInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseLinkedLifecycleHookUpdateInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseLinkedLifecycleHookUpdateInfoSerializer() {
      return (0, serializers_1.struct)([
        [
          "lifecycleChecks",
          (0, serializers_1.option)((0, serializers_1.array)((0, serializers_1.tuple)([
            (0, _1.getHookableLifecycleEventSerializer)(),
            (0, _1.getExternalCheckResultSerializer)()
          ])))
        ],
        ["extraAccounts", (0, serializers_1.option)((0, serializers_1.array)((0, _1.getBaseExtraAccountSerializer)()))],
        ["schema", (0, serializers_1.option)((0, _1.getExternalPluginAdapterSchemaSerializer)())]
      ], { description: "BaseLinkedLifecycleHookUpdateInfo" });
    }
    exports2.getBaseLinkedLifecycleHookUpdateInfoSerializer = getBaseLinkedLifecycleHookUpdateInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseMasterEdition.js
var require_baseMasterEdition = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseMasterEdition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseMasterEditionSerializer = void 0;
    var serializers_1 = require_serializers();
    function getBaseMasterEditionSerializer() {
      return (0, serializers_1.struct)([
        ["maxSupply", (0, serializers_1.option)((0, serializers_1.u32)())],
        ["name", (0, serializers_1.option)((0, serializers_1.string)())],
        ["uri", (0, serializers_1.option)((0, serializers_1.string)())]
      ], { description: "BaseMasterEdition" });
    }
    exports2.getBaseMasterEditionSerializer = getBaseMasterEditionSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseOracle.js
var require_baseOracle = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseOracle.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseOracleSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseOracleSerializer() {
      return (0, serializers_1.struct)([
        ["baseAddress", (0, serializers_1.publicKey)()],
        ["baseAddressConfig", (0, serializers_1.option)((0, _1.getBaseExtraAccountSerializer)())],
        ["resultsOffset", (0, _1.getBaseValidationResultsOffsetSerializer)()]
      ], { description: "BaseOracle" });
    }
    exports2.getBaseOracleSerializer = getBaseOracleSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseOracleInitInfo.js
var require_baseOracleInitInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseOracleInitInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseOracleInitInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseOracleInitInfoSerializer() {
      return (0, serializers_1.struct)([
        ["baseAddress", (0, serializers_1.publicKey)()],
        ["initPluginAuthority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())],
        [
          "lifecycleChecks",
          (0, serializers_1.array)((0, serializers_1.tuple)([
            (0, _1.getHookableLifecycleEventSerializer)(),
            (0, _1.getExternalCheckResultSerializer)()
          ]))
        ],
        ["baseAddressConfig", (0, serializers_1.option)((0, _1.getBaseExtraAccountSerializer)())],
        ["resultsOffset", (0, serializers_1.option)((0, _1.getBaseValidationResultsOffsetSerializer)())]
      ], { description: "BaseOracleInitInfo" });
    }
    exports2.getBaseOracleInitInfoSerializer = getBaseOracleInitInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseOracleUpdateInfo.js
var require_baseOracleUpdateInfo = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseOracleUpdateInfo.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseOracleUpdateInfoSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseOracleUpdateInfoSerializer() {
      return (0, serializers_1.struct)([
        [
          "lifecycleChecks",
          (0, serializers_1.option)((0, serializers_1.array)((0, serializers_1.tuple)([
            (0, _1.getHookableLifecycleEventSerializer)(),
            (0, _1.getExternalCheckResultSerializer)()
          ])))
        ],
        ["baseAddressConfig", (0, serializers_1.option)((0, _1.getBaseExtraAccountSerializer)())],
        ["resultsOffset", (0, serializers_1.option)((0, _1.getBaseValidationResultsOffsetSerializer)())]
      ], { description: "BaseOracleUpdateInfo" });
    }
    exports2.getBaseOracleUpdateInfoSerializer = getBaseOracleUpdateInfoSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/basePluginAuthority.js
var require_basePluginAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/basePluginAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBasePluginAuthority = exports2.basePluginAuthority = exports2.getBasePluginAuthoritySerializer = void 0;
    var serializers_1 = require_serializers();
    function getBasePluginAuthoritySerializer() {
      return (0, serializers_1.dataEnum)([
        ["None", (0, serializers_1.unit)()],
        ["Owner", (0, serializers_1.unit)()],
        ["UpdateAuthority", (0, serializers_1.unit)()],
        [
          "Address",
          (0, serializers_1.struct)([
            ["address", (0, serializers_1.publicKey)()]
          ])
        ]
      ], { description: "BasePluginAuthority" });
    }
    exports2.getBasePluginAuthoritySerializer = getBasePluginAuthoritySerializer;
    function basePluginAuthority(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.basePluginAuthority = basePluginAuthority;
    function isBasePluginAuthority(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBasePluginAuthority = isBasePluginAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseRoyalties.js
var require_baseRoyalties = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseRoyalties.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBaseRoyaltiesSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getBaseRoyaltiesSerializer() {
      return (0, serializers_1.struct)([
        ["basisPoints", (0, serializers_1.u16)()],
        ["creators", (0, serializers_1.array)((0, _1.getCreatorSerializer)())],
        ["ruleSet", (0, _1.getBaseRuleSetSerializer)()]
      ], { description: "BaseRoyalties" });
    }
    exports2.getBaseRoyaltiesSerializer = getBaseRoyaltiesSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseRuleSet.js
var require_baseRuleSet = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseRuleSet.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseRuleSet = exports2.baseRuleSet = exports2.getBaseRuleSetSerializer = void 0;
    var serializers_1 = require_serializers();
    function getBaseRuleSetSerializer() {
      return (0, serializers_1.dataEnum)([
        ["None", (0, serializers_1.unit)()],
        [
          "ProgramAllowList",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.array)((0, serializers_1.publicKey)())])]
          ])
        ],
        [
          "ProgramDenyList",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.array)((0, serializers_1.publicKey)())])]
          ])
        ]
      ], { description: "BaseRuleSet" });
    }
    exports2.getBaseRuleSetSerializer = getBaseRuleSetSerializer;
    function baseRuleSet(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseRuleSet = baseRuleSet;
    function isBaseRuleSet(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseRuleSet = isBaseRuleSet;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseSeed.js
var require_baseSeed = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseSeed.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseSeed = exports2.baseSeed = exports2.getBaseSeedSerializer = void 0;
    var serializers_1 = require_serializers();
    function getBaseSeedSerializer() {
      return (0, serializers_1.dataEnum)([
        ["Collection", (0, serializers_1.unit)()],
        ["Owner", (0, serializers_1.unit)()],
        ["Recipient", (0, serializers_1.unit)()],
        ["Asset", (0, serializers_1.unit)()],
        [
          "Address",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.publicKey)()])]
          ])
        ],
        [
          "Bytes",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.bytes)({ size: (0, serializers_1.u32)() })])]
          ])
        ]
      ], { description: "BaseSeed" });
    }
    exports2.getBaseSeedSerializer = getBaseSeedSerializer;
    function baseSeed(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseSeed = baseSeed;
    function isBaseSeed(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseSeed = isBaseSeed;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseUpdateAuthority.js
var require_baseUpdateAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseUpdateAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseUpdateAuthority = exports2.baseUpdateAuthority = exports2.getBaseUpdateAuthoritySerializer = void 0;
    var serializers_1 = require_serializers();
    function getBaseUpdateAuthoritySerializer() {
      return (0, serializers_1.dataEnum)([
        ["None", (0, serializers_1.unit)()],
        [
          "Address",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.publicKey)()])]
          ])
        ],
        [
          "Collection",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.publicKey)()])]
          ])
        ]
      ], { description: "BaseUpdateAuthority" });
    }
    exports2.getBaseUpdateAuthoritySerializer = getBaseUpdateAuthoritySerializer;
    function baseUpdateAuthority(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseUpdateAuthority = baseUpdateAuthority;
    function isBaseUpdateAuthority(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseUpdateAuthority = isBaseUpdateAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseValidationResultsOffset.js
var require_baseValidationResultsOffset = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/baseValidationResultsOffset.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isBaseValidationResultsOffset = exports2.baseValidationResultsOffset = exports2.getBaseValidationResultsOffsetSerializer = void 0;
    var serializers_1 = require_serializers();
    function getBaseValidationResultsOffsetSerializer() {
      return (0, serializers_1.dataEnum)([
        ["NoOffset", (0, serializers_1.unit)()],
        ["Anchor", (0, serializers_1.unit)()],
        [
          "Custom",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, serializers_1.u64)()])]
          ])
        ]
      ], { description: "BaseValidationResultsOffset" });
    }
    exports2.getBaseValidationResultsOffsetSerializer = getBaseValidationResultsOffsetSerializer;
    function baseValidationResultsOffset(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.baseValidationResultsOffset = baseValidationResultsOffset;
    function isBaseValidationResultsOffset(kind, value) {
      return value.__kind === kind;
    }
    exports2.isBaseValidationResultsOffset = isBaseValidationResultsOffset;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/bubblegumV2.js
var require_bubblegumV2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/bubblegumV2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBubblegumV2Serializer = void 0;
    var serializers_1 = require_serializers();
    function getBubblegumV2Serializer() {
      return (0, serializers_1.struct)([], { description: "BubblegumV2" });
    }
    exports2.getBubblegumV2Serializer = getBubblegumV2Serializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/burnDelegate.js
var require_burnDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/burnDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getBurnDelegateSerializer = void 0;
    var serializers_1 = require_serializers();
    function getBurnDelegateSerializer() {
      return (0, serializers_1.struct)([], {
        description: "BurnDelegate"
      });
    }
    exports2.getBurnDelegateSerializer = getBurnDelegateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/compressionProof.js
var require_compressionProof = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/compressionProof.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getCompressionProofSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getCompressionProofSerializer() {
      return (0, serializers_1.struct)([
        ["owner", (0, serializers_1.publicKey)()],
        ["updateAuthority", (0, _1.getBaseUpdateAuthoritySerializer)()],
        ["name", (0, serializers_1.string)()],
        ["uri", (0, serializers_1.string)()],
        ["seq", (0, serializers_1.u64)()],
        ["plugins", (0, serializers_1.array)((0, _1.getHashablePluginSchemaSerializer)())]
      ], { description: "CompressionProof" });
    }
    exports2.getCompressionProofSerializer = getCompressionProofSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/creator.js
var require_creator = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/creator.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getCreatorSerializer = void 0;
    var serializers_1 = require_serializers();
    function getCreatorSerializer() {
      return (0, serializers_1.struct)([
        ["address", (0, serializers_1.publicKey)()],
        ["percentage", (0, serializers_1.u8)()]
      ], { description: "Creator" });
    }
    exports2.getCreatorSerializer = getCreatorSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/dataState.js
var require_dataState = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/dataState.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getDataStateSerializer = exports2.DataState = void 0;
    var serializers_1 = require_serializers();
    var DataState;
    (function(DataState2) {
      DataState2[DataState2["AccountState"] = 0] = "AccountState";
      DataState2[DataState2["LedgerState"] = 1] = "LedgerState";
    })(DataState = exports2.DataState || (exports2.DataState = {}));
    function getDataStateSerializer() {
      return (0, serializers_1.scalarEnum)(DataState, {
        description: "DataState"
      });
    }
    exports2.getDataStateSerializer = getDataStateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/edition.js
var require_edition = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/edition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getEditionSerializer = void 0;
    var serializers_1 = require_serializers();
    function getEditionSerializer() {
      return (0, serializers_1.struct)([["number", (0, serializers_1.u32)()]], {
        description: "Edition"
      });
    }
    exports2.getEditionSerializer = getEditionSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalCheckResult.js
var require_externalCheckResult = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalCheckResult.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getExternalCheckResultSerializer = void 0;
    var serializers_1 = require_serializers();
    function getExternalCheckResultSerializer() {
      return (0, serializers_1.struct)([["flags", (0, serializers_1.u32)()]], {
        description: "ExternalCheckResult"
      });
    }
    exports2.getExternalCheckResultSerializer = getExternalCheckResultSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalPluginAdapter.js
var require_externalPluginAdapter = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalPluginAdapter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isExternalPluginAdapter = exports2.externalPluginAdapter = exports2.getExternalPluginAdapterSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getExternalPluginAdapterSerializer() {
      return (0, serializers_1.dataEnum)([
        [
          "LifecycleHook",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseLifecycleHookSerializer)()])]
          ])
        ],
        [
          "Oracle",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseOracleSerializer)()])]
          ])
        ],
        [
          "AppData",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseAppDataSerializer)()])]
          ])
        ],
        [
          "LinkedLifecycleHook",
          (0, serializers_1.struct)([["fields", (0, serializers_1.tuple)([(0, _1.getBaseLinkedLifecycleHookSerializer)()])]])
        ],
        [
          "LinkedAppData",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseLinkedAppDataSerializer)()])]
          ])
        ],
        [
          "DataSection",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseDataSectionSerializer)()])]
          ])
        ]
      ], { description: "ExternalPluginAdapter" });
    }
    exports2.getExternalPluginAdapterSerializer = getExternalPluginAdapterSerializer;
    function externalPluginAdapter(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.externalPluginAdapter = externalPluginAdapter;
    function isExternalPluginAdapter(kind, value) {
      return value.__kind === kind;
    }
    exports2.isExternalPluginAdapter = isExternalPluginAdapter;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalPluginAdapterSchema.js
var require_externalPluginAdapterSchema = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalPluginAdapterSchema.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getExternalPluginAdapterSchemaSerializer = exports2.ExternalPluginAdapterSchema = void 0;
    var serializers_1 = require_serializers();
    var ExternalPluginAdapterSchema;
    (function(ExternalPluginAdapterSchema2) {
      ExternalPluginAdapterSchema2[ExternalPluginAdapterSchema2["Binary"] = 0] = "Binary";
      ExternalPluginAdapterSchema2[ExternalPluginAdapterSchema2["Json"] = 1] = "Json";
      ExternalPluginAdapterSchema2[ExternalPluginAdapterSchema2["MsgPack"] = 2] = "MsgPack";
    })(ExternalPluginAdapterSchema = exports2.ExternalPluginAdapterSchema || (exports2.ExternalPluginAdapterSchema = {}));
    function getExternalPluginAdapterSchemaSerializer() {
      return (0, serializers_1.scalarEnum)(ExternalPluginAdapterSchema, {
        description: "ExternalPluginAdapterSchema"
      });
    }
    exports2.getExternalPluginAdapterSchemaSerializer = getExternalPluginAdapterSchemaSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalPluginAdapterType.js
var require_externalPluginAdapterType = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalPluginAdapterType.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getExternalPluginAdapterTypeSerializer = exports2.ExternalPluginAdapterType = void 0;
    var serializers_1 = require_serializers();
    var ExternalPluginAdapterType;
    (function(ExternalPluginAdapterType2) {
      ExternalPluginAdapterType2[ExternalPluginAdapterType2["LifecycleHook"] = 0] = "LifecycleHook";
      ExternalPluginAdapterType2[ExternalPluginAdapterType2["Oracle"] = 1] = "Oracle";
      ExternalPluginAdapterType2[ExternalPluginAdapterType2["AppData"] = 2] = "AppData";
      ExternalPluginAdapterType2[ExternalPluginAdapterType2["LinkedLifecycleHook"] = 3] = "LinkedLifecycleHook";
      ExternalPluginAdapterType2[ExternalPluginAdapterType2["LinkedAppData"] = 4] = "LinkedAppData";
      ExternalPluginAdapterType2[ExternalPluginAdapterType2["DataSection"] = 5] = "DataSection";
    })(ExternalPluginAdapterType = exports2.ExternalPluginAdapterType || (exports2.ExternalPluginAdapterType = {}));
    function getExternalPluginAdapterTypeSerializer() {
      return (0, serializers_1.scalarEnum)(ExternalPluginAdapterType, {
        description: "ExternalPluginAdapterType"
      });
    }
    exports2.getExternalPluginAdapterTypeSerializer = getExternalPluginAdapterTypeSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalRegistryRecord.js
var require_externalRegistryRecord = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalRegistryRecord.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getExternalRegistryRecordSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getExternalRegistryRecordSerializer() {
      return (0, serializers_1.struct)([
        ["pluginType", (0, _1.getExternalPluginAdapterTypeSerializer)()],
        ["authority", (0, _1.getBasePluginAuthoritySerializer)()],
        [
          "lifecycleChecks",
          (0, serializers_1.option)((0, serializers_1.array)((0, serializers_1.tuple)([
            (0, _1.getHookableLifecycleEventSerializer)(),
            (0, _1.getExternalCheckResultSerializer)()
          ])))
        ],
        ["offset", (0, serializers_1.u64)()],
        ["dataOffset", (0, serializers_1.option)((0, serializers_1.u64)())],
        ["dataLen", (0, serializers_1.option)((0, serializers_1.u64)())]
      ], { description: "ExternalRegistryRecord" });
    }
    exports2.getExternalRegistryRecordSerializer = getExternalRegistryRecordSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalValidationResult.js
var require_externalValidationResult = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/externalValidationResult.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getExternalValidationResultSerializer = exports2.ExternalValidationResult = void 0;
    var serializers_1 = require_serializers();
    var ExternalValidationResult;
    (function(ExternalValidationResult2) {
      ExternalValidationResult2[ExternalValidationResult2["Approved"] = 0] = "Approved";
      ExternalValidationResult2[ExternalValidationResult2["Rejected"] = 1] = "Rejected";
      ExternalValidationResult2[ExternalValidationResult2["Pass"] = 2] = "Pass";
    })(ExternalValidationResult = exports2.ExternalValidationResult || (exports2.ExternalValidationResult = {}));
    function getExternalValidationResultSerializer() {
      return (0, serializers_1.scalarEnum)(ExternalValidationResult, {
        description: "ExternalValidationResult"
      });
    }
    exports2.getExternalValidationResultSerializer = getExternalValidationResultSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/freezeDelegate.js
var require_freezeDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/freezeDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getFreezeDelegateSerializer = void 0;
    var serializers_1 = require_serializers();
    function getFreezeDelegateSerializer() {
      return (0, serializers_1.struct)([["frozen", (0, serializers_1.bool)()]], {
        description: "FreezeDelegate"
      });
    }
    exports2.getFreezeDelegateSerializer = getFreezeDelegateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/hashablePluginSchema.js
var require_hashablePluginSchema = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/hashablePluginSchema.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getHashablePluginSchemaSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getHashablePluginSchemaSerializer() {
      return (0, serializers_1.struct)([
        ["index", (0, serializers_1.u64)()],
        ["authority", (0, _1.getBasePluginAuthoritySerializer)()],
        ["plugin", (0, _1.getPluginSerializer)()]
      ], { description: "HashablePluginSchema" });
    }
    exports2.getHashablePluginSchemaSerializer = getHashablePluginSchemaSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/hashedAssetSchema.js
var require_hashedAssetSchema = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/hashedAssetSchema.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getHashedAssetSchemaSerializer = void 0;
    var serializers_1 = require_serializers();
    function getHashedAssetSchemaSerializer() {
      return (0, serializers_1.struct)([
        ["assetHash", (0, serializers_1.bytes)({ size: 32 })],
        ["pluginHashes", (0, serializers_1.array)((0, serializers_1.bytes)({ size: 32 }))]
      ], { description: "HashedAssetSchema" });
    }
    exports2.getHashedAssetSchemaSerializer = getHashedAssetSchemaSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/hookableLifecycleEvent.js
var require_hookableLifecycleEvent = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/hookableLifecycleEvent.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getHookableLifecycleEventSerializer = exports2.HookableLifecycleEvent = void 0;
    var serializers_1 = require_serializers();
    var HookableLifecycleEvent;
    (function(HookableLifecycleEvent2) {
      HookableLifecycleEvent2[HookableLifecycleEvent2["Create"] = 0] = "Create";
      HookableLifecycleEvent2[HookableLifecycleEvent2["Transfer"] = 1] = "Transfer";
      HookableLifecycleEvent2[HookableLifecycleEvent2["Burn"] = 2] = "Burn";
      HookableLifecycleEvent2[HookableLifecycleEvent2["Update"] = 3] = "Update";
    })(HookableLifecycleEvent = exports2.HookableLifecycleEvent || (exports2.HookableLifecycleEvent = {}));
    function getHookableLifecycleEventSerializer() {
      return (0, serializers_1.scalarEnum)(HookableLifecycleEvent, {
        description: "HookableLifecycleEvent"
      });
    }
    exports2.getHookableLifecycleEventSerializer = getHookableLifecycleEventSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/immutableMetadata.js
var require_immutableMetadata = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/immutableMetadata.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getImmutableMetadataSerializer = void 0;
    var serializers_1 = require_serializers();
    function getImmutableMetadataSerializer() {
      return (0, serializers_1.struct)([], {
        description: "ImmutableMetadata"
      });
    }
    exports2.getImmutableMetadataSerializer = getImmutableMetadataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/key.js
var require_key = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/key.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getKeySerializer = exports2.Key = void 0;
    var serializers_1 = require_serializers();
    var Key;
    (function(Key2) {
      Key2[Key2["Uninitialized"] = 0] = "Uninitialized";
      Key2[Key2["AssetV1"] = 1] = "AssetV1";
      Key2[Key2["HashedAssetV1"] = 2] = "HashedAssetV1";
      Key2[Key2["PluginHeaderV1"] = 3] = "PluginHeaderV1";
      Key2[Key2["PluginRegistryV1"] = 4] = "PluginRegistryV1";
      Key2[Key2["CollectionV1"] = 5] = "CollectionV1";
    })(Key = exports2.Key || (exports2.Key = {}));
    function getKeySerializer() {
      return (0, serializers_1.scalarEnum)(Key, { description: "Key" });
    }
    exports2.getKeySerializer = getKeySerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/oracleValidation.js
var require_oracleValidation = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/oracleValidation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isOracleValidation = exports2.oracleValidation = exports2.getOracleValidationSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getOracleValidationSerializer() {
      return (0, serializers_1.dataEnum)([
        ["Uninitialized", (0, serializers_1.unit)()],
        [
          "V1",
          (0, serializers_1.struct)([
            ["create", (0, _1.getExternalValidationResultSerializer)()],
            ["transfer", (0, _1.getExternalValidationResultSerializer)()],
            ["burn", (0, _1.getExternalValidationResultSerializer)()],
            ["update", (0, _1.getExternalValidationResultSerializer)()]
          ])
        ]
      ], { description: "OracleValidation" });
    }
    exports2.getOracleValidationSerializer = getOracleValidationSerializer;
    function oracleValidation(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.oracleValidation = oracleValidation;
    function isOracleValidation(kind, value) {
      return value.__kind === kind;
    }
    exports2.isOracleValidation = isOracleValidation;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/permanentBurnDelegate.js
var require_permanentBurnDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/permanentBurnDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPermanentBurnDelegateSerializer = void 0;
    var serializers_1 = require_serializers();
    function getPermanentBurnDelegateSerializer() {
      return (0, serializers_1.struct)([], {
        description: "PermanentBurnDelegate"
      });
    }
    exports2.getPermanentBurnDelegateSerializer = getPermanentBurnDelegateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/permanentFreezeDelegate.js
var require_permanentFreezeDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/permanentFreezeDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPermanentFreezeDelegateSerializer = void 0;
    var serializers_1 = require_serializers();
    function getPermanentFreezeDelegateSerializer() {
      return (0, serializers_1.struct)([["frozen", (0, serializers_1.bool)()]], {
        description: "PermanentFreezeDelegate"
      });
    }
    exports2.getPermanentFreezeDelegateSerializer = getPermanentFreezeDelegateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/permanentTransferDelegate.js
var require_permanentTransferDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/permanentTransferDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPermanentTransferDelegateSerializer = void 0;
    var serializers_1 = require_serializers();
    function getPermanentTransferDelegateSerializer() {
      return (0, serializers_1.struct)([], {
        description: "PermanentTransferDelegate"
      });
    }
    exports2.getPermanentTransferDelegateSerializer = getPermanentTransferDelegateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/plugin.js
var require_plugin = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/plugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isPlugin = exports2.plugin = exports2.getPluginSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getPluginSerializer() {
      return (0, serializers_1.dataEnum)([
        [
          "Royalties",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseRoyaltiesSerializer)()])]
          ])
        ],
        [
          "FreezeDelegate",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getFreezeDelegateSerializer)()])]
          ])
        ],
        [
          "BurnDelegate",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBurnDelegateSerializer)()])]
          ])
        ],
        [
          "TransferDelegate",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getTransferDelegateSerializer)()])]
          ])
        ],
        [
          "UpdateDelegate",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getUpdateDelegateSerializer)()])]
          ])
        ],
        [
          "PermanentFreezeDelegate",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getPermanentFreezeDelegateSerializer)()])]
          ])
        ],
        [
          "Attributes",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getAttributesSerializer)()])]
          ])
        ],
        [
          "PermanentTransferDelegate",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getPermanentTransferDelegateSerializer)()])]
          ])
        ],
        [
          "PermanentBurnDelegate",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getPermanentBurnDelegateSerializer)()])]
          ])
        ],
        [
          "Edition",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getEditionSerializer)()])]
          ])
        ],
        [
          "MasterEdition",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBaseMasterEditionSerializer)()])]
          ])
        ],
        [
          "AddBlocker",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getAddBlockerSerializer)()])]
          ])
        ],
        [
          "ImmutableMetadata",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getImmutableMetadataSerializer)()])]
          ])
        ],
        [
          "VerifiedCreators",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getVerifiedCreatorsSerializer)()])]
          ])
        ],
        [
          "Autograph",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getAutographSerializer)()])]
          ])
        ],
        [
          "BubblegumV2",
          (0, serializers_1.struct)([
            ["fields", (0, serializers_1.tuple)([(0, _1.getBubblegumV2Serializer)()])]
          ])
        ]
      ], { description: "Plugin" });
    }
    exports2.getPluginSerializer = getPluginSerializer;
    function plugin(kind, data) {
      return Array.isArray(data) ? { __kind: kind, fields: data } : { __kind: kind, ...data ?? {} };
    }
    exports2.plugin = plugin;
    function isPlugin(kind, value) {
      return value.__kind === kind;
    }
    exports2.isPlugin = isPlugin;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/pluginAuthorityPair.js
var require_pluginAuthorityPair = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/pluginAuthorityPair.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPluginAuthorityPairSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getPluginAuthorityPairSerializer() {
      return (0, serializers_1.struct)([
        ["plugin", (0, _1.getPluginSerializer)()],
        ["authority", (0, serializers_1.option)((0, _1.getBasePluginAuthoritySerializer)())]
      ], { description: "PluginAuthorityPair" });
    }
    exports2.getPluginAuthorityPairSerializer = getPluginAuthorityPairSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/pluginType.js
var require_pluginType = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/pluginType.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPluginTypeSerializer = exports2.PluginType = void 0;
    var serializers_1 = require_serializers();
    var PluginType;
    (function(PluginType2) {
      PluginType2[PluginType2["Royalties"] = 0] = "Royalties";
      PluginType2[PluginType2["FreezeDelegate"] = 1] = "FreezeDelegate";
      PluginType2[PluginType2["BurnDelegate"] = 2] = "BurnDelegate";
      PluginType2[PluginType2["TransferDelegate"] = 3] = "TransferDelegate";
      PluginType2[PluginType2["UpdateDelegate"] = 4] = "UpdateDelegate";
      PluginType2[PluginType2["PermanentFreezeDelegate"] = 5] = "PermanentFreezeDelegate";
      PluginType2[PluginType2["Attributes"] = 6] = "Attributes";
      PluginType2[PluginType2["PermanentTransferDelegate"] = 7] = "PermanentTransferDelegate";
      PluginType2[PluginType2["PermanentBurnDelegate"] = 8] = "PermanentBurnDelegate";
      PluginType2[PluginType2["Edition"] = 9] = "Edition";
      PluginType2[PluginType2["MasterEdition"] = 10] = "MasterEdition";
      PluginType2[PluginType2["AddBlocker"] = 11] = "AddBlocker";
      PluginType2[PluginType2["ImmutableMetadata"] = 12] = "ImmutableMetadata";
      PluginType2[PluginType2["VerifiedCreators"] = 13] = "VerifiedCreators";
      PluginType2[PluginType2["Autograph"] = 14] = "Autograph";
      PluginType2[PluginType2["BubblegumV2"] = 15] = "BubblegumV2";
    })(PluginType = exports2.PluginType || (exports2.PluginType = {}));
    function getPluginTypeSerializer() {
      return (0, serializers_1.scalarEnum)(PluginType, {
        description: "PluginType"
      });
    }
    exports2.getPluginTypeSerializer = getPluginTypeSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/registryRecord.js
var require_registryRecord = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/registryRecord.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRegistryRecordSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getRegistryRecordSerializer() {
      return (0, serializers_1.struct)([
        ["pluginType", (0, _1.getPluginTypeSerializer)()],
        ["authority", (0, _1.getBasePluginAuthoritySerializer)()],
        ["offset", (0, serializers_1.u64)()]
      ], { description: "RegistryRecord" });
    }
    exports2.getRegistryRecordSerializer = getRegistryRecordSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/transferDelegate.js
var require_transferDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/transferDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getTransferDelegateSerializer = void 0;
    var serializers_1 = require_serializers();
    function getTransferDelegateSerializer() {
      return (0, serializers_1.struct)([], {
        description: "TransferDelegate"
      });
    }
    exports2.getTransferDelegateSerializer = getTransferDelegateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/updateDelegate.js
var require_updateDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/updateDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getUpdateDelegateSerializer = void 0;
    var serializers_1 = require_serializers();
    function getUpdateDelegateSerializer() {
      return (0, serializers_1.struct)([["additionalDelegates", (0, serializers_1.array)((0, serializers_1.publicKey)())]], { description: "UpdateDelegate" });
    }
    exports2.getUpdateDelegateSerializer = getUpdateDelegateSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/updateType.js
var require_updateType = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/updateType.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getUpdateTypeSerializer = exports2.UpdateType = void 0;
    var serializers_1 = require_serializers();
    var UpdateType;
    (function(UpdateType2) {
      UpdateType2[UpdateType2["Mint"] = 0] = "Mint";
      UpdateType2[UpdateType2["Add"] = 1] = "Add";
      UpdateType2[UpdateType2["Remove"] = 2] = "Remove";
    })(UpdateType = exports2.UpdateType || (exports2.UpdateType = {}));
    function getUpdateTypeSerializer() {
      return (0, serializers_1.scalarEnum)(UpdateType, {
        description: "UpdateType"
      });
    }
    exports2.getUpdateTypeSerializer = getUpdateTypeSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/validationResult.js
var require_validationResult = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/validationResult.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getValidationResultSerializer = exports2.ValidationResult = void 0;
    var serializers_1 = require_serializers();
    var ValidationResult;
    (function(ValidationResult2) {
      ValidationResult2[ValidationResult2["Approved"] = 0] = "Approved";
      ValidationResult2[ValidationResult2["Rejected"] = 1] = "Rejected";
      ValidationResult2[ValidationResult2["Pass"] = 2] = "Pass";
      ValidationResult2[ValidationResult2["ForceApproved"] = 3] = "ForceApproved";
    })(ValidationResult = exports2.ValidationResult || (exports2.ValidationResult = {}));
    function getValidationResultSerializer() {
      return (0, serializers_1.scalarEnum)(ValidationResult, {
        description: "ValidationResult"
      });
    }
    exports2.getValidationResultSerializer = getValidationResultSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/verifiedCreators.js
var require_verifiedCreators = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/verifiedCreators.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getVerifiedCreatorsSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getVerifiedCreatorsSerializer() {
      return (0, serializers_1.struct)([["signatures", (0, serializers_1.array)((0, _1.getVerifiedCreatorsSignatureSerializer)())]], { description: "VerifiedCreators" });
    }
    exports2.getVerifiedCreatorsSerializer = getVerifiedCreatorsSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/verifiedCreatorsSignature.js
var require_verifiedCreatorsSignature = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/verifiedCreatorsSignature.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getVerifiedCreatorsSignatureSerializer = void 0;
    var serializers_1 = require_serializers();
    function getVerifiedCreatorsSignatureSerializer() {
      return (0, serializers_1.struct)([
        ["address", (0, serializers_1.publicKey)()],
        ["verified", (0, serializers_1.bool)()]
      ], { description: "VerifiedCreatorsSignature" });
    }
    exports2.getVerifiedCreatorsSignatureSerializer = getVerifiedCreatorsSignatureSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/index.js
var require_types = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_addBlocker(), exports2);
    __exportStar(require_attribute(), exports2);
    __exportStar(require_attributes(), exports2);
    __exportStar(require_autograph(), exports2);
    __exportStar(require_autographSignature(), exports2);
    __exportStar(require_baseAppData(), exports2);
    __exportStar(require_baseAppDataInitInfo(), exports2);
    __exportStar(require_baseAppDataUpdateInfo(), exports2);
    __exportStar(require_baseDataSection(), exports2);
    __exportStar(require_baseDataSectionInitInfo(), exports2);
    __exportStar(require_baseDataSectionUpdateInfo(), exports2);
    __exportStar(require_baseExternalPluginAdapterInitInfo(), exports2);
    __exportStar(require_baseExternalPluginAdapterKey(), exports2);
    __exportStar(require_baseExternalPluginAdapterUpdateInfo(), exports2);
    __exportStar(require_baseExtraAccount(), exports2);
    __exportStar(require_baseLifecycleHook(), exports2);
    __exportStar(require_baseLifecycleHookInitInfo(), exports2);
    __exportStar(require_baseLifecycleHookUpdateInfo(), exports2);
    __exportStar(require_baseLinkedAppData(), exports2);
    __exportStar(require_baseLinkedAppDataInitInfo(), exports2);
    __exportStar(require_baseLinkedAppDataUpdateInfo(), exports2);
    __exportStar(require_baseLinkedDataKey(), exports2);
    __exportStar(require_baseLinkedLifecycleHook(), exports2);
    __exportStar(require_baseLinkedLifecycleHookInitInfo(), exports2);
    __exportStar(require_baseLinkedLifecycleHookUpdateInfo(), exports2);
    __exportStar(require_baseMasterEdition(), exports2);
    __exportStar(require_baseOracle(), exports2);
    __exportStar(require_baseOracleInitInfo(), exports2);
    __exportStar(require_baseOracleUpdateInfo(), exports2);
    __exportStar(require_basePluginAuthority(), exports2);
    __exportStar(require_baseRoyalties(), exports2);
    __exportStar(require_baseRuleSet(), exports2);
    __exportStar(require_baseSeed(), exports2);
    __exportStar(require_baseUpdateAuthority(), exports2);
    __exportStar(require_baseValidationResultsOffset(), exports2);
    __exportStar(require_bubblegumV2(), exports2);
    __exportStar(require_burnDelegate(), exports2);
    __exportStar(require_compressionProof(), exports2);
    __exportStar(require_creator(), exports2);
    __exportStar(require_dataState(), exports2);
    __exportStar(require_edition(), exports2);
    __exportStar(require_externalCheckResult(), exports2);
    __exportStar(require_externalPluginAdapter(), exports2);
    __exportStar(require_externalPluginAdapterSchema(), exports2);
    __exportStar(require_externalPluginAdapterType(), exports2);
    __exportStar(require_externalRegistryRecord(), exports2);
    __exportStar(require_externalValidationResult(), exports2);
    __exportStar(require_freezeDelegate(), exports2);
    __exportStar(require_hashablePluginSchema(), exports2);
    __exportStar(require_hashedAssetSchema(), exports2);
    __exportStar(require_hookableLifecycleEvent(), exports2);
    __exportStar(require_immutableMetadata(), exports2);
    __exportStar(require_key(), exports2);
    __exportStar(require_oracleValidation(), exports2);
    __exportStar(require_permanentBurnDelegate(), exports2);
    __exportStar(require_permanentFreezeDelegate(), exports2);
    __exportStar(require_permanentTransferDelegate(), exports2);
    __exportStar(require_plugin(), exports2);
    __exportStar(require_pluginAuthorityPair(), exports2);
    __exportStar(require_pluginType(), exports2);
    __exportStar(require_registryRecord(), exports2);
    __exportStar(require_transferDelegate(), exports2);
    __exportStar(require_updateDelegate(), exports2);
    __exportStar(require_updateType(), exports2);
    __exportStar(require_validationResult(), exports2);
    __exportStar(require_verifiedCreators(), exports2);
    __exportStar(require_verifiedCreatorsSignature(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/assetV1AccountData.js
var require_assetV1AccountData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/assetV1AccountData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAssetV1AccountDataSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getAssetV1AccountDataSerializer() {
      return (0, serializers_1.struct)([
        ["key", (0, _1.getKeySerializer)()],
        ["owner", (0, serializers_1.publicKey)()],
        ["updateAuthority", (0, _1.getBaseUpdateAuthoritySerializer)()],
        ["name", (0, serializers_1.string)()],
        ["uri", (0, serializers_1.string)()],
        ["seq", (0, serializers_1.option)((0, serializers_1.u64)())]
      ], { description: "AssetV1AccountData" });
    }
    exports2.getAssetV1AccountDataSerializer = getAssetV1AccountDataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/royalties.js
var require_royalties = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/royalties.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.royaltiesFromBase = exports2.royaltiesToBase = exports2.ruleSetToBase = void 0;
    function ruleSetToBase(r) {
      const base = r;
      if (base.__kind) {
        return r;
      }
      const ruleSet = r;
      if (ruleSet.type === "ProgramAllowList" || ruleSet.type === "ProgramDenyList") {
        return {
          __kind: ruleSet.type,
          fields: [ruleSet.addresses]
        };
      }
      return { __kind: ruleSet.type };
    }
    exports2.ruleSetToBase = ruleSetToBase;
    function royaltiesToBase(r) {
      return {
        ...r,
        ruleSet: ruleSetToBase(r.ruleSet)
      };
    }
    exports2.royaltiesToBase = royaltiesToBase;
    function royaltiesFromBase(r) {
      let ruleSet;
      if (r.ruleSet.__kind === "ProgramAllowList") {
        ruleSet = {
          ...r.ruleSet,
          type: "ProgramAllowList",
          addresses: r.ruleSet.fields[0]
        };
      } else if (r.ruleSet.__kind === "ProgramDenyList") {
        ruleSet = {
          ...r.ruleSet,
          type: "ProgramDenyList",
          addresses: r.ruleSet.fields[0]
        };
      } else {
        ruleSet = {
          ...r.ruleSet,
          type: r.ruleSet.__kind
        };
      }
      return {
        ...r,
        ruleSet
      };
    }
    exports2.royaltiesFromBase = royaltiesFromBase;
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/utils/utf8.mjs
function utf8Count(str) {
  const strLength = str.length;
  let byteLength = 0;
  let pos = 0;
  while (pos < strLength) {
    let value = str.charCodeAt(pos++);
    if ((value & 4294967168) === 0) {
      byteLength++;
      continue;
    } else if ((value & 4294965248) === 0) {
      byteLength += 2;
    } else {
      if (value >= 55296 && value <= 56319) {
        if (pos < strLength) {
          const extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
      }
      if ((value & 4294901760) === 0) {
        byteLength += 3;
      } else {
        byteLength += 4;
      }
    }
  }
  return byteLength;
}
function utf8EncodeJs(str, output, outputOffset) {
  const strLength = str.length;
  let offset = outputOffset;
  let pos = 0;
  while (pos < strLength) {
    let value = str.charCodeAt(pos++);
    if ((value & 4294967168) === 0) {
      output[offset++] = value;
      continue;
    } else if ((value & 4294965248) === 0) {
      output[offset++] = value >> 6 & 31 | 192;
    } else {
      if (value >= 55296 && value <= 56319) {
        if (pos < strLength) {
          const extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
      }
      if ((value & 4294901760) === 0) {
        output[offset++] = value >> 12 & 15 | 224;
        output[offset++] = value >> 6 & 63 | 128;
      } else {
        output[offset++] = value >> 18 & 7 | 240;
        output[offset++] = value >> 12 & 63 | 128;
        output[offset++] = value >> 6 & 63 | 128;
      }
    }
    output[offset++] = value & 63 | 128;
  }
}
function utf8EncodeTE(str, output, outputOffset) {
  sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
}
function utf8Encode(str, output, outputOffset) {
  if (str.length > TEXT_ENCODER_THRESHOLD) {
    utf8EncodeTE(str, output, outputOffset);
  } else {
    utf8EncodeJs(str, output, outputOffset);
  }
}
function utf8DecodeJs(bytes, inputOffset, byteLength) {
  let offset = inputOffset;
  const end = offset + byteLength;
  const units = [];
  let result = "";
  while (offset < end) {
    const byte1 = bytes[offset++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      const byte2 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 6 | byte2);
    } else if ((byte1 & 240) === 224) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
    } else if ((byte1 & 248) === 240) {
      const byte2 = bytes[offset++] & 63;
      const byte3 = bytes[offset++] & 63;
      const byte4 = bytes[offset++] & 63;
      let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (unit > 65535) {
        unit -= 65536;
        units.push(unit >>> 10 & 1023 | 55296);
        unit = 56320 | unit & 1023;
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }
    if (units.length >= CHUNK_SIZE) {
      result += String.fromCharCode(...units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += String.fromCharCode(...units);
  }
  return result;
}
function utf8DecodeTD(bytes, inputOffset, byteLength) {
  const stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
  return sharedTextDecoder.decode(stringBytes);
}
function utf8Decode(bytes, inputOffset, byteLength) {
  if (byteLength > TEXT_DECODER_THRESHOLD) {
    return utf8DecodeTD(bytes, inputOffset, byteLength);
  } else {
    return utf8DecodeJs(bytes, inputOffset, byteLength);
  }
}
var sharedTextEncoder, TEXT_ENCODER_THRESHOLD, CHUNK_SIZE, sharedTextDecoder, TEXT_DECODER_THRESHOLD;
var init_utf8 = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/utils/utf8.mjs"() {
    "use strict";
    sharedTextEncoder = new TextEncoder();
    TEXT_ENCODER_THRESHOLD = 50;
    CHUNK_SIZE = 4096;
    sharedTextDecoder = new TextDecoder();
    TEXT_DECODER_THRESHOLD = 200;
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/ExtData.mjs
var ExtData;
var init_ExtData = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/ExtData.mjs"() {
    "use strict";
    ExtData = class {
      constructor(type, data) {
        this.type = type;
        this.data = data;
      }
    };
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/DecodeError.mjs
var DecodeError;
var init_DecodeError = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/DecodeError.mjs"() {
    "use strict";
    DecodeError = class _DecodeError extends Error {
      constructor(message) {
        super(message);
        const proto = Object.create(_DecodeError.prototype);
        Object.setPrototypeOf(this, proto);
        Object.defineProperty(this, "name", {
          configurable: true,
          enumerable: false,
          value: _DecodeError.name
        });
      }
    };
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/utils/int.mjs
function setUint64(view, offset, value) {
  const high = value / 4294967296;
  const low = value;
  view.setUint32(offset, high);
  view.setUint32(offset + 4, low);
}
function setInt64(view, offset, value) {
  const high = Math.floor(value / 4294967296);
  const low = value;
  view.setUint32(offset, high);
  view.setUint32(offset + 4, low);
}
function getInt64(view, offset) {
  const high = view.getInt32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}
function getUint64(view, offset) {
  const high = view.getUint32(offset);
  const low = view.getUint32(offset + 4);
  return high * 4294967296 + low;
}
var UINT32_MAX;
var init_int = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/utils/int.mjs"() {
    "use strict";
    UINT32_MAX = 4294967295;
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/timestamp.mjs
function encodeTimeSpecToTimestamp({ sec, nsec }) {
  if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
    if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
      const rv = new Uint8Array(4);
      const view = new DataView(rv.buffer);
      view.setUint32(0, sec);
      return rv;
    } else {
      const secHigh = sec / 4294967296;
      const secLow = sec & 4294967295;
      const rv = new Uint8Array(8);
      const view = new DataView(rv.buffer);
      view.setUint32(0, nsec << 2 | secHigh & 3);
      view.setUint32(4, secLow);
      return rv;
    }
  } else {
    const rv = new Uint8Array(12);
    const view = new DataView(rv.buffer);
    view.setUint32(0, nsec);
    setInt64(view, 4, sec);
    return rv;
  }
}
function encodeDateToTimeSpec(date) {
  const msec = date.getTime();
  const sec = Math.floor(msec / 1e3);
  const nsec = (msec - sec * 1e3) * 1e6;
  const nsecInSec = Math.floor(nsec / 1e9);
  return {
    sec: sec + nsecInSec,
    nsec: nsec - nsecInSec * 1e9
  };
}
function encodeTimestampExtension(object) {
  if (object instanceof Date) {
    const timeSpec = encodeDateToTimeSpec(object);
    return encodeTimeSpecToTimestamp(timeSpec);
  } else {
    return null;
  }
}
function decodeTimestampToTimeSpec(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  switch (data.byteLength) {
    case 4: {
      const sec = view.getUint32(0);
      const nsec = 0;
      return { sec, nsec };
    }
    case 8: {
      const nsec30AndSecHigh2 = view.getUint32(0);
      const secLow32 = view.getUint32(4);
      const sec = (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32;
      const nsec = nsec30AndSecHigh2 >>> 2;
      return { sec, nsec };
    }
    case 12: {
      const sec = getInt64(view, 4);
      const nsec = view.getUint32(0);
      return { sec, nsec };
    }
    default:
      throw new DecodeError(`Unrecognized data size for timestamp (expected 4, 8, or 12): ${data.length}`);
  }
}
function decodeTimestampExtension(data) {
  const timeSpec = decodeTimestampToTimeSpec(data);
  return new Date(timeSpec.sec * 1e3 + timeSpec.nsec / 1e6);
}
var EXT_TIMESTAMP, TIMESTAMP32_MAX_SEC, TIMESTAMP64_MAX_SEC, timestampExtension;
var init_timestamp = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/timestamp.mjs"() {
    "use strict";
    init_DecodeError();
    init_int();
    EXT_TIMESTAMP = -1;
    TIMESTAMP32_MAX_SEC = 4294967296 - 1;
    TIMESTAMP64_MAX_SEC = 17179869184 - 1;
    timestampExtension = {
      type: EXT_TIMESTAMP,
      encode: encodeTimestampExtension,
      decode: decodeTimestampExtension
    };
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/ExtensionCodec.mjs
var ExtensionCodec;
var init_ExtensionCodec = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/ExtensionCodec.mjs"() {
    "use strict";
    init_ExtData();
    init_timestamp();
    ExtensionCodec = class {
      constructor() {
        this.builtInEncoders = [];
        this.builtInDecoders = [];
        this.encoders = [];
        this.decoders = [];
        this.register(timestampExtension);
      }
      register({ type, encode: encode2, decode: decode2 }) {
        if (type >= 0) {
          this.encoders[type] = encode2;
          this.decoders[type] = decode2;
        } else {
          const index = -1 - type;
          this.builtInEncoders[index] = encode2;
          this.builtInDecoders[index] = decode2;
        }
      }
      tryToEncode(object, context) {
        for (let i = 0; i < this.builtInEncoders.length; i++) {
          const encodeExt = this.builtInEncoders[i];
          if (encodeExt != null) {
            const data = encodeExt(object, context);
            if (data != null) {
              const type = -1 - i;
              return new ExtData(type, data);
            }
          }
        }
        for (let i = 0; i < this.encoders.length; i++) {
          const encodeExt = this.encoders[i];
          if (encodeExt != null) {
            const data = encodeExt(object, context);
            if (data != null) {
              const type = i;
              return new ExtData(type, data);
            }
          }
        }
        if (object instanceof ExtData) {
          return object;
        }
        return null;
      }
      decode(data, type, context) {
        const decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
        if (decodeExt) {
          return decodeExt(data, type, context);
        } else {
          return new ExtData(type, data);
        }
      }
    };
    ExtensionCodec.defaultCodec = new ExtensionCodec();
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/utils/typedArrays.mjs
function isArrayBufferLike(buffer) {
  return buffer instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer;
}
function ensureUint8Array(buffer) {
  if (buffer instanceof Uint8Array) {
    return buffer;
  } else if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (isArrayBufferLike(buffer)) {
    return new Uint8Array(buffer);
  } else {
    return Uint8Array.from(buffer);
  }
}
var init_typedArrays = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/utils/typedArrays.mjs"() {
    "use strict";
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/Encoder.mjs
var DEFAULT_MAX_DEPTH, DEFAULT_INITIAL_BUFFER_SIZE, Encoder;
var init_Encoder = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/Encoder.mjs"() {
    "use strict";
    init_utf8();
    init_ExtensionCodec();
    init_int();
    init_typedArrays();
    DEFAULT_MAX_DEPTH = 100;
    DEFAULT_INITIAL_BUFFER_SIZE = 2048;
    Encoder = class _Encoder {
      constructor(options) {
        this.entered = false;
        this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
        this.context = options?.context;
        this.useBigInt64 = options?.useBigInt64 ?? false;
        this.maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
        this.initialBufferSize = options?.initialBufferSize ?? DEFAULT_INITIAL_BUFFER_SIZE;
        this.sortKeys = options?.sortKeys ?? false;
        this.forceFloat32 = options?.forceFloat32 ?? false;
        this.ignoreUndefined = options?.ignoreUndefined ?? false;
        this.forceIntegerToFloat = options?.forceIntegerToFloat ?? false;
        this.pos = 0;
        this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
        this.bytes = new Uint8Array(this.view.buffer);
      }
      clone() {
        return new _Encoder({
          extensionCodec: this.extensionCodec,
          context: this.context,
          useBigInt64: this.useBigInt64,
          maxDepth: this.maxDepth,
          initialBufferSize: this.initialBufferSize,
          sortKeys: this.sortKeys,
          forceFloat32: this.forceFloat32,
          ignoreUndefined: this.ignoreUndefined,
          forceIntegerToFloat: this.forceIntegerToFloat
        });
      }
      reinitializeState() {
        this.pos = 0;
      }
      /**
       * This is almost equivalent to {@link Encoder#encode}, but it returns an reference of the encoder's internal buffer and thus much faster than {@link Encoder#encode}.
       *
       * @returns Encodes the object and returns a shared reference the encoder's internal buffer.
       */
      encodeSharedRef(object) {
        if (this.entered) {
          const instance = this.clone();
          return instance.encodeSharedRef(object);
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.doEncode(object, 1);
          return this.bytes.subarray(0, this.pos);
        } finally {
          this.entered = false;
        }
      }
      /**
       * @returns Encodes the object and returns a copy of the encoder's internal buffer.
       */
      encode(object) {
        if (this.entered) {
          const instance = this.clone();
          return instance.encode(object);
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.doEncode(object, 1);
          return this.bytes.slice(0, this.pos);
        } finally {
          this.entered = false;
        }
      }
      doEncode(object, depth) {
        if (depth > this.maxDepth) {
          throw new Error(`Too deep objects in depth ${depth}`);
        }
        if (object == null) {
          this.encodeNil();
        } else if (typeof object === "boolean") {
          this.encodeBoolean(object);
        } else if (typeof object === "number") {
          if (!this.forceIntegerToFloat) {
            this.encodeNumber(object);
          } else {
            this.encodeNumberAsFloat(object);
          }
        } else if (typeof object === "string") {
          this.encodeString(object);
        } else if (this.useBigInt64 && typeof object === "bigint") {
          this.encodeBigInt64(object);
        } else {
          this.encodeObject(object, depth);
        }
      }
      ensureBufferSizeToWrite(sizeToWrite) {
        const requiredSize = this.pos + sizeToWrite;
        if (this.view.byteLength < requiredSize) {
          this.resizeBuffer(requiredSize * 2);
        }
      }
      resizeBuffer(newSize) {
        const newBuffer = new ArrayBuffer(newSize);
        const newBytes = new Uint8Array(newBuffer);
        const newView = new DataView(newBuffer);
        newBytes.set(this.bytes);
        this.view = newView;
        this.bytes = newBytes;
      }
      encodeNil() {
        this.writeU8(192);
      }
      encodeBoolean(object) {
        if (object === false) {
          this.writeU8(194);
        } else {
          this.writeU8(195);
        }
      }
      encodeNumber(object) {
        if (!this.forceIntegerToFloat && Number.isSafeInteger(object)) {
          if (object >= 0) {
            if (object < 128) {
              this.writeU8(object);
            } else if (object < 256) {
              this.writeU8(204);
              this.writeU8(object);
            } else if (object < 65536) {
              this.writeU8(205);
              this.writeU16(object);
            } else if (object < 4294967296) {
              this.writeU8(206);
              this.writeU32(object);
            } else if (!this.useBigInt64) {
              this.writeU8(207);
              this.writeU64(object);
            } else {
              this.encodeNumberAsFloat(object);
            }
          } else {
            if (object >= -32) {
              this.writeU8(224 | object + 32);
            } else if (object >= -128) {
              this.writeU8(208);
              this.writeI8(object);
            } else if (object >= -32768) {
              this.writeU8(209);
              this.writeI16(object);
            } else if (object >= -2147483648) {
              this.writeU8(210);
              this.writeI32(object);
            } else if (!this.useBigInt64) {
              this.writeU8(211);
              this.writeI64(object);
            } else {
              this.encodeNumberAsFloat(object);
            }
          }
        } else {
          this.encodeNumberAsFloat(object);
        }
      }
      encodeNumberAsFloat(object) {
        if (this.forceFloat32) {
          this.writeU8(202);
          this.writeF32(object);
        } else {
          this.writeU8(203);
          this.writeF64(object);
        }
      }
      encodeBigInt64(object) {
        if (object >= BigInt(0)) {
          this.writeU8(207);
          this.writeBigUint64(object);
        } else {
          this.writeU8(211);
          this.writeBigInt64(object);
        }
      }
      writeStringHeader(byteLength) {
        if (byteLength < 32) {
          this.writeU8(160 + byteLength);
        } else if (byteLength < 256) {
          this.writeU8(217);
          this.writeU8(byteLength);
        } else if (byteLength < 65536) {
          this.writeU8(218);
          this.writeU16(byteLength);
        } else if (byteLength < 4294967296) {
          this.writeU8(219);
          this.writeU32(byteLength);
        } else {
          throw new Error(`Too long string: ${byteLength} bytes in UTF-8`);
        }
      }
      encodeString(object) {
        const maxHeaderSize = 1 + 4;
        const byteLength = utf8Count(object);
        this.ensureBufferSizeToWrite(maxHeaderSize + byteLength);
        this.writeStringHeader(byteLength);
        utf8Encode(object, this.bytes, this.pos);
        this.pos += byteLength;
      }
      encodeObject(object, depth) {
        const ext = this.extensionCodec.tryToEncode(object, this.context);
        if (ext != null) {
          this.encodeExtension(ext);
        } else if (Array.isArray(object)) {
          this.encodeArray(object, depth);
        } else if (ArrayBuffer.isView(object)) {
          this.encodeBinary(object);
        } else if (typeof object === "object") {
          this.encodeMap(object, depth);
        } else {
          throw new Error(`Unrecognized object: ${Object.prototype.toString.apply(object)}`);
        }
      }
      encodeBinary(object) {
        const size = object.byteLength;
        if (size < 256) {
          this.writeU8(196);
          this.writeU8(size);
        } else if (size < 65536) {
          this.writeU8(197);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(198);
          this.writeU32(size);
        } else {
          throw new Error(`Too large binary: ${size}`);
        }
        const bytes = ensureUint8Array(object);
        this.writeU8a(bytes);
      }
      encodeArray(object, depth) {
        const size = object.length;
        if (size < 16) {
          this.writeU8(144 + size);
        } else if (size < 65536) {
          this.writeU8(220);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(221);
          this.writeU32(size);
        } else {
          throw new Error(`Too large array: ${size}`);
        }
        for (const item of object) {
          this.doEncode(item, depth + 1);
        }
      }
      countWithoutUndefined(object, keys) {
        let count = 0;
        for (const key of keys) {
          if (object[key] !== void 0) {
            count++;
          }
        }
        return count;
      }
      encodeMap(object, depth) {
        const keys = Object.keys(object);
        if (this.sortKeys) {
          keys.sort();
        }
        const size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
        if (size < 16) {
          this.writeU8(128 + size);
        } else if (size < 65536) {
          this.writeU8(222);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(223);
          this.writeU32(size);
        } else {
          throw new Error(`Too large map object: ${size}`);
        }
        for (const key of keys) {
          const value = object[key];
          if (!(this.ignoreUndefined && value === void 0)) {
            this.encodeString(key);
            this.doEncode(value, depth + 1);
          }
        }
      }
      encodeExtension(ext) {
        if (typeof ext.data === "function") {
          const data = ext.data(this.pos + 6);
          const size2 = data.length;
          if (size2 >= 4294967296) {
            throw new Error(`Too large extension object: ${size2}`);
          }
          this.writeU8(201);
          this.writeU32(size2);
          this.writeI8(ext.type);
          this.writeU8a(data);
          return;
        }
        const size = ext.data.length;
        if (size === 1) {
          this.writeU8(212);
        } else if (size === 2) {
          this.writeU8(213);
        } else if (size === 4) {
          this.writeU8(214);
        } else if (size === 8) {
          this.writeU8(215);
        } else if (size === 16) {
          this.writeU8(216);
        } else if (size < 256) {
          this.writeU8(199);
          this.writeU8(size);
        } else if (size < 65536) {
          this.writeU8(200);
          this.writeU16(size);
        } else if (size < 4294967296) {
          this.writeU8(201);
          this.writeU32(size);
        } else {
          throw new Error(`Too large extension object: ${size}`);
        }
        this.writeI8(ext.type);
        this.writeU8a(ext.data);
      }
      writeU8(value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setUint8(this.pos, value);
        this.pos++;
      }
      writeU8a(values) {
        const size = values.length;
        this.ensureBufferSizeToWrite(size);
        this.bytes.set(values, this.pos);
        this.pos += size;
      }
      writeI8(value) {
        this.ensureBufferSizeToWrite(1);
        this.view.setInt8(this.pos, value);
        this.pos++;
      }
      writeU16(value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setUint16(this.pos, value);
        this.pos += 2;
      }
      writeI16(value) {
        this.ensureBufferSizeToWrite(2);
        this.view.setInt16(this.pos, value);
        this.pos += 2;
      }
      writeU32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setUint32(this.pos, value);
        this.pos += 4;
      }
      writeI32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setInt32(this.pos, value);
        this.pos += 4;
      }
      writeF32(value) {
        this.ensureBufferSizeToWrite(4);
        this.view.setFloat32(this.pos, value);
        this.pos += 4;
      }
      writeF64(value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setFloat64(this.pos, value);
        this.pos += 8;
      }
      writeU64(value) {
        this.ensureBufferSizeToWrite(8);
        setUint64(this.view, this.pos, value);
        this.pos += 8;
      }
      writeI64(value) {
        this.ensureBufferSizeToWrite(8);
        setInt64(this.view, this.pos, value);
        this.pos += 8;
      }
      writeBigUint64(value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setBigUint64(this.pos, value);
        this.pos += 8;
      }
      writeBigInt64(value) {
        this.ensureBufferSizeToWrite(8);
        this.view.setBigInt64(this.pos, value);
        this.pos += 8;
      }
    };
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/encode.mjs
function encode(value, options) {
  const encoder = new Encoder(options);
  return encoder.encodeSharedRef(value);
}
var init_encode = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/encode.mjs"() {
    "use strict";
    init_Encoder();
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/utils/prettyByte.mjs
function prettyByte(byte) {
  return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
}
var init_prettyByte = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/utils/prettyByte.mjs"() {
    "use strict";
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/CachedKeyDecoder.mjs
var DEFAULT_MAX_KEY_LENGTH, DEFAULT_MAX_LENGTH_PER_KEY, CachedKeyDecoder;
var init_CachedKeyDecoder = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/CachedKeyDecoder.mjs"() {
    "use strict";
    init_utf8();
    DEFAULT_MAX_KEY_LENGTH = 16;
    DEFAULT_MAX_LENGTH_PER_KEY = 16;
    CachedKeyDecoder = class {
      constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
        this.hit = 0;
        this.miss = 0;
        this.maxKeyLength = maxKeyLength;
        this.maxLengthPerKey = maxLengthPerKey;
        this.caches = [];
        for (let i = 0; i < this.maxKeyLength; i++) {
          this.caches.push([]);
        }
      }
      canBeCached(byteLength) {
        return byteLength > 0 && byteLength <= this.maxKeyLength;
      }
      find(bytes, inputOffset, byteLength) {
        const records = this.caches[byteLength - 1];
        FIND_CHUNK: for (const record of records) {
          const recordBytes = record.bytes;
          for (let j = 0; j < byteLength; j++) {
            if (recordBytes[j] !== bytes[inputOffset + j]) {
              continue FIND_CHUNK;
            }
          }
          return record.str;
        }
        return null;
      }
      store(bytes, value) {
        const records = this.caches[bytes.length - 1];
        const record = { bytes, str: value };
        if (records.length >= this.maxLengthPerKey) {
          records[Math.random() * records.length | 0] = record;
        } else {
          records.push(record);
        }
      }
      decode(bytes, inputOffset, byteLength) {
        const cachedValue = this.find(bytes, inputOffset, byteLength);
        if (cachedValue != null) {
          this.hit++;
          return cachedValue;
        }
        this.miss++;
        const str = utf8DecodeJs(bytes, inputOffset, byteLength);
        const slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
        this.store(slicedCopyOfBytes, str);
        return str;
      }
    };
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/Decoder.mjs
var STATE_ARRAY, STATE_MAP_KEY, STATE_MAP_VALUE, mapKeyConverter, StackPool, HEAD_BYTE_REQUIRED, EMPTY_VIEW, EMPTY_BYTES, MORE_DATA, sharedCachedKeyDecoder, Decoder;
var init_Decoder = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/Decoder.mjs"() {
    "use strict";
    init_prettyByte();
    init_ExtensionCodec();
    init_int();
    init_utf8();
    init_typedArrays();
    init_CachedKeyDecoder();
    init_DecodeError();
    STATE_ARRAY = "array";
    STATE_MAP_KEY = "map_key";
    STATE_MAP_VALUE = "map_value";
    mapKeyConverter = (key) => {
      if (typeof key === "string" || typeof key === "number") {
        return key;
      }
      throw new DecodeError("The type of key must be string or number but " + typeof key);
    };
    StackPool = class {
      constructor() {
        this.stack = [];
        this.stackHeadPosition = -1;
      }
      get length() {
        return this.stackHeadPosition + 1;
      }
      top() {
        return this.stack[this.stackHeadPosition];
      }
      pushArrayState(size) {
        const state = this.getUninitializedStateFromPool();
        state.type = STATE_ARRAY;
        state.position = 0;
        state.size = size;
        state.array = new Array(size);
      }
      pushMapState(size) {
        const state = this.getUninitializedStateFromPool();
        state.type = STATE_MAP_KEY;
        state.readCount = 0;
        state.size = size;
        state.map = {};
      }
      getUninitializedStateFromPool() {
        this.stackHeadPosition++;
        if (this.stackHeadPosition === this.stack.length) {
          const partialState = {
            type: void 0,
            size: 0,
            array: void 0,
            position: 0,
            readCount: 0,
            map: void 0,
            key: null
          };
          this.stack.push(partialState);
        }
        return this.stack[this.stackHeadPosition];
      }
      release(state) {
        const topStackState = this.stack[this.stackHeadPosition];
        if (topStackState !== state) {
          throw new Error("Invalid stack state. Released state is not on top of the stack.");
        }
        if (state.type === STATE_ARRAY) {
          const partialState = state;
          partialState.size = 0;
          partialState.array = void 0;
          partialState.position = 0;
          partialState.type = void 0;
        }
        if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
          const partialState = state;
          partialState.size = 0;
          partialState.map = void 0;
          partialState.readCount = 0;
          partialState.type = void 0;
        }
        this.stackHeadPosition--;
      }
      reset() {
        this.stack.length = 0;
        this.stackHeadPosition = -1;
      }
    };
    HEAD_BYTE_REQUIRED = -1;
    EMPTY_VIEW = new DataView(new ArrayBuffer(0));
    EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
    try {
      EMPTY_VIEW.getInt8(0);
    } catch (e) {
      if (!(e instanceof RangeError)) {
        throw new Error("This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access");
      }
    }
    MORE_DATA = new RangeError("Insufficient data");
    sharedCachedKeyDecoder = new CachedKeyDecoder();
    Decoder = class _Decoder {
      constructor(options) {
        this.totalPos = 0;
        this.pos = 0;
        this.view = EMPTY_VIEW;
        this.bytes = EMPTY_BYTES;
        this.headByte = HEAD_BYTE_REQUIRED;
        this.stack = new StackPool();
        this.entered = false;
        this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
        this.context = options?.context;
        this.useBigInt64 = options?.useBigInt64 ?? false;
        this.rawStrings = options?.rawStrings ?? false;
        this.maxStrLength = options?.maxStrLength ?? UINT32_MAX;
        this.maxBinLength = options?.maxBinLength ?? UINT32_MAX;
        this.maxArrayLength = options?.maxArrayLength ?? UINT32_MAX;
        this.maxMapLength = options?.maxMapLength ?? UINT32_MAX;
        this.maxExtLength = options?.maxExtLength ?? UINT32_MAX;
        this.keyDecoder = options?.keyDecoder !== void 0 ? options.keyDecoder : sharedCachedKeyDecoder;
        this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
      }
      clone() {
        return new _Decoder({
          extensionCodec: this.extensionCodec,
          context: this.context,
          useBigInt64: this.useBigInt64,
          rawStrings: this.rawStrings,
          maxStrLength: this.maxStrLength,
          maxBinLength: this.maxBinLength,
          maxArrayLength: this.maxArrayLength,
          maxMapLength: this.maxMapLength,
          maxExtLength: this.maxExtLength,
          keyDecoder: this.keyDecoder
        });
      }
      reinitializeState() {
        this.totalPos = 0;
        this.headByte = HEAD_BYTE_REQUIRED;
        this.stack.reset();
      }
      setBuffer(buffer) {
        const bytes = ensureUint8Array(buffer);
        this.bytes = bytes;
        this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        this.pos = 0;
      }
      appendBuffer(buffer) {
        if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
          this.setBuffer(buffer);
        } else {
          const remainingData = this.bytes.subarray(this.pos);
          const newData = ensureUint8Array(buffer);
          const newBuffer = new Uint8Array(remainingData.length + newData.length);
          newBuffer.set(remainingData);
          newBuffer.set(newData, remainingData.length);
          this.setBuffer(newBuffer);
        }
      }
      hasRemaining(size) {
        return this.view.byteLength - this.pos >= size;
      }
      createExtraByteError(posToShow) {
        const { view, pos } = this;
        return new RangeError(`Extra ${view.byteLength - pos} of ${view.byteLength} byte(s) found at buffer[${posToShow}]`);
      }
      /**
       * @throws {@link DecodeError}
       * @throws {@link RangeError}
       */
      decode(buffer) {
        if (this.entered) {
          const instance = this.clone();
          return instance.decode(buffer);
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.setBuffer(buffer);
          const object = this.doDecodeSync();
          if (this.hasRemaining(1)) {
            throw this.createExtraByteError(this.pos);
          }
          return object;
        } finally {
          this.entered = false;
        }
      }
      *decodeMulti(buffer) {
        if (this.entered) {
          const instance = this.clone();
          yield* instance.decodeMulti(buffer);
          return;
        }
        try {
          this.entered = true;
          this.reinitializeState();
          this.setBuffer(buffer);
          while (this.hasRemaining(1)) {
            yield this.doDecodeSync();
          }
        } finally {
          this.entered = false;
        }
      }
      async decodeAsync(stream) {
        if (this.entered) {
          const instance = this.clone();
          return instance.decodeAsync(stream);
        }
        try {
          this.entered = true;
          let decoded = false;
          let object;
          for await (const buffer of stream) {
            if (decoded) {
              this.entered = false;
              throw this.createExtraByteError(this.totalPos);
            }
            this.appendBuffer(buffer);
            try {
              object = this.doDecodeSync();
              decoded = true;
            } catch (e) {
              if (!(e instanceof RangeError)) {
                throw e;
              }
            }
            this.totalPos += this.pos;
          }
          if (decoded) {
            if (this.hasRemaining(1)) {
              throw this.createExtraByteError(this.totalPos);
            }
            return object;
          }
          const { headByte, pos, totalPos } = this;
          throw new RangeError(`Insufficient data in parsing ${prettyByte(headByte)} at ${totalPos} (${pos} in the current buffer)`);
        } finally {
          this.entered = false;
        }
      }
      decodeArrayStream(stream) {
        return this.decodeMultiAsync(stream, true);
      }
      decodeStream(stream) {
        return this.decodeMultiAsync(stream, false);
      }
      async *decodeMultiAsync(stream, isArray) {
        if (this.entered) {
          const instance = this.clone();
          yield* instance.decodeMultiAsync(stream, isArray);
          return;
        }
        try {
          this.entered = true;
          let isArrayHeaderRequired = isArray;
          let arrayItemsLeft = -1;
          for await (const buffer of stream) {
            if (isArray && arrayItemsLeft === 0) {
              throw this.createExtraByteError(this.totalPos);
            }
            this.appendBuffer(buffer);
            if (isArrayHeaderRequired) {
              arrayItemsLeft = this.readArraySize();
              isArrayHeaderRequired = false;
              this.complete();
            }
            try {
              while (true) {
                yield this.doDecodeSync();
                if (--arrayItemsLeft === 0) {
                  break;
                }
              }
            } catch (e) {
              if (!(e instanceof RangeError)) {
                throw e;
              }
            }
            this.totalPos += this.pos;
          }
        } finally {
          this.entered = false;
        }
      }
      doDecodeSync() {
        DECODE: while (true) {
          const headByte = this.readHeadByte();
          let object;
          if (headByte >= 224) {
            object = headByte - 256;
          } else if (headByte < 192) {
            if (headByte < 128) {
              object = headByte;
            } else if (headByte < 144) {
              const size = headByte - 128;
              if (size !== 0) {
                this.pushMapState(size);
                this.complete();
                continue DECODE;
              } else {
                object = {};
              }
            } else if (headByte < 160) {
              const size = headByte - 144;
              if (size !== 0) {
                this.pushArrayState(size);
                this.complete();
                continue DECODE;
              } else {
                object = [];
              }
            } else {
              const byteLength = headByte - 160;
              object = this.decodeString(byteLength, 0);
            }
          } else if (headByte === 192) {
            object = null;
          } else if (headByte === 194) {
            object = false;
          } else if (headByte === 195) {
            object = true;
          } else if (headByte === 202) {
            object = this.readF32();
          } else if (headByte === 203) {
            object = this.readF64();
          } else if (headByte === 204) {
            object = this.readU8();
          } else if (headByte === 205) {
            object = this.readU16();
          } else if (headByte === 206) {
            object = this.readU32();
          } else if (headByte === 207) {
            if (this.useBigInt64) {
              object = this.readU64AsBigInt();
            } else {
              object = this.readU64();
            }
          } else if (headByte === 208) {
            object = this.readI8();
          } else if (headByte === 209) {
            object = this.readI16();
          } else if (headByte === 210) {
            object = this.readI32();
          } else if (headByte === 211) {
            if (this.useBigInt64) {
              object = this.readI64AsBigInt();
            } else {
              object = this.readI64();
            }
          } else if (headByte === 217) {
            const byteLength = this.lookU8();
            object = this.decodeString(byteLength, 1);
          } else if (headByte === 218) {
            const byteLength = this.lookU16();
            object = this.decodeString(byteLength, 2);
          } else if (headByte === 219) {
            const byteLength = this.lookU32();
            object = this.decodeString(byteLength, 4);
          } else if (headByte === 220) {
            const size = this.readU16();
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue DECODE;
            } else {
              object = [];
            }
          } else if (headByte === 221) {
            const size = this.readU32();
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue DECODE;
            } else {
              object = [];
            }
          } else if (headByte === 222) {
            const size = this.readU16();
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue DECODE;
            } else {
              object = {};
            }
          } else if (headByte === 223) {
            const size = this.readU32();
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue DECODE;
            } else {
              object = {};
            }
          } else if (headByte === 196) {
            const size = this.lookU8();
            object = this.decodeBinary(size, 1);
          } else if (headByte === 197) {
            const size = this.lookU16();
            object = this.decodeBinary(size, 2);
          } else if (headByte === 198) {
            const size = this.lookU32();
            object = this.decodeBinary(size, 4);
          } else if (headByte === 212) {
            object = this.decodeExtension(1, 0);
          } else if (headByte === 213) {
            object = this.decodeExtension(2, 0);
          } else if (headByte === 214) {
            object = this.decodeExtension(4, 0);
          } else if (headByte === 215) {
            object = this.decodeExtension(8, 0);
          } else if (headByte === 216) {
            object = this.decodeExtension(16, 0);
          } else if (headByte === 199) {
            const size = this.lookU8();
            object = this.decodeExtension(size, 1);
          } else if (headByte === 200) {
            const size = this.lookU16();
            object = this.decodeExtension(size, 2);
          } else if (headByte === 201) {
            const size = this.lookU32();
            object = this.decodeExtension(size, 4);
          } else {
            throw new DecodeError(`Unrecognized type byte: ${prettyByte(headByte)}`);
          }
          this.complete();
          const stack = this.stack;
          while (stack.length > 0) {
            const state = stack.top();
            if (state.type === STATE_ARRAY) {
              state.array[state.position] = object;
              state.position++;
              if (state.position === state.size) {
                object = state.array;
                stack.release(state);
              } else {
                continue DECODE;
              }
            } else if (state.type === STATE_MAP_KEY) {
              if (object === "__proto__") {
                throw new DecodeError("The key __proto__ is not allowed");
              }
              state.key = this.mapKeyConverter(object);
              state.type = STATE_MAP_VALUE;
              continue DECODE;
            } else {
              state.map[state.key] = object;
              state.readCount++;
              if (state.readCount === state.size) {
                object = state.map;
                stack.release(state);
              } else {
                state.key = null;
                state.type = STATE_MAP_KEY;
                continue DECODE;
              }
            }
          }
          return object;
        }
      }
      readHeadByte() {
        if (this.headByte === HEAD_BYTE_REQUIRED) {
          this.headByte = this.readU8();
        }
        return this.headByte;
      }
      complete() {
        this.headByte = HEAD_BYTE_REQUIRED;
      }
      readArraySize() {
        const headByte = this.readHeadByte();
        switch (headByte) {
          case 220:
            return this.readU16();
          case 221:
            return this.readU32();
          default: {
            if (headByte < 160) {
              return headByte - 144;
            } else {
              throw new DecodeError(`Unrecognized array type byte: ${prettyByte(headByte)}`);
            }
          }
        }
      }
      pushMapState(size) {
        if (size > this.maxMapLength) {
          throw new DecodeError(`Max length exceeded: map length (${size}) > maxMapLengthLength (${this.maxMapLength})`);
        }
        this.stack.pushMapState(size);
      }
      pushArrayState(size) {
        if (size > this.maxArrayLength) {
          throw new DecodeError(`Max length exceeded: array length (${size}) > maxArrayLength (${this.maxArrayLength})`);
        }
        this.stack.pushArrayState(size);
      }
      decodeString(byteLength, headerOffset) {
        if (!this.rawStrings || this.stateIsMapKey()) {
          return this.decodeUtf8String(byteLength, headerOffset);
        }
        return this.decodeBinary(byteLength, headerOffset);
      }
      /**
       * @throws {@link RangeError}
       */
      decodeUtf8String(byteLength, headerOffset) {
        if (byteLength > this.maxStrLength) {
          throw new DecodeError(`Max length exceeded: UTF-8 byte length (${byteLength}) > maxStrLength (${this.maxStrLength})`);
        }
        if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
          throw MORE_DATA;
        }
        const offset = this.pos + headerOffset;
        let object;
        if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) {
          object = this.keyDecoder.decode(this.bytes, offset, byteLength);
        } else {
          object = utf8Decode(this.bytes, offset, byteLength);
        }
        this.pos += headerOffset + byteLength;
        return object;
      }
      stateIsMapKey() {
        if (this.stack.length > 0) {
          const state = this.stack.top();
          return state.type === STATE_MAP_KEY;
        }
        return false;
      }
      /**
       * @throws {@link RangeError}
       */
      decodeBinary(byteLength, headOffset) {
        if (byteLength > this.maxBinLength) {
          throw new DecodeError(`Max length exceeded: bin length (${byteLength}) > maxBinLength (${this.maxBinLength})`);
        }
        if (!this.hasRemaining(byteLength + headOffset)) {
          throw MORE_DATA;
        }
        const offset = this.pos + headOffset;
        const object = this.bytes.subarray(offset, offset + byteLength);
        this.pos += headOffset + byteLength;
        return object;
      }
      decodeExtension(size, headOffset) {
        if (size > this.maxExtLength) {
          throw new DecodeError(`Max length exceeded: ext length (${size}) > maxExtLength (${this.maxExtLength})`);
        }
        const extType = this.view.getInt8(this.pos + headOffset);
        const data = this.decodeBinary(
          size,
          headOffset + 1
          /* extType */
        );
        return this.extensionCodec.decode(data, extType, this.context);
      }
      lookU8() {
        return this.view.getUint8(this.pos);
      }
      lookU16() {
        return this.view.getUint16(this.pos);
      }
      lookU32() {
        return this.view.getUint32(this.pos);
      }
      readU8() {
        const value = this.view.getUint8(this.pos);
        this.pos++;
        return value;
      }
      readI8() {
        const value = this.view.getInt8(this.pos);
        this.pos++;
        return value;
      }
      readU16() {
        const value = this.view.getUint16(this.pos);
        this.pos += 2;
        return value;
      }
      readI16() {
        const value = this.view.getInt16(this.pos);
        this.pos += 2;
        return value;
      }
      readU32() {
        const value = this.view.getUint32(this.pos);
        this.pos += 4;
        return value;
      }
      readI32() {
        const value = this.view.getInt32(this.pos);
        this.pos += 4;
        return value;
      }
      readU64() {
        const value = getUint64(this.view, this.pos);
        this.pos += 8;
        return value;
      }
      readI64() {
        const value = getInt64(this.view, this.pos);
        this.pos += 8;
        return value;
      }
      readU64AsBigInt() {
        const value = this.view.getBigUint64(this.pos);
        this.pos += 8;
        return value;
      }
      readI64AsBigInt() {
        const value = this.view.getBigInt64(this.pos);
        this.pos += 8;
        return value;
      }
      readF32() {
        const value = this.view.getFloat32(this.pos);
        this.pos += 4;
        return value;
      }
      readF64() {
        const value = this.view.getFloat64(this.pos);
        this.pos += 8;
        return value;
      }
    };
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/decode.mjs
function decode(buffer, options) {
  const decoder = new Decoder(options);
  return decoder.decode(buffer);
}
function decodeMulti(buffer, options) {
  const decoder = new Decoder(options);
  return decoder.decodeMulti(buffer);
}
var init_decode = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/decode.mjs"() {
    "use strict";
    init_Decoder();
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/utils/stream.mjs
function isAsyncIterable(object) {
  return object[Symbol.asyncIterator] != null;
}
async function* asyncIterableFromStream(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
function ensureAsyncIterable(streamLike) {
  if (isAsyncIterable(streamLike)) {
    return streamLike;
  } else {
    return asyncIterableFromStream(streamLike);
  }
}
var init_stream = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/utils/stream.mjs"() {
    "use strict";
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/decodeAsync.mjs
async function decodeAsync(streamLike, options) {
  const stream = ensureAsyncIterable(streamLike);
  const decoder = new Decoder(options);
  return decoder.decodeAsync(stream);
}
function decodeArrayStream(streamLike, options) {
  const stream = ensureAsyncIterable(streamLike);
  const decoder = new Decoder(options);
  return decoder.decodeArrayStream(stream);
}
function decodeMultiStream(streamLike, options) {
  const stream = ensureAsyncIterable(streamLike);
  const decoder = new Decoder(options);
  return decoder.decodeStream(stream);
}
var init_decodeAsync = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/decodeAsync.mjs"() {
    "use strict";
    init_Decoder();
    init_stream();
  }
});

// ../node_modules/@msgpack/msgpack/dist.esm/index.mjs
var dist_exports = {};
__export(dist_exports, {
  DecodeError: () => DecodeError,
  Decoder: () => Decoder,
  EXT_TIMESTAMP: () => EXT_TIMESTAMP,
  Encoder: () => Encoder,
  ExtData: () => ExtData,
  ExtensionCodec: () => ExtensionCodec,
  decode: () => decode,
  decodeArrayStream: () => decodeArrayStream,
  decodeAsync: () => decodeAsync,
  decodeMulti: () => decodeMulti,
  decodeMultiStream: () => decodeMultiStream,
  decodeTimestampExtension: () => decodeTimestampExtension,
  decodeTimestampToTimeSpec: () => decodeTimestampToTimeSpec,
  encode: () => encode,
  encodeDateToTimeSpec: () => encodeDateToTimeSpec,
  encodeTimeSpecToTimestamp: () => encodeTimeSpecToTimestamp,
  encodeTimestampExtension: () => encodeTimestampExtension
});
var init_dist = __esm({
  "../node_modules/@msgpack/msgpack/dist.esm/index.mjs"() {
    "use strict";
    init_encode();
    init_decode();
    init_decodeAsync();
    init_Decoder();
    init_DecodeError();
    init_Encoder();
    init_ExtensionCodec();
    init_ExtData();
    init_timestamp();
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/utils.js
var require_utils3 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.unwrapOption = exports2.someOrNone = exports2.lowercaseFirstLetter = exports2.capitalizeFirstLetter = exports2.toWords = void 0;
    var umi_1 = require_cjs7();
    function toWords(str) {
      const camelCaseRegex = /([a-z0-9])([A-Z])/g;
      return str.replace(camelCaseRegex, "$1 $2");
    }
    exports2.toWords = toWords;
    function capitalizeFirstLetter(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    exports2.capitalizeFirstLetter = capitalizeFirstLetter;
    function lowercaseFirstLetter(str) {
      return str.charAt(0).toLowerCase() + str.slice(1);
    }
    exports2.lowercaseFirstLetter = lowercaseFirstLetter;
    function someOrNone(value) {
      return value !== void 0 ? (0, umi_1.some)(value) : (0, umi_1.none)();
    }
    exports2.someOrNone = someOrNone;
    function unwrapOption(value) {
      return value.__option === "Some" ? value.value : void 0;
    }
    exports2.unwrapOption = unwrapOption;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/pluginAuthority.js
var require_pluginAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/pluginAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.comparePluginAuthorities = exports2.pluginAuthorityFromBase = exports2.pluginAuthorityToBase = void 0;
    function pluginAuthorityToBase(u) {
      if (u.type === "Address") {
        return {
          __kind: "Address",
          address: u.address
        };
      }
      return {
        __kind: u.type
      };
    }
    exports2.pluginAuthorityToBase = pluginAuthorityToBase;
    function pluginAuthorityFromBase(authority) {
      return {
        type: authority.__kind,
        address: authority.address
      };
    }
    exports2.pluginAuthorityFromBase = pluginAuthorityFromBase;
    function comparePluginAuthorities(a, b) {
      if (a.type !== b.type) {
        return false;
      }
      return a.address === b.address;
    }
    exports2.comparePluginAuthorities = comparePluginAuthorities;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/masterEdition.js
var require_masterEdition = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/masterEdition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.masterEditionFromBase = exports2.masterEditionToBase = void 0;
    var utils_1 = require_utils3();
    function masterEditionToBase(s) {
      return {
        maxSupply: (0, utils_1.someOrNone)(s.maxSupply),
        name: (0, utils_1.someOrNone)(s.name),
        uri: (0, utils_1.someOrNone)(s.uri)
      };
    }
    exports2.masterEditionToBase = masterEditionToBase;
    function masterEditionFromBase(s) {
      return {
        maxSupply: (0, utils_1.unwrapOption)(s.maxSupply),
        name: (0, utils_1.unwrapOption)(s.name),
        uri: (0, utils_1.unwrapOption)(s.uri)
      };
    }
    exports2.masterEditionFromBase = masterEditionFromBase;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/lib.js
var require_lib = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/lib.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseExternalPluginAdapterData = exports2.pluginKeyToPluginType = exports2.registryRecordsToPluginsList = exports2.mapPlugin = exports2.mapPluginFields = exports2.pluginAuthorityPairV2 = exports2.createPluginV2 = exports2.pluginAuthorityPair = exports2.createPlugin = exports2.formPluginHeaderV1 = void 0;
    var umi_1 = require_cjs7();
    var msgpack_1 = (init_dist(), __toCommonJS(dist_exports));
    var generated_1 = require_generated();
    var utils_1 = require_utils3();
    var pluginAuthority_1 = require_pluginAuthority();
    var royalties_1 = require_royalties();
    var masterEdition_1 = require_masterEdition();
    function formPluginHeaderV1(pluginRegistryOffset) {
      return {
        key: generated_1.Key.PluginHeaderV1,
        pluginRegistryOffset
      };
    }
    exports2.formPluginHeaderV1 = formPluginHeaderV1;
    function createPlugin(args) {
      if (args.type === "UpdateDelegate") {
        return {
          __kind: args.type,
          fields: [
            args.data || {
              additionalDelegates: []
            }
          ]
        };
      }
      return {
        __kind: args.type,
        fields: [args.data || {}]
      };
    }
    exports2.createPlugin = createPlugin;
    function pluginAuthorityPair(args) {
      const { type, authority, data } = args;
      return {
        plugin: createPlugin({
          type,
          data
        }),
        authority: authority ? (0, umi_1.some)(authority) : (0, umi_1.none)()
      };
    }
    exports2.pluginAuthorityPair = pluginAuthorityPair;
    function createPluginV2(args) {
      const { type } = args;
      if (type === "UpdateDelegate") {
        return {
          __kind: type,
          fields: [
            args || {
              additionalDelegates: []
            }
          ]
        };
      }
      if (type === "Royalties") {
        return {
          __kind: type,
          fields: [(0, royalties_1.royaltiesToBase)(args)]
        };
      }
      if (type === "MasterEdition") {
        return {
          __kind: type,
          fields: [(0, masterEdition_1.masterEditionToBase)(args)]
        };
      }
      return {
        __kind: type,
        fields: [args || {}]
      };
    }
    exports2.createPluginV2 = createPluginV2;
    function pluginAuthorityPairV2({ type, authority, ...args }) {
      return {
        plugin: createPluginV2({
          type,
          ...args
        }),
        authority: authority ? (0, umi_1.some)((0, pluginAuthority_1.pluginAuthorityToBase)(authority)) : (0, umi_1.none)()
      };
    }
    exports2.pluginAuthorityPairV2 = pluginAuthorityPairV2;
    function mapPluginFields(fields) {
      return fields.reduce((acc2, field) => ({ ...acc2, ...field }), {});
    }
    exports2.mapPluginFields = mapPluginFields;
    function mapPlugin({ plugin: plug, authority, offset }) {
      const pluginKey = (0, utils_1.toWords)(plug.__kind).toLowerCase().split(" ").reduce((s, c) => s + (c.charAt(0).toUpperCase() + c.slice(1)));
      if (plug.__kind === "Royalties") {
        return {
          [pluginKey]: {
            authority,
            offset,
            ...(0, royalties_1.royaltiesFromBase)(plug.fields[0])
          }
        };
      }
      if (plug.__kind === "MasterEdition") {
        return {
          [pluginKey]: {
            authority,
            offset,
            ...(0, masterEdition_1.masterEditionFromBase)(plug.fields[0])
          }
        };
      }
      return {
        [pluginKey]: {
          authority,
          offset,
          ..."fields" in plug ? mapPluginFields(plug.fields) : {}
        }
      };
    }
    exports2.mapPlugin = mapPlugin;
    function registryRecordsToPluginsList(registryRecords, accountData) {
      return registryRecords.reduce((acc, record) => {
        const mappedAuthority = (0, pluginAuthority_1.pluginAuthorityFromBase)(record.authority);
        const deserializedPlugin = (0, generated_1.getPluginSerializer)().deserialize(accountData, Number(record.offset))[0];
        acc = {
          ...acc,
          ...mapPlugin({
            plugin: deserializedPlugin,
            authority: mappedAuthority,
            offset: record.offset
          })
        };
        return acc;
      }, {});
    }
    exports2.registryRecordsToPluginsList = registryRecordsToPluginsList;
    function pluginKeyToPluginType(pluginKey) {
      return pluginKey.charAt(0).toUpperCase() + pluginKey.slice(1);
    }
    exports2.pluginKeyToPluginType = pluginKeyToPluginType;
    function parseExternalPluginAdapterData(plugin, record, account) {
      let data;
      if ((0, umi_1.isSome)(record.dataOffset) && (0, umi_1.isSome)(record.dataLen)) {
        const dataSlice = account.slice(Number(record.dataOffset.value), Number(record.dataOffset.value) + Number(record.dataLen.value));
        if (plugin.schema === generated_1.ExternalPluginAdapterSchema.Binary) {
          data = dataSlice;
        } else if (plugin.schema === generated_1.ExternalPluginAdapterSchema.Json) {
          if (dataSlice.length !== 0) {
            try {
              data = JSON.parse(new TextDecoder().decode(dataSlice));
            } catch (e) {
              console.warn("Invalid JSON in external plugin data", e.message);
            }
          }
        } else if (plugin.schema === generated_1.ExternalPluginAdapterSchema.MsgPack) {
          if (dataSlice.length === 0) {
            data = null;
          } else {
            data = (0, msgpack_1.decode)(dataSlice);
          }
        }
        return data;
      }
      throw new Error("Invalid DataStore, missing dataOffset or dataLen");
    }
    exports2.parseExternalPluginAdapterData = parseExternalPluginAdapterData;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/appData.js
var require_appData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/appData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.appDataManifest = exports2.appDataFromBase = exports2.appDataUpdateInfoArgsToBase = exports2.appDataInitInfoArgsToBase = void 0;
    var lib_1 = require_lib();
    var pluginAuthority_1 = require_pluginAuthority();
    function appDataInitInfoArgsToBase(d) {
      return {
        dataAuthority: (0, pluginAuthority_1.pluginAuthorityToBase)(d.dataAuthority),
        initPluginAuthority: d.initPluginAuthority ? (0, pluginAuthority_1.pluginAuthorityToBase)(d.initPluginAuthority) : null,
        schema: d.schema ?? null
      };
    }
    exports2.appDataInitInfoArgsToBase = appDataInitInfoArgsToBase;
    function appDataUpdateInfoArgsToBase(d) {
      return {
        schema: d.schema ?? null
      };
    }
    exports2.appDataUpdateInfoArgsToBase = appDataUpdateInfoArgsToBase;
    function appDataFromBase(s, r, account) {
      return {
        ...s,
        dataAuthority: (0, pluginAuthority_1.pluginAuthorityFromBase)(s.dataAuthority),
        data: (0, lib_1.parseExternalPluginAdapterData)(s, r, account)
      };
    }
    exports2.appDataFromBase = appDataFromBase;
    exports2.appDataManifest = {
      type: "AppData",
      fromBase: appDataFromBase,
      initToBase: appDataInitInfoArgsToBase,
      updateToBase: appDataUpdateInfoArgsToBase
    };
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/lifecycleChecks.js
var require_lifecycleChecks = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/lifecycleChecks.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.lifecycleChecksFromBase = exports2.lifecycleChecksToBase = exports2.hookableLifecycleEventToLifecycleCheckKey = exports2.lifecycleCheckKeyToEnum = exports2.checkResultsToAdapterCheckResult = exports2.adapterCheckResultToCheckResults = exports2.CheckResult = void 0;
    var generated_1 = require_generated();
    var utils_1 = require_utils3();
    var CheckResult;
    (function(CheckResult2) {
      CheckResult2[CheckResult2["CAN_LISTEN"] = 0] = "CAN_LISTEN";
      CheckResult2[CheckResult2["CAN_APPROVE"] = 1] = "CAN_APPROVE";
      CheckResult2[CheckResult2["CAN_REJECT"] = 2] = "CAN_REJECT";
    })(CheckResult = exports2.CheckResult || (exports2.CheckResult = {}));
    var adapterCheckResultToCheckResults = (check) => {
      const results = [];
      if (check.flags & 1) {
        results.push(CheckResult.CAN_LISTEN);
      }
      if (check.flags & 2) {
        results.push(CheckResult.CAN_APPROVE);
      }
      if (check.flags & 4) {
        results.push(CheckResult.CAN_REJECT);
      }
      return results;
    };
    exports2.adapterCheckResultToCheckResults = adapterCheckResultToCheckResults;
    var checkResultsToAdapterCheckResult = (results) => {
      let flags = 0;
      results.forEach((result) => {
        switch (result) {
          case CheckResult.CAN_LISTEN:
            flags |= 1;
            break;
          case CheckResult.CAN_APPROVE:
            flags |= 2;
            break;
          case CheckResult.CAN_REJECT:
            flags |= 4;
            break;
          default:
        }
      });
      return { flags };
    };
    exports2.checkResultsToAdapterCheckResult = checkResultsToAdapterCheckResult;
    function lifecycleCheckKeyToEnum(key) {
      return generated_1.HookableLifecycleEvent[(0, utils_1.capitalizeFirstLetter)(key)];
    }
    exports2.lifecycleCheckKeyToEnum = lifecycleCheckKeyToEnum;
    function hookableLifecycleEventToLifecycleCheckKey(event) {
      return generated_1.HookableLifecycleEvent[event].toLowerCase();
    }
    exports2.hookableLifecycleEventToLifecycleCheckKey = hookableLifecycleEventToLifecycleCheckKey;
    function lifecycleChecksToBase(l) {
      return Object.keys(l).map((key) => {
        const k = key;
        const value = l[k];
        if (value) {
          return [
            lifecycleCheckKeyToEnum(k),
            (0, exports2.checkResultsToAdapterCheckResult)(value)
          ];
        }
        return null;
      }).filter((x) => x !== null);
    }
    exports2.lifecycleChecksToBase = lifecycleChecksToBase;
    function lifecycleChecksFromBase(l) {
      const checks = {};
      l.forEach(([event, check]) => {
        checks[hookableLifecycleEventToLifecycleCheckKey(event)] = (0, exports2.adapterCheckResultToCheckResults)(check);
      });
      return checks;
    }
    exports2.lifecycleChecksFromBase = lifecycleChecksFromBase;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/seed.js
var require_seed = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/seed.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.seedFromBase = exports2.seedToBase = void 0;
    function seedToBase(s) {
      if (s.type === "Address") {
        return {
          __kind: "Address",
          fields: [s.pubkey]
        };
      }
      if (s.type === "Bytes") {
        return {
          __kind: "Bytes",
          fields: [s.bytes]
        };
      }
      return {
        __kind: s.type
      };
    }
    exports2.seedToBase = seedToBase;
    function seedFromBase(s) {
      if (s.__kind === "Address") {
        return {
          type: "Address",
          pubkey: s.fields[0]
        };
      }
      if (s.__kind === "Bytes") {
        return {
          type: "Bytes",
          bytes: s.fields[0]
        };
      }
      return {
        type: s.__kind
      };
    }
    exports2.seedFromBase = seedFromBase;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/extraAccount.js
var require_extraAccount = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/extraAccount.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getExtraAccountRequiredInputs = exports2.extraAccountFromBase = exports2.extraAccountToBase = exports2.extraAccountToAccountMeta = exports2.findPreconfiguredPda = exports2.PRECONFIGURED_SEED = void 0;
    var serializers_1 = require_serializers();
    var seed_1 = require_seed();
    var utils_1 = require_utils3();
    exports2.PRECONFIGURED_SEED = "mpl-core";
    var findPreconfiguredPda = (context, program, key) => context.eddsa.findPda(program, [
      (0, serializers_1.string)({ size: "variable" }).serialize(exports2.PRECONFIGURED_SEED),
      (0, serializers_1.publicKey)().serialize(key)
    ]);
    exports2.findPreconfiguredPda = findPreconfiguredPda;
    function extraAccountToAccountMeta(context, e, inputs) {
      const acccountMeta = {
        isSigner: e.isSigner || false,
        isWritable: e.isWritable || false
      };
      const requiredInputs = getExtraAccountRequiredInputs(e);
      const missing = [];
      requiredInputs.forEach((input) => {
        if (!inputs[input]) {
          missing.push(input);
        }
      });
      if (missing.length) {
        throw new Error(`Missing required inputs to derive account address: ${missing.join(", ")}`);
      }
      switch (e.type) {
        case "PreconfiguredProgram":
          return {
            ...acccountMeta,
            pubkey: context.eddsa.findPda(inputs.program, [
              (0, serializers_1.string)({ size: "variable" }).serialize(exports2.PRECONFIGURED_SEED)
            ])[0]
          };
        case "PreconfiguredCollection":
          return {
            ...acccountMeta,
            pubkey: (0, exports2.findPreconfiguredPda)(context, inputs.program, inputs.collection)[0]
          };
        case "PreconfiguredOwner":
          return {
            ...acccountMeta,
            pubkey: (0, exports2.findPreconfiguredPda)(context, inputs.program, inputs.owner)[0]
          };
        case "PreconfiguredRecipient":
          return {
            ...acccountMeta,
            pubkey: (0, exports2.findPreconfiguredPda)(context, inputs.program, inputs.recipient)[0]
          };
        case "PreconfiguredAsset":
          return {
            ...acccountMeta,
            pubkey: (0, exports2.findPreconfiguredPda)(context, inputs.program, inputs.asset)[0]
          };
        case "CustomPda":
          return {
            pubkey: context.eddsa.findPda(e.customProgramId ? e.customProgramId : inputs.program, e.seeds.map((seed) => {
              switch (seed.type) {
                case "Collection":
                  return (0, serializers_1.publicKey)().serialize(inputs.collection);
                case "Owner":
                  return (0, serializers_1.publicKey)().serialize(inputs.owner);
                case "Recipient":
                  return (0, serializers_1.publicKey)().serialize(inputs.recipient);
                case "Asset":
                  return (0, serializers_1.publicKey)().serialize(inputs.asset);
                case "Address":
                  return (0, serializers_1.publicKey)().serialize(seed.pubkey);
                case "Bytes":
                  return seed.bytes;
                default:
                  throw new Error("Unknown seed type");
              }
            }))[0],
            ...acccountMeta
          };
        case "Address":
          return {
            ...acccountMeta,
            pubkey: e.address
          };
        default:
          throw new Error("Unknown extra account type");
      }
    }
    exports2.extraAccountToAccountMeta = extraAccountToAccountMeta;
    function extraAccountToBase(s) {
      const acccountMeta = {
        isSigner: s.isSigner || false,
        isWritable: s.isWritable || false
      };
      if (s.type === "CustomPda") {
        return {
          __kind: "CustomPda",
          ...acccountMeta,
          seeds: s.seeds.map(seed_1.seedToBase),
          customProgramId: (0, utils_1.someOrNone)(s.customProgramId)
        };
      }
      if (s.type === "Address") {
        return {
          __kind: "Address",
          ...acccountMeta,
          address: s.address
        };
      }
      return {
        __kind: s.type,
        ...acccountMeta
      };
    }
    exports2.extraAccountToBase = extraAccountToBase;
    function extraAccountFromBase(s) {
      if (s.__kind === "CustomPda") {
        return {
          type: "CustomPda",
          isSigner: s.isSigner,
          isWritable: s.isWritable,
          seeds: s.seeds.map(seed_1.seedFromBase),
          customProgramId: (0, utils_1.unwrapOption)(s.customProgramId)
        };
      }
      if (s.__kind === "Address") {
        return {
          type: "Address",
          isSigner: s.isSigner,
          isWritable: s.isWritable,
          address: s.address
        };
      }
      return {
        type: s.__kind,
        isSigner: s.isSigner,
        isWritable: s.isWritable
      };
    }
    exports2.extraAccountFromBase = extraAccountFromBase;
    var EXTRA_ACCOUNT_INPUT_MAP = {
      PreconfiguredOwner: "owner",
      PreconfiguredRecipient: "recipient",
      PreconfiguredAsset: "asset",
      PreconfiguredCollection: "collection",
      PreconfiguredProgram: "program"
    };
    function getExtraAccountRequiredInputs(s) {
      const preconfigured = EXTRA_ACCOUNT_INPUT_MAP[s.type];
      if (preconfigured) {
        return [preconfigured];
      }
      if (s.type === "CustomPda") {
        return s.seeds.map((seed) => {
          switch (seed.type) {
            case "Collection":
              return "collection";
            case "Owner":
              return "owner";
            case "Recipient":
              return "recipient";
            case "Asset":
              return "asset";
            default:
              return null;
          }
        }).filter((input) => input);
      }
      return [];
    }
    exports2.getExtraAccountRequiredInputs = getExtraAccountRequiredInputs;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/lifecycleHook.js
var require_lifecycleHook = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/lifecycleHook.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.lifecycleHookManifest = exports2.lifecycleHookFromBase = exports2.lifecycleHookUpdateInfoArgsToBase = exports2.lifecycleHookInitInfoArgsToBase = void 0;
    var extraAccount_1 = require_extraAccount();
    var lifecycleChecks_1 = require_lifecycleChecks();
    var pluginAuthority_1 = require_pluginAuthority();
    var lib_1 = require_lib();
    function lifecycleHookInitInfoArgsToBase(l) {
      return {
        extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccount_1.extraAccountToBase) : null,
        hookedProgram: l.hookedProgram,
        initPluginAuthority: l.initPluginAuthority ? (0, pluginAuthority_1.pluginAuthorityToBase)(l.initPluginAuthority) : null,
        lifecycleChecks: (0, lifecycleChecks_1.lifecycleChecksToBase)(l.lifecycleChecks),
        schema: l.schema ?? null,
        dataAuthority: l.dataAuthority ? (0, pluginAuthority_1.pluginAuthorityToBase)(l.dataAuthority) : null
      };
    }
    exports2.lifecycleHookInitInfoArgsToBase = lifecycleHookInitInfoArgsToBase;
    function lifecycleHookUpdateInfoArgsToBase(l) {
      return {
        lifecycleChecks: l.lifecycleChecks ? (0, lifecycleChecks_1.lifecycleChecksToBase)(l.lifecycleChecks) : null,
        extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccount_1.extraAccountToBase) : null,
        schema: l.schema ?? null
        // TODO update dataAuthority?
      };
    }
    exports2.lifecycleHookUpdateInfoArgsToBase = lifecycleHookUpdateInfoArgsToBase;
    function lifecycleHookFromBase(s, r, account) {
      return {
        ...s,
        extraAccounts: s.extraAccounts.__option === "Some" ? s.extraAccounts.value.map(extraAccount_1.extraAccountFromBase) : void 0,
        data: (0, lib_1.parseExternalPluginAdapterData)(s, r, account),
        dataAuthority: s.dataAuthority.__option === "Some" ? (0, pluginAuthority_1.pluginAuthorityFromBase)(s.dataAuthority.value) : void 0
      };
    }
    exports2.lifecycleHookFromBase = lifecycleHookFromBase;
    exports2.lifecycleHookManifest = {
      type: "LifecycleHook",
      fromBase: lifecycleHookFromBase,
      initToBase: lifecycleHookInitInfoArgsToBase,
      updateToBase: lifecycleHookUpdateInfoArgsToBase
    };
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/validationResultsOffset.js
var require_validationResultsOffset = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/validationResultsOffset.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.validationResultsOffsetFromBase = exports2.validationResultsOffsetToBase = void 0;
    function validationResultsOffsetToBase(e) {
      if (e.type === "Custom") {
        return {
          __kind: "Custom",
          fields: [e.offset]
        };
      }
      return {
        __kind: e.type
      };
    }
    exports2.validationResultsOffsetToBase = validationResultsOffsetToBase;
    function validationResultsOffsetFromBase(e) {
      if (e.__kind === "Custom") {
        return {
          type: "Custom",
          offset: e.fields[0]
        };
      }
      return {
        type: e.__kind
      };
    }
    exports2.validationResultsOffsetFromBase = validationResultsOffsetFromBase;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/oracle.js
var require_oracle = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/oracle.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.oracleManifest = exports2.deserializeOracleValidation = exports2.findOracleAccount = exports2.oracleFromBase = exports2.oracleUpdateInfoArgsToBase = exports2.oracleInitInfoArgsToBase = void 0;
    var extraAccount_1 = require_extraAccount();
    var generated_1 = require_generated();
    var lifecycleChecks_1 = require_lifecycleChecks();
    var pluginAuthority_1 = require_pluginAuthority();
    var validationResultsOffset_1 = require_validationResultsOffset();
    function oracleInitInfoArgsToBase(o) {
      return {
        baseAddress: o.baseAddress,
        baseAddressConfig: o.baseAddressConfig ? (0, extraAccount_1.extraAccountToBase)(o.baseAddressConfig) : null,
        lifecycleChecks: (0, lifecycleChecks_1.lifecycleChecksToBase)(o.lifecycleChecks),
        initPluginAuthority: o.initPluginAuthority ? (0, pluginAuthority_1.pluginAuthorityToBase)(o.initPluginAuthority) : null,
        resultsOffset: o.resultsOffset ? (0, validationResultsOffset_1.validationResultsOffsetToBase)(o.resultsOffset) : null
      };
    }
    exports2.oracleInitInfoArgsToBase = oracleInitInfoArgsToBase;
    function oracleUpdateInfoArgsToBase(o) {
      return {
        baseAddressConfig: o.baseAddressConfig ? (0, extraAccount_1.extraAccountToBase)(o.baseAddressConfig) : null,
        lifecycleChecks: o.lifecycleChecks ? (0, lifecycleChecks_1.lifecycleChecksToBase)(o.lifecycleChecks) : null,
        resultsOffset: o.resultsOffset ? (0, validationResultsOffset_1.validationResultsOffsetToBase)(o.resultsOffset) : null
      };
    }
    exports2.oracleUpdateInfoArgsToBase = oracleUpdateInfoArgsToBase;
    function oracleFromBase(s, r, account) {
      return {
        ...s,
        baseAddressConfig: s.baseAddressConfig.__option === "Some" ? (0, extraAccount_1.extraAccountFromBase)(s.baseAddressConfig.value) : void 0,
        resultsOffset: (0, validationResultsOffset_1.validationResultsOffsetFromBase)(s.resultsOffset)
      };
    }
    exports2.oracleFromBase = oracleFromBase;
    function findOracleAccount(context, oracle, inputs) {
      if (!oracle.baseAddressConfig) {
        return oracle.baseAddress;
      }
      return (0, extraAccount_1.extraAccountToAccountMeta)(context, oracle.baseAddressConfig, {
        ...inputs,
        program: oracle.baseAddress
      }).pubkey;
    }
    exports2.findOracleAccount = findOracleAccount;
    function deserializeOracleValidation(data, offset) {
      let offs = 0;
      if (offset.type === "Custom") {
        offs = Number(offset.offset);
      } else if (offset.type === "Anchor") {
        offs = 8;
      }
      return (0, generated_1.getOracleValidationSerializer)().deserialize(data, offs)[0];
    }
    exports2.deserializeOracleValidation = deserializeOracleValidation;
    exports2.oracleManifest = {
      type: "Oracle",
      fromBase: oracleFromBase,
      initToBase: oracleInitInfoArgsToBase,
      updateToBase: oracleUpdateInfoArgsToBase
    };
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/linkedDataKey.js
var require_linkedDataKey = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/linkedDataKey.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.linkedDataKeyFromBase = exports2.linkedDataKeyToBase = void 0;
    var pluginAuthority_1 = require_pluginAuthority();
    function linkedDataKeyToBase(e) {
      switch (e.type) {
        case "LinkedLifecycleHook":
          return {
            __kind: e.type,
            fields: [e.hookedProgram]
          };
        case "LinkedAppData":
          return {
            __kind: e.type,
            fields: [(0, pluginAuthority_1.pluginAuthorityToBase)(e.dataAuthority)]
          };
        default:
          throw new Error("Unknown LinkedDataKey type");
      }
    }
    exports2.linkedDataKeyToBase = linkedDataKeyToBase;
    function linkedDataKeyFromBase(e) {
      switch (e.__kind) {
        case "LinkedLifecycleHook":
          return {
            type: e.__kind,
            hookedProgram: e.fields[0]
          };
        case "LinkedAppData":
          return {
            type: e.__kind,
            dataAuthority: (0, pluginAuthority_1.pluginAuthorityFromBase)(e.fields[0])
          };
        default:
          throw new Error("Unknown LinkedDataKey type");
      }
    }
    exports2.linkedDataKeyFromBase = linkedDataKeyFromBase;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/externalPluginAdapterKey.js
var require_externalPluginAdapterKey = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/externalPluginAdapterKey.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.externalPluginAdapterKeyToBase = void 0;
    var pluginAuthority_1 = require_pluginAuthority();
    var linkedDataKey_1 = require_linkedDataKey();
    function externalPluginAdapterKeyToBase(e) {
      switch (e.type) {
        case "Oracle":
          return {
            __kind: e.type,
            fields: [e.baseAddress]
          };
        case "AppData":
        case "LinkedAppData":
          return {
            __kind: e.type,
            fields: [(0, pluginAuthority_1.pluginAuthorityToBase)(e.dataAuthority)]
          };
        case "LifecycleHook":
          return {
            __kind: e.type,
            fields: [e.hookedProgram]
          };
        case "DataSection":
          return {
            __kind: e.type,
            fields: [(0, linkedDataKey_1.linkedDataKeyToBase)(e.parentKey)]
          };
        default:
          throw new Error("Unknown ExternalPluginAdapterKey type");
      }
    }
    exports2.externalPluginAdapterKeyToBase = externalPluginAdapterKeyToBase;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/externalPluginAdapterManifest.js
var require_externalPluginAdapterManifest = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/externalPluginAdapterManifest.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/types.js
var require_types2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ruleSet = exports2.updateAuthority = exports2.pluginAuthority = void 0;
    var generated_1 = require_generated();
    Object.defineProperty(exports2, "pluginAuthority", { enumerable: true, get: function() {
      return generated_1.basePluginAuthority;
    } });
    Object.defineProperty(exports2, "updateAuthority", { enumerable: true, get: function() {
      return generated_1.baseUpdateAuthority;
    } });
    Object.defineProperty(exports2, "ruleSet", { enumerable: true, get: function() {
      return generated_1.baseRuleSet;
    } });
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/linkedAppData.js
var require_linkedAppData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/linkedAppData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.linkedAppDataManifest = exports2.linkedAppDataFromBase = exports2.linkedAppDataUpdateInfoArgsToBase = exports2.linkedAppDataInitInfoArgsToBase = void 0;
    var pluginAuthority_1 = require_pluginAuthority();
    function linkedAppDataInitInfoArgsToBase(d) {
      return {
        dataAuthority: (0, pluginAuthority_1.pluginAuthorityToBase)(d.dataAuthority),
        initPluginAuthority: d.initPluginAuthority ? (0, pluginAuthority_1.pluginAuthorityToBase)(d.initPluginAuthority) : null,
        schema: d.schema ?? null
      };
    }
    exports2.linkedAppDataInitInfoArgsToBase = linkedAppDataInitInfoArgsToBase;
    function linkedAppDataUpdateInfoArgsToBase(d) {
      return {
        schema: d.schema ?? null
      };
    }
    exports2.linkedAppDataUpdateInfoArgsToBase = linkedAppDataUpdateInfoArgsToBase;
    function linkedAppDataFromBase(s, r, account) {
      return {
        ...s,
        dataAuthority: (0, pluginAuthority_1.pluginAuthorityFromBase)(s.dataAuthority)
        // plugin has no data but injected in the derivation of the asset
      };
    }
    exports2.linkedAppDataFromBase = linkedAppDataFromBase;
    exports2.linkedAppDataManifest = {
      type: "LinkedAppData",
      fromBase: linkedAppDataFromBase,
      initToBase: linkedAppDataInitInfoArgsToBase,
      updateToBase: linkedAppDataUpdateInfoArgsToBase
    };
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/dataSection.js
var require_dataSection = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/dataSection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.dataSectionManifest = exports2.dataSectionFromBase = exports2.dataSectionUpdateInfoArgsToBase = exports2.dataSectionInitInfoArgsToBase = void 0;
    var lib_1 = require_lib();
    var linkedDataKey_1 = require_linkedDataKey();
    var pluginAuthority_1 = require_pluginAuthority();
    function dataSectionInitInfoArgsToBase(d) {
      return {
        parentKey: (0, linkedDataKey_1.linkedDataKeyToBase)(d.parentKey),
        schema: d.schema
      };
    }
    exports2.dataSectionInitInfoArgsToBase = dataSectionInitInfoArgsToBase;
    function dataSectionUpdateInfoArgsToBase(d) {
      return {};
    }
    exports2.dataSectionUpdateInfoArgsToBase = dataSectionUpdateInfoArgsToBase;
    function dataSectionFromBase(s, r, account) {
      return {
        ...s,
        parentKey: (0, linkedDataKey_1.linkedDataKeyFromBase)(s.parentKey),
        dataAuthority: s.parentKey.__kind !== "LinkedLifecycleHook" ? (0, pluginAuthority_1.pluginAuthorityFromBase)(s.parentKey.fields[0]) : void 0,
        data: (0, lib_1.parseExternalPluginAdapterData)(s, r, account)
      };
    }
    exports2.dataSectionFromBase = dataSectionFromBase;
    exports2.dataSectionManifest = {
      type: "DataSection",
      fromBase: dataSectionFromBase,
      initToBase: dataSectionInitInfoArgsToBase,
      updateToBase: dataSectionUpdateInfoArgsToBase
    };
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/linkedLifecycleHook.js
var require_linkedLifecycleHook = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/linkedLifecycleHook.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.linkedLifecycleHookManifest = exports2.linkedLifecycleHookFromBase = exports2.linkedLifecycleHookUpdateInfoArgsToBase = exports2.linkedLifecycleHookInitInfoArgsToBase = void 0;
    var extraAccount_1 = require_extraAccount();
    var lifecycleChecks_1 = require_lifecycleChecks();
    var pluginAuthority_1 = require_pluginAuthority();
    function linkedLifecycleHookInitInfoArgsToBase(l) {
      return {
        extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccount_1.extraAccountToBase) : null,
        hookedProgram: l.hookedProgram,
        initPluginAuthority: l.initPluginAuthority ? (0, pluginAuthority_1.pluginAuthorityToBase)(l.initPluginAuthority) : null,
        lifecycleChecks: (0, lifecycleChecks_1.lifecycleChecksToBase)(l.lifecycleChecks),
        schema: l.schema ? l.schema : null,
        dataAuthority: l.dataAuthority ? (0, pluginAuthority_1.pluginAuthorityToBase)(l.dataAuthority) : null
      };
    }
    exports2.linkedLifecycleHookInitInfoArgsToBase = linkedLifecycleHookInitInfoArgsToBase;
    function linkedLifecycleHookUpdateInfoArgsToBase(l) {
      return {
        lifecycleChecks: l.lifecycleChecks ? (0, lifecycleChecks_1.lifecycleChecksToBase)(l.lifecycleChecks) : null,
        extraAccounts: l.extraAccounts ? l.extraAccounts.map(extraAccount_1.extraAccountToBase) : null,
        schema: l.schema ?? null
      };
    }
    exports2.linkedLifecycleHookUpdateInfoArgsToBase = linkedLifecycleHookUpdateInfoArgsToBase;
    function linkedLifecycleHookFromBase(s, r, account) {
      return {
        ...s,
        extraAccounts: s.extraAccounts.__option === "Some" ? s.extraAccounts.value.map(extraAccount_1.extraAccountFromBase) : void 0,
        dataAuthority: s.dataAuthority.__option === "Some" ? (0, pluginAuthority_1.pluginAuthorityFromBase)(s.dataAuthority.value) : void 0
      };
    }
    exports2.linkedLifecycleHookFromBase = linkedLifecycleHookFromBase;
    exports2.linkedLifecycleHookManifest = {
      type: "LinkedLifecycleHook",
      fromBase: linkedLifecycleHookFromBase,
      initToBase: linkedLifecycleHookInitInfoArgsToBase,
      updateToBase: linkedLifecycleHookUpdateInfoArgsToBase
    };
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/externalPluginAdapters.js
var require_externalPluginAdapters = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/externalPluginAdapters.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.findExtraAccounts = exports2.createExternalPluginAdapterUpdateInfo = exports2.createExternalPluginAdapterInitInfo = exports2.isExternalPluginAdapterType = exports2.externalRegistryRecordsToExternalPluginAdapterList = exports2.externalPluginAdapterManifests = void 0;
    var umi_1 = require_cjs7();
    var _1 = require_plugins();
    var generated_1 = require_generated();
    var appData_1 = require_appData();
    var lifecycleChecks_1 = require_lifecycleChecks();
    var oracle_1 = require_oracle();
    var extraAccount_1 = require_extraAccount();
    var linkedAppData_1 = require_linkedAppData();
    var dataSection_1 = require_dataSection();
    var linkedLifecycleHook_1 = require_linkedLifecycleHook();
    exports2.externalPluginAdapterManifests = {
      LifecycleHook: _1.lifecycleHookManifest,
      Oracle: oracle_1.oracleManifest,
      AppData: appData_1.appDataManifest,
      LinkedLifecycleHook: linkedLifecycleHook_1.linkedLifecycleHookManifest,
      LinkedAppData: linkedAppData_1.linkedAppDataManifest,
      DataSection: dataSection_1.dataSectionManifest
    };
    function externalRegistryRecordsToExternalPluginAdapterList(records, accountData) {
      const result = {};
      records.forEach((record) => {
        const deserializedPlugin = (0, generated_1.getExternalPluginAdapterSerializer)().deserialize(accountData, Number(record.offset))[0];
        const mappedPlugin = {
          lifecycleChecks: record.lifecycleChecks.__option === "Some" ? (0, lifecycleChecks_1.lifecycleChecksFromBase)(record.lifecycleChecks.value) : void 0,
          authority: (0, _1.pluginAuthorityFromBase)(record.authority),
          offset: record.offset
        };
        if (deserializedPlugin.__kind === "LifecycleHook") {
          if (!result.lifecycleHooks) {
            result.lifecycleHooks = [];
          }
          result.lifecycleHooks.push({
            type: "LifecycleHook",
            dataOffset: (0, umi_1.isSome)(record.dataOffset) ? record.dataOffset.value : void 0,
            dataLen: (0, umi_1.isSome)(record.dataLen) ? record.dataLen.value : void 0,
            ...mappedPlugin,
            ...(0, _1.lifecycleHookFromBase)(deserializedPlugin.fields[0], record, accountData)
          });
        } else if (deserializedPlugin.__kind === "AppData") {
          if (!result.appDatas) {
            result.appDatas = [];
          }
          result.appDatas.push({
            type: "AppData",
            dataOffset: (0, umi_1.isSome)(record.dataOffset) ? record.dataOffset.value : void 0,
            dataLen: (0, umi_1.isSome)(record.dataLen) ? record.dataLen.value : void 0,
            ...mappedPlugin,
            ...(0, appData_1.appDataFromBase)(deserializedPlugin.fields[0], record, accountData)
          });
        } else if (deserializedPlugin.__kind === "Oracle") {
          if (!result.oracles) {
            result.oracles = [];
          }
          result.oracles.push({
            type: "Oracle",
            ...mappedPlugin,
            ...(0, oracle_1.oracleFromBase)(deserializedPlugin.fields[0], record, accountData)
          });
        } else if (deserializedPlugin.__kind === "LinkedLifecycleHook") {
          if (!result.linkedLifecycleHooks) {
            result.linkedLifecycleHooks = [];
          }
          result.linkedLifecycleHooks.push({
            type: "LinkedLifecycleHook",
            ...mappedPlugin,
            ...(0, linkedLifecycleHook_1.linkedLifecycleHookFromBase)(deserializedPlugin.fields[0], record, accountData)
          });
        } else if (deserializedPlugin.__kind === "LinkedAppData") {
          if (!result.linkedAppDatas) {
            result.linkedAppDatas = [];
          }
          result.linkedAppDatas.push({
            type: "LinkedAppData",
            ...mappedPlugin,
            ...(0, linkedAppData_1.linkedAppDataFromBase)(deserializedPlugin.fields[0], record, accountData)
          });
        } else if (deserializedPlugin.__kind === "DataSection") {
          if (!result.dataSections) {
            result.dataSections = [];
          }
          result.dataSections.push({
            type: "DataSection",
            dataOffset: (0, umi_1.isSome)(record.dataOffset) ? record.dataOffset.value : void 0,
            dataLen: (0, umi_1.isSome)(record.dataLen) ? record.dataLen.value : void 0,
            ...mappedPlugin,
            ...(0, dataSection_1.dataSectionFromBase)(deserializedPlugin.fields[0], record, accountData)
          });
        }
      });
      return result;
    }
    exports2.externalRegistryRecordsToExternalPluginAdapterList = externalRegistryRecordsToExternalPluginAdapterList;
    var isExternalPluginAdapterType = (plugin) => {
      if (plugin.type === "LifecycleHook" || plugin.type === "Oracle" || plugin.type === "AppData" || plugin.type === "LinkedLifecycleHook" || plugin.type === "DataSection" || plugin.type === "LinkedAppData") {
        return true;
      }
      return false;
    };
    exports2.isExternalPluginAdapterType = isExternalPluginAdapterType;
    function createExternalPluginAdapterInitInfo({ type, ...args }) {
      const manifest = exports2.externalPluginAdapterManifests[type];
      return {
        __kind: type,
        fields: [manifest.initToBase(args)]
      };
    }
    exports2.createExternalPluginAdapterInitInfo = createExternalPluginAdapterInitInfo;
    function createExternalPluginAdapterUpdateInfo({ type, ...args }) {
      const manifest = exports2.externalPluginAdapterManifests[type];
      return {
        __kind: type,
        fields: [manifest.updateToBase(args)]
      };
    }
    exports2.createExternalPluginAdapterUpdateInfo = createExternalPluginAdapterUpdateInfo;
    var findExtraAccounts = (context, lifecycle, externalPluginAdapters, inputs) => {
      const accounts = [];
      externalPluginAdapters.oracles?.forEach((oracle) => {
        if (oracle.lifecycleChecks?.[lifecycle]) {
          if (oracle.baseAddressConfig) {
            accounts.push((0, extraAccount_1.extraAccountToAccountMeta)(context, oracle.baseAddressConfig, {
              ...inputs,
              program: oracle.baseAddress
            }));
          } else {
            accounts.push({
              pubkey: oracle.baseAddress,
              isSigner: false,
              isWritable: false
            });
          }
        }
      });
      externalPluginAdapters.lifecycleHooks?.forEach((hook) => {
        if (hook.lifecycleChecks?.[lifecycle]) {
          accounts.push({
            pubkey: hook.hookedProgram,
            isSigner: false,
            isWritable: false
          });
          hook.extraAccounts?.forEach((extra) => {
            accounts.push((0, extraAccount_1.extraAccountToAccountMeta)(context, extra, {
              ...inputs,
              program: hook.hookedProgram
            }));
          });
        }
      });
      externalPluginAdapters.linkedLifecycleHooks?.forEach((hook) => {
        if (hook.lifecycleChecks?.[lifecycle]) {
          accounts.push({
            pubkey: hook.hookedProgram,
            isSigner: false,
            isWritable: false
          });
          hook.extraAccounts?.forEach((extra) => {
            accounts.push((0, extraAccount_1.extraAccountToAccountMeta)(context, extra, {
              ...inputs,
              program: hook.hookedProgram
            }));
          });
        }
      });
      return accounts;
    };
    exports2.findExtraAccounts = findExtraAccounts;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/updateAuthority.js
var require_updateAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/updateAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateAuthorityToBase = void 0;
    function updateAuthorityToBase(u) {
      if (u.type === "None") {
        return {
          __kind: "None"
        };
      }
      return {
        __kind: u.type,
        fields: [u.address]
      };
    }
    exports2.updateAuthorityToBase = updateAuthorityToBase;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/index.js
var require_plugins = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugins/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_royalties(), exports2);
    __exportStar(require_lib(), exports2);
    __exportStar(require_appData(), exports2);
    __exportStar(require_lifecycleChecks(), exports2);
    __exportStar(require_lifecycleHook(), exports2);
    __exportStar(require_oracle(), exports2);
    __exportStar(require_externalPluginAdapterKey(), exports2);
    __exportStar(require_externalPluginAdapterManifest(), exports2);
    __exportStar(require_pluginAuthority(), exports2);
    __exportStar(require_types2(), exports2);
    __exportStar(require_externalPluginAdapters(), exports2);
    __exportStar(require_updateAuthority(), exports2);
    __exportStar(require_seed(), exports2);
    __exportStar(require_extraAccount(), exports2);
    __exportStar(require_validationResultsOffset(), exports2);
    __exportStar(require_linkedLifecycleHook(), exports2);
    __exportStar(require_linkedAppData(), exports2);
    __exportStar(require_dataSection(), exports2);
    __exportStar(require_linkedDataKey(), exports2);
    __exportStar(require_masterEdition(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/pluginRegistryV1Data.js
var require_pluginRegistryV1Data = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/pluginRegistryV1Data.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPluginRegistryV1AccountDataSerializer = exports2.getAdapterRegistryRecordSerializer = exports2.getRegistryRecordSerializer = void 0;
    var serializers_1 = require_serializers();
    var generated_1 = require_generated();
    function getRegistryRecordSerializer() {
      return {
        description: "RegistryRecordWithUnknown",
        fixedSize: null,
        maxSize: null,
        serialize: () => {
          throw new Error("Operation not supported.");
        },
        deserialize: (buffer, offset = 0) => {
          let [pluginType, pluginTypeOffset, isUnknown] = [
            generated_1.PluginType.Attributes,
            offset + 1,
            true
          ];
          try {
            [pluginType, pluginTypeOffset] = (0, generated_1.getPluginTypeSerializer)().deserialize(buffer, offset);
            isUnknown = false;
          } catch (e) {
          }
          const [authority, authorityOffset] = (0, generated_1.getBasePluginAuthoritySerializer)().deserialize(buffer, pluginTypeOffset);
          const [pluginOffset, pluginOffsetOffset] = (0, serializers_1.u64)().deserialize(buffer, authorityOffset);
          return [
            {
              pluginType,
              authority,
              offset: pluginOffset,
              isUnknown
            },
            pluginOffsetOffset
          ];
        }
      };
    }
    exports2.getRegistryRecordSerializer = getRegistryRecordSerializer;
    function getAdapterRegistryRecordSerializer() {
      return {
        description: "AdapterRegistryRecordWithUnknown",
        fixedSize: null,
        maxSize: null,
        serialize: () => {
          throw new Error("Operation not supported.");
        },
        deserialize: (buffer, offset = 0) => {
          let [pluginType, pluginTypeOffset, isUnknown] = [
            generated_1.ExternalPluginAdapterType.AppData,
            offset + 1,
            true
          ];
          try {
            [pluginType, pluginTypeOffset] = (0, generated_1.getExternalPluginAdapterTypeSerializer)().deserialize(buffer, offset);
            isUnknown = false;
          } catch (e) {
          }
          const [authority, authorityOffset] = (0, generated_1.getBasePluginAuthoritySerializer)().deserialize(buffer, pluginTypeOffset);
          const [lifecycleChecks, lifecycleChecksOffset] = (0, serializers_1.option)((0, serializers_1.array)((0, serializers_1.tuple)([
            (0, generated_1.getHookableLifecycleEventSerializer)(),
            (0, generated_1.getExternalCheckResultSerializer)()
          ]))).deserialize(buffer, authorityOffset);
          const [pluginOffset, pluginOffsetOffset] = (0, serializers_1.u64)().deserialize(buffer, lifecycleChecksOffset);
          const [dataOffset, dataOffsetOffset] = (0, serializers_1.option)((0, serializers_1.u64)()).deserialize(buffer, pluginOffsetOffset);
          const [dataLen, dataLenOffset] = (0, serializers_1.option)((0, serializers_1.u64)()).deserialize(buffer, dataOffsetOffset);
          return [
            {
              pluginType,
              authority,
              lifecycleChecks,
              offset: pluginOffset,
              isUnknown,
              dataOffset,
              dataLen
            },
            dataLenOffset
          ];
        }
      };
    }
    exports2.getAdapterRegistryRecordSerializer = getAdapterRegistryRecordSerializer;
    function getPluginRegistryV1AccountDataSerializer() {
      return {
        description: "PluginRegistryV1AccountData",
        fixedSize: null,
        maxSize: null,
        serialize: () => {
          throw new Error("Operation not supported.");
        },
        deserialize: (buffer, offset = 0) => {
          const [key, keyOffset] = (0, generated_1.getKeySerializer)().deserialize(buffer, offset);
          if (key !== generated_1.Key.PluginRegistryV1) {
            throw new Error(`Expected a PluginRegistryV1 account, got key: ${key}`);
          }
          const [registry, registryOffset] = (0, serializers_1.array)(getRegistryRecordSerializer()).deserialize(buffer, keyOffset);
          const [externalRegistry, externalRegistryOffset] = (0, serializers_1.array)(getAdapterRegistryRecordSerializer()).deserialize(buffer, registryOffset);
          return [
            {
              key,
              registry: registry.filter((record) => !record.isUnknown),
              externalRegistry: externalRegistry.filter((record) => !record.isUnknown)
            },
            externalRegistryOffset
          ];
        }
      };
    }
    exports2.getPluginRegistryV1AccountDataSerializer = getPluginRegistryV1AccountDataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/assetAccountData.js
var require_assetAccountData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/assetAccountData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAssetV1AccountDataSerializer = void 0;
    var generated_1 = require_generated();
    var assetV1AccountData_1 = require_assetV1AccountData();
    var plugins_1 = require_plugins();
    var pluginRegistryV1Data_1 = require_pluginRegistryV1Data();
    var externalPluginAdapters_1 = require_externalPluginAdapters();
    var getAssetV1AccountDataSerializer = () => ({
      description: "AssetAccountData",
      fixedSize: null,
      maxSize: null,
      serialize: () => {
        throw new Error("Operation not supported.");
      },
      deserialize: (buffer, offset = 0) => {
        const [asset, assetOffset] = (0, assetV1AccountData_1.getAssetV1AccountDataSerializer)().deserialize(buffer, offset);
        if (asset.key !== generated_1.Key.AssetV1) {
          throw new Error(`Expected an Asset account, got key: ${asset.key}`);
        }
        let pluginHeader;
        let pluginRegistry;
        let pluginsList;
        let externalPluginAdaptersList;
        let finalOffset = assetOffset;
        if (buffer.length !== assetOffset) {
          [pluginHeader] = (0, generated_1.getPluginHeaderV1AccountDataSerializer)().deserialize(buffer, assetOffset);
          [pluginRegistry, finalOffset] = (0, pluginRegistryV1Data_1.getPluginRegistryV1AccountDataSerializer)().deserialize(buffer, Number(pluginHeader.pluginRegistryOffset));
          pluginsList = (0, plugins_1.registryRecordsToPluginsList)(pluginRegistry.registry, buffer);
          externalPluginAdaptersList = (0, externalPluginAdapters_1.externalRegistryRecordsToExternalPluginAdapterList)(pluginRegistry.externalRegistry, buffer);
        }
        const updateAuth = {
          type: asset.updateAuthority.__kind,
          address: asset.updateAuthority.__kind === "None" ? void 0 : asset.updateAuthority.fields[0]
        };
        return [
          {
            pluginHeader,
            ...pluginsList,
            ...externalPluginAdaptersList,
            ...asset,
            updateAuthority: updateAuth
          },
          finalOffset
        ];
      }
    });
    exports2.getAssetV1AccountDataSerializer = getAssetV1AccountDataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/collectionV1AccountData.js
var require_collectionV1AccountData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/types/collectionV1AccountData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getCollectionV1AccountDataSerializer = void 0;
    var serializers_1 = require_serializers();
    var _1 = require_types();
    function getCollectionV1AccountDataSerializer() {
      return (0, serializers_1.struct)([
        ["key", (0, _1.getKeySerializer)()],
        ["updateAuthority", (0, serializers_1.publicKey)()],
        ["name", (0, serializers_1.string)()],
        ["uri", (0, serializers_1.string)()],
        ["numMinted", (0, serializers_1.u32)()],
        ["currentSize", (0, serializers_1.u32)()]
      ], { description: "CollectionV1AccountData" });
    }
    exports2.getCollectionV1AccountDataSerializer = getCollectionV1AccountDataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/collectionAccountData.js
var require_collectionAccountData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/collectionAccountData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getCollectionV1AccountDataSerializer = void 0;
    var generated_1 = require_generated();
    var collectionV1AccountData_1 = require_collectionV1AccountData();
    var plugins_1 = require_plugins();
    var pluginRegistryV1Data_1 = require_pluginRegistryV1Data();
    var getCollectionV1AccountDataSerializer = () => ({
      description: "CollectionAccountData",
      fixedSize: null,
      maxSize: null,
      serialize: () => {
        throw new Error("Operation not supported.");
      },
      deserialize: (buffer, offset = 0) => {
        const [collection, collectionOffset] = (0, collectionV1AccountData_1.getCollectionV1AccountDataSerializer)().deserialize(buffer, offset);
        if (collection.key !== generated_1.Key.CollectionV1) {
          throw new Error(`Expected an Collection account, got key: ${collection.key}`);
        }
        let pluginHeader;
        let pluginRegistry;
        let pluginsList;
        let externalPluginAdaptersList;
        let finalOffset = collectionOffset;
        if (buffer.length !== collectionOffset) {
          [pluginHeader] = (0, generated_1.getPluginHeaderV1AccountDataSerializer)().deserialize(buffer, collectionOffset);
          [pluginRegistry, finalOffset] = (0, pluginRegistryV1Data_1.getPluginRegistryV1AccountDataSerializer)().deserialize(buffer, Number(pluginHeader.pluginRegistryOffset));
          pluginsList = (0, plugins_1.registryRecordsToPluginsList)(pluginRegistry.registry, buffer);
          externalPluginAdaptersList = (0, plugins_1.externalRegistryRecordsToExternalPluginAdapterList)(pluginRegistry.externalRegistry, buffer);
        }
        return [
          {
            pluginHeader,
            ...pluginsList,
            ...externalPluginAdaptersList,
            ...collection
          },
          finalOffset
        ];
      }
    });
    exports2.getCollectionV1AccountDataSerializer = getCollectionV1AccountDataSerializer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/index.js
var require_hooked = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/hooked/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_assetAccountData(), exports2);
    __exportStar(require_collectionAccountData(), exports2);
    __exportStar(require_pluginRegistryV1Data(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/assetV1.js
var require_assetV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/assetV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAssetV1GpaBuilder = exports2.safeFetchAllAssetV1 = exports2.fetchAllAssetV1 = exports2.safeFetchAssetV1 = exports2.fetchAssetV1 = exports2.deserializeAssetV1 = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var hooked_1 = require_hooked();
    var types_1 = require_types();
    function deserializeAssetV1(rawAccount) {
      return (0, umi_1.deserializeAccount)(rawAccount, (0, hooked_1.getAssetV1AccountDataSerializer)());
    }
    exports2.deserializeAssetV1 = deserializeAssetV1;
    async function fetchAssetV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      (0, umi_1.assertAccountExists)(maybeAccount, "AssetV1");
      return deserializeAssetV1(maybeAccount);
    }
    exports2.fetchAssetV1 = fetchAssetV1;
    async function safeFetchAssetV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      return maybeAccount.exists ? deserializeAssetV1(maybeAccount) : null;
    }
    exports2.safeFetchAssetV1 = safeFetchAssetV1;
    async function fetchAllAssetV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.map((maybeAccount) => {
        (0, umi_1.assertAccountExists)(maybeAccount, "AssetV1");
        return deserializeAssetV1(maybeAccount);
      });
    }
    exports2.fetchAllAssetV1 = fetchAllAssetV1;
    async function safeFetchAllAssetV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.filter((maybeAccount) => maybeAccount.exists).map((maybeAccount) => deserializeAssetV1(maybeAccount));
    }
    exports2.safeFetchAllAssetV1 = safeFetchAllAssetV1;
    function getAssetV1GpaBuilder(context) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      return (0, umi_1.gpaBuilder)(context, programId).registerFields({
        key: [0, (0, types_1.getKeySerializer)()],
        owner: [1, (0, serializers_1.publicKey)()],
        updateAuthority: [33, (0, types_1.getBaseUpdateAuthoritySerializer)()],
        name: [null, (0, serializers_1.string)()],
        uri: [null, (0, serializers_1.string)()],
        seq: [null, (0, serializers_1.option)((0, serializers_1.u64)())]
      }).deserializeUsing((account) => deserializeAssetV1(account));
    }
    exports2.getAssetV1GpaBuilder = getAssetV1GpaBuilder;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/collectionV1.js
var require_collectionV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/collectionV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getCollectionV1GpaBuilder = exports2.safeFetchAllCollectionV1 = exports2.fetchAllCollectionV1 = exports2.safeFetchCollectionV1 = exports2.fetchCollectionV1 = exports2.deserializeCollectionV1 = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var hooked_1 = require_hooked();
    var types_1 = require_types();
    function deserializeCollectionV1(rawAccount) {
      return (0, umi_1.deserializeAccount)(rawAccount, (0, hooked_1.getCollectionV1AccountDataSerializer)());
    }
    exports2.deserializeCollectionV1 = deserializeCollectionV1;
    async function fetchCollectionV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      (0, umi_1.assertAccountExists)(maybeAccount, "CollectionV1");
      return deserializeCollectionV1(maybeAccount);
    }
    exports2.fetchCollectionV1 = fetchCollectionV1;
    async function safeFetchCollectionV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      return maybeAccount.exists ? deserializeCollectionV1(maybeAccount) : null;
    }
    exports2.safeFetchCollectionV1 = safeFetchCollectionV1;
    async function fetchAllCollectionV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.map((maybeAccount) => {
        (0, umi_1.assertAccountExists)(maybeAccount, "CollectionV1");
        return deserializeCollectionV1(maybeAccount);
      });
    }
    exports2.fetchAllCollectionV1 = fetchAllCollectionV1;
    async function safeFetchAllCollectionV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.filter((maybeAccount) => maybeAccount.exists).map((maybeAccount) => deserializeCollectionV1(maybeAccount));
    }
    exports2.safeFetchAllCollectionV1 = safeFetchAllCollectionV1;
    function getCollectionV1GpaBuilder(context) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      return (0, umi_1.gpaBuilder)(context, programId).registerFields({
        key: [0, (0, types_1.getKeySerializer)()],
        updateAuthority: [1, (0, serializers_1.publicKey)()],
        name: [33, (0, serializers_1.string)()],
        uri: [null, (0, serializers_1.string)()],
        numMinted: [null, (0, serializers_1.u32)()],
        currentSize: [null, (0, serializers_1.u32)()]
      }).deserializeUsing((account) => deserializeCollectionV1(account));
    }
    exports2.getCollectionV1GpaBuilder = getCollectionV1GpaBuilder;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/hashedAssetV1.js
var require_hashedAssetV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/hashedAssetV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getHashedAssetV1Size = exports2.getHashedAssetV1GpaBuilder = exports2.safeFetchAllHashedAssetV1 = exports2.fetchAllHashedAssetV1 = exports2.safeFetchHashedAssetV1 = exports2.fetchHashedAssetV1 = exports2.deserializeHashedAssetV1 = exports2.getHashedAssetV1AccountDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var types_1 = require_types();
    function getHashedAssetV1AccountDataSerializer() {
      return (0, serializers_1.struct)([
        ["key", (0, types_1.getKeySerializer)()],
        ["hash", (0, serializers_1.bytes)({ size: 32 })]
      ], { description: "HashedAssetV1AccountData" });
    }
    exports2.getHashedAssetV1AccountDataSerializer = getHashedAssetV1AccountDataSerializer;
    function deserializeHashedAssetV1(rawAccount) {
      return (0, umi_1.deserializeAccount)(rawAccount, getHashedAssetV1AccountDataSerializer());
    }
    exports2.deserializeHashedAssetV1 = deserializeHashedAssetV1;
    async function fetchHashedAssetV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      (0, umi_1.assertAccountExists)(maybeAccount, "HashedAssetV1");
      return deserializeHashedAssetV1(maybeAccount);
    }
    exports2.fetchHashedAssetV1 = fetchHashedAssetV1;
    async function safeFetchHashedAssetV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      return maybeAccount.exists ? deserializeHashedAssetV1(maybeAccount) : null;
    }
    exports2.safeFetchHashedAssetV1 = safeFetchHashedAssetV1;
    async function fetchAllHashedAssetV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.map((maybeAccount) => {
        (0, umi_1.assertAccountExists)(maybeAccount, "HashedAssetV1");
        return deserializeHashedAssetV1(maybeAccount);
      });
    }
    exports2.fetchAllHashedAssetV1 = fetchAllHashedAssetV1;
    async function safeFetchAllHashedAssetV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.filter((maybeAccount) => maybeAccount.exists).map((maybeAccount) => deserializeHashedAssetV1(maybeAccount));
    }
    exports2.safeFetchAllHashedAssetV1 = safeFetchAllHashedAssetV1;
    function getHashedAssetV1GpaBuilder(context) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      return (0, umi_1.gpaBuilder)(context, programId).registerFields({
        key: [0, (0, types_1.getKeySerializer)()],
        hash: [1, (0, serializers_1.bytes)({ size: 32 })]
      }).deserializeUsing((account) => deserializeHashedAssetV1(account));
    }
    exports2.getHashedAssetV1GpaBuilder = getHashedAssetV1GpaBuilder;
    function getHashedAssetV1Size() {
      return 33;
    }
    exports2.getHashedAssetV1Size = getHashedAssetV1Size;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/pluginHeaderV1.js
var require_pluginHeaderV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/pluginHeaderV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPluginHeaderV1Size = exports2.getPluginHeaderV1GpaBuilder = exports2.safeFetchAllPluginHeaderV1 = exports2.fetchAllPluginHeaderV1 = exports2.safeFetchPluginHeaderV1 = exports2.fetchPluginHeaderV1 = exports2.deserializePluginHeaderV1 = exports2.getPluginHeaderV1AccountDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var types_1 = require_types();
    function getPluginHeaderV1AccountDataSerializer() {
      return (0, serializers_1.struct)([
        ["key", (0, types_1.getKeySerializer)()],
        ["pluginRegistryOffset", (0, serializers_1.u64)()]
      ], { description: "PluginHeaderV1AccountData" });
    }
    exports2.getPluginHeaderV1AccountDataSerializer = getPluginHeaderV1AccountDataSerializer;
    function deserializePluginHeaderV1(rawAccount) {
      return (0, umi_1.deserializeAccount)(rawAccount, getPluginHeaderV1AccountDataSerializer());
    }
    exports2.deserializePluginHeaderV1 = deserializePluginHeaderV1;
    async function fetchPluginHeaderV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      (0, umi_1.assertAccountExists)(maybeAccount, "PluginHeaderV1");
      return deserializePluginHeaderV1(maybeAccount);
    }
    exports2.fetchPluginHeaderV1 = fetchPluginHeaderV1;
    async function safeFetchPluginHeaderV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      return maybeAccount.exists ? deserializePluginHeaderV1(maybeAccount) : null;
    }
    exports2.safeFetchPluginHeaderV1 = safeFetchPluginHeaderV1;
    async function fetchAllPluginHeaderV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.map((maybeAccount) => {
        (0, umi_1.assertAccountExists)(maybeAccount, "PluginHeaderV1");
        return deserializePluginHeaderV1(maybeAccount);
      });
    }
    exports2.fetchAllPluginHeaderV1 = fetchAllPluginHeaderV1;
    async function safeFetchAllPluginHeaderV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.filter((maybeAccount) => maybeAccount.exists).map((maybeAccount) => deserializePluginHeaderV1(maybeAccount));
    }
    exports2.safeFetchAllPluginHeaderV1 = safeFetchAllPluginHeaderV1;
    function getPluginHeaderV1GpaBuilder(context) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      return (0, umi_1.gpaBuilder)(context, programId).registerFields({
        key: [0, (0, types_1.getKeySerializer)()],
        pluginRegistryOffset: [1, (0, serializers_1.u64)()]
      }).deserializeUsing((account) => deserializePluginHeaderV1(account));
    }
    exports2.getPluginHeaderV1GpaBuilder = getPluginHeaderV1GpaBuilder;
    function getPluginHeaderV1Size() {
      return 9;
    }
    exports2.getPluginHeaderV1Size = getPluginHeaderV1Size;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/pluginRegistryV1.js
var require_pluginRegistryV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/pluginRegistryV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getPluginRegistryV1GpaBuilder = exports2.safeFetchAllPluginRegistryV1 = exports2.fetchAllPluginRegistryV1 = exports2.safeFetchPluginRegistryV1 = exports2.fetchPluginRegistryV1 = exports2.deserializePluginRegistryV1 = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var hooked_1 = require_hooked();
    var types_1 = require_types();
    function deserializePluginRegistryV1(rawAccount) {
      return (0, umi_1.deserializeAccount)(rawAccount, (0, hooked_1.getPluginRegistryV1AccountDataSerializer)());
    }
    exports2.deserializePluginRegistryV1 = deserializePluginRegistryV1;
    async function fetchPluginRegistryV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      (0, umi_1.assertAccountExists)(maybeAccount, "PluginRegistryV1");
      return deserializePluginRegistryV1(maybeAccount);
    }
    exports2.fetchPluginRegistryV1 = fetchPluginRegistryV1;
    async function safeFetchPluginRegistryV1(context, publicKey2, options) {
      const maybeAccount = await context.rpc.getAccount((0, umi_1.publicKey)(publicKey2, false), options);
      return maybeAccount.exists ? deserializePluginRegistryV1(maybeAccount) : null;
    }
    exports2.safeFetchPluginRegistryV1 = safeFetchPluginRegistryV1;
    async function fetchAllPluginRegistryV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.map((maybeAccount) => {
        (0, umi_1.assertAccountExists)(maybeAccount, "PluginRegistryV1");
        return deserializePluginRegistryV1(maybeAccount);
      });
    }
    exports2.fetchAllPluginRegistryV1 = fetchAllPluginRegistryV1;
    async function safeFetchAllPluginRegistryV1(context, publicKeys, options) {
      const maybeAccounts = await context.rpc.getAccounts(publicKeys.map((key) => (0, umi_1.publicKey)(key, false)), options);
      return maybeAccounts.filter((maybeAccount) => maybeAccount.exists).map((maybeAccount) => deserializePluginRegistryV1(maybeAccount));
    }
    exports2.safeFetchAllPluginRegistryV1 = safeFetchAllPluginRegistryV1;
    function getPluginRegistryV1GpaBuilder(context) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      return (0, umi_1.gpaBuilder)(context, programId).registerFields({
        key: [0, (0, types_1.getKeySerializer)()],
        registry: [1, (0, serializers_1.array)((0, types_1.getRegistryRecordSerializer)())],
        externalRegistry: [null, (0, serializers_1.array)((0, types_1.getExternalRegistryRecordSerializer)())]
      }).deserializeUsing((account) => deserializePluginRegistryV1(account));
    }
    exports2.getPluginRegistryV1GpaBuilder = getPluginRegistryV1GpaBuilder;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/index.js
var require_accounts = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/accounts/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_assetSigner(), exports2);
    __exportStar(require_assetV1(), exports2);
    __exportStar(require_collectionV1(), exports2);
    __exportStar(require_hashedAssetV1(), exports2);
    __exportStar(require_pluginHeaderV1(), exports2);
    __exportStar(require_pluginRegistryV1(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/errors/mplCore.js
var require_mplCore = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/errors/mplCore.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InvalidExecutePdaError = exports2.PermanentDelegatesPreventMoveError = exports2.CannotAddDataSectionError = exports2.InvalidPluginAdapterTargetError = exports2.NoDataSourcesError = exports2.UnsupportedOperationError = exports2.TwoDataSourcesError = exports2.CollectionMustBeEmptyError = exports2.InvalidPluginOperationError = exports2.MissingSignerError = exports2.UninitializedOracleAccountError = exports2.InvalidOracleAccountDataError = exports2.DuplicateLifecycleChecksError = exports2.RequiresLifecycleCheckError = exports2.OracleCanRejectOnlyError = exports2.MissingExternalPluginAdapterAccountError = exports2.MissingAssetError = exports2.ExternalPluginAdapterAlreadyExistsError = exports2.ExternalPluginAdapterNotFoundError = exports2.InvalidLogWrapperProgramError = exports2.ConflictingAuthorityError = exports2.InvalidPluginSettingError = exports2.CannotRedelegateError = exports2.NoApprovalsError = exports2.MissingCollectionError = exports2.InvalidAssetError = exports2.NotAvailableError = exports2.MissingSystemProgramError = exports2.MissingNewOwnerError = exports2.MissingUpdateAuthorityError = exports2.InvalidCollectionError = exports2.AlreadyDecompressedError = exports2.AlreadyCompressedError = exports2.NumericalOverflowErrorError = exports2.PluginAlreadyExistsError = exports2.CannotBurnCollectionError = exports2.CannotMigratePrintsError = exports2.CannotMigrateMasterWithSupplyError = exports2.MissingCompressionProofError = exports2.AssetIsFrozenError = exports2.InvalidAuthorityError = exports2.InvalidPluginError = exports2.IncorrectAssetHashError = exports2.IncorrectAccountError = exports2.NumericalOverflowError = exports2.PluginNotFoundError = exports2.PluginsNotInitializedError = exports2.SerializationErrorError = exports2.DeserializationErrorError = exports2.InvalidSystemProgramError = void 0;
    exports2.getMplCoreErrorFromName = exports2.getMplCoreErrorFromCode = exports2.BlockedByBubblegumV2Error = void 0;
    var umi_1 = require_cjs7();
    var codeToErrorMap = /* @__PURE__ */ new Map();
    var nameToErrorMap = /* @__PURE__ */ new Map();
    var InvalidSystemProgramError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid System Program", program, cause);
        this.name = "InvalidSystemProgram";
        this.code = 0;
      }
    };
    exports2.InvalidSystemProgramError = InvalidSystemProgramError;
    codeToErrorMap.set(0, InvalidSystemProgramError);
    nameToErrorMap.set("InvalidSystemProgram", InvalidSystemProgramError);
    var DeserializationErrorError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Error deserializing account", program, cause);
        this.name = "DeserializationError";
        this.code = 1;
      }
    };
    exports2.DeserializationErrorError = DeserializationErrorError;
    codeToErrorMap.set(1, DeserializationErrorError);
    nameToErrorMap.set("DeserializationError", DeserializationErrorError);
    var SerializationErrorError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Error serializing account", program, cause);
        this.name = "SerializationError";
        this.code = 2;
      }
    };
    exports2.SerializationErrorError = SerializationErrorError;
    codeToErrorMap.set(2, SerializationErrorError);
    nameToErrorMap.set("SerializationError", SerializationErrorError);
    var PluginsNotInitializedError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Plugins not initialized", program, cause);
        this.name = "PluginsNotInitialized";
        this.code = 3;
      }
    };
    exports2.PluginsNotInitializedError = PluginsNotInitializedError;
    codeToErrorMap.set(3, PluginsNotInitializedError);
    nameToErrorMap.set("PluginsNotInitialized", PluginsNotInitializedError);
    var PluginNotFoundError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Plugin not found", program, cause);
        this.name = "PluginNotFound";
        this.code = 4;
      }
    };
    exports2.PluginNotFoundError = PluginNotFoundError;
    codeToErrorMap.set(4, PluginNotFoundError);
    nameToErrorMap.set("PluginNotFound", PluginNotFoundError);
    var NumericalOverflowError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Numerical Overflow", program, cause);
        this.name = "NumericalOverflow";
        this.code = 5;
      }
    };
    exports2.NumericalOverflowError = NumericalOverflowError;
    codeToErrorMap.set(5, NumericalOverflowError);
    nameToErrorMap.set("NumericalOverflow", NumericalOverflowError);
    var IncorrectAccountError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Incorrect account", program, cause);
        this.name = "IncorrectAccount";
        this.code = 6;
      }
    };
    exports2.IncorrectAccountError = IncorrectAccountError;
    codeToErrorMap.set(6, IncorrectAccountError);
    nameToErrorMap.set("IncorrectAccount", IncorrectAccountError);
    var IncorrectAssetHashError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Incorrect asset hash", program, cause);
        this.name = "IncorrectAssetHash";
        this.code = 7;
      }
    };
    exports2.IncorrectAssetHashError = IncorrectAssetHashError;
    codeToErrorMap.set(7, IncorrectAssetHashError);
    nameToErrorMap.set("IncorrectAssetHash", IncorrectAssetHashError);
    var InvalidPluginError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid Plugin", program, cause);
        this.name = "InvalidPlugin";
        this.code = 8;
      }
    };
    exports2.InvalidPluginError = InvalidPluginError;
    codeToErrorMap.set(8, InvalidPluginError);
    nameToErrorMap.set("InvalidPlugin", InvalidPluginError);
    var InvalidAuthorityError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid Authority", program, cause);
        this.name = "InvalidAuthority";
        this.code = 9;
      }
    };
    exports2.InvalidAuthorityError = InvalidAuthorityError;
    codeToErrorMap.set(9, InvalidAuthorityError);
    nameToErrorMap.set("InvalidAuthority", InvalidAuthorityError);
    var AssetIsFrozenError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Cannot transfer a frozen asset", program, cause);
        this.name = "AssetIsFrozen";
        this.code = 10;
      }
    };
    exports2.AssetIsFrozenError = AssetIsFrozenError;
    codeToErrorMap.set(10, AssetIsFrozenError);
    nameToErrorMap.set("AssetIsFrozen", AssetIsFrozenError);
    var MissingCompressionProofError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing compression proof", program, cause);
        this.name = "MissingCompressionProof";
        this.code = 11;
      }
    };
    exports2.MissingCompressionProofError = MissingCompressionProofError;
    codeToErrorMap.set(11, MissingCompressionProofError);
    nameToErrorMap.set("MissingCompressionProof", MissingCompressionProofError);
    var CannotMigrateMasterWithSupplyError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Cannot migrate a master edition used for prints", program, cause);
        this.name = "CannotMigrateMasterWithSupply";
        this.code = 12;
      }
    };
    exports2.CannotMigrateMasterWithSupplyError = CannotMigrateMasterWithSupplyError;
    codeToErrorMap.set(12, CannotMigrateMasterWithSupplyError);
    nameToErrorMap.set("CannotMigrateMasterWithSupply", CannotMigrateMasterWithSupplyError);
    var CannotMigratePrintsError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Cannot migrate a print edition", program, cause);
        this.name = "CannotMigratePrints";
        this.code = 13;
      }
    };
    exports2.CannotMigratePrintsError = CannotMigratePrintsError;
    codeToErrorMap.set(13, CannotMigratePrintsError);
    nameToErrorMap.set("CannotMigratePrints", CannotMigratePrintsError);
    var CannotBurnCollectionError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Cannot burn a collection NFT", program, cause);
        this.name = "CannotBurnCollection";
        this.code = 14;
      }
    };
    exports2.CannotBurnCollectionError = CannotBurnCollectionError;
    codeToErrorMap.set(14, CannotBurnCollectionError);
    nameToErrorMap.set("CannotBurnCollection", CannotBurnCollectionError);
    var PluginAlreadyExistsError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Plugin already exists", program, cause);
        this.name = "PluginAlreadyExists";
        this.code = 15;
      }
    };
    exports2.PluginAlreadyExistsError = PluginAlreadyExistsError;
    codeToErrorMap.set(15, PluginAlreadyExistsError);
    nameToErrorMap.set("PluginAlreadyExists", PluginAlreadyExistsError);
    var NumericalOverflowErrorError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Numerical overflow", program, cause);
        this.name = "NumericalOverflowError";
        this.code = 16;
      }
    };
    exports2.NumericalOverflowErrorError = NumericalOverflowErrorError;
    codeToErrorMap.set(16, NumericalOverflowErrorError);
    nameToErrorMap.set("NumericalOverflowError", NumericalOverflowErrorError);
    var AlreadyCompressedError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Already compressed account", program, cause);
        this.name = "AlreadyCompressed";
        this.code = 17;
      }
    };
    exports2.AlreadyCompressedError = AlreadyCompressedError;
    codeToErrorMap.set(17, AlreadyCompressedError);
    nameToErrorMap.set("AlreadyCompressed", AlreadyCompressedError);
    var AlreadyDecompressedError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Already decompressed account", program, cause);
        this.name = "AlreadyDecompressed";
        this.code = 18;
      }
    };
    exports2.AlreadyDecompressedError = AlreadyDecompressedError;
    codeToErrorMap.set(18, AlreadyDecompressedError);
    nameToErrorMap.set("AlreadyDecompressed", AlreadyDecompressedError);
    var InvalidCollectionError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid Collection passed in", program, cause);
        this.name = "InvalidCollection";
        this.code = 19;
      }
    };
    exports2.InvalidCollectionError = InvalidCollectionError;
    codeToErrorMap.set(19, InvalidCollectionError);
    nameToErrorMap.set("InvalidCollection", InvalidCollectionError);
    var MissingUpdateAuthorityError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing update authority", program, cause);
        this.name = "MissingUpdateAuthority";
        this.code = 20;
      }
    };
    exports2.MissingUpdateAuthorityError = MissingUpdateAuthorityError;
    codeToErrorMap.set(20, MissingUpdateAuthorityError);
    nameToErrorMap.set("MissingUpdateAuthority", MissingUpdateAuthorityError);
    var MissingNewOwnerError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing new owner", program, cause);
        this.name = "MissingNewOwner";
        this.code = 21;
      }
    };
    exports2.MissingNewOwnerError = MissingNewOwnerError;
    codeToErrorMap.set(21, MissingNewOwnerError);
    nameToErrorMap.set("MissingNewOwner", MissingNewOwnerError);
    var MissingSystemProgramError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing system program", program, cause);
        this.name = "MissingSystemProgram";
        this.code = 22;
      }
    };
    exports2.MissingSystemProgramError = MissingSystemProgramError;
    codeToErrorMap.set(22, MissingSystemProgramError);
    nameToErrorMap.set("MissingSystemProgram", MissingSystemProgramError);
    var NotAvailableError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Feature not available", program, cause);
        this.name = "NotAvailable";
        this.code = 23;
      }
    };
    exports2.NotAvailableError = NotAvailableError;
    codeToErrorMap.set(23, NotAvailableError);
    nameToErrorMap.set("NotAvailable", NotAvailableError);
    var InvalidAssetError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid Asset passed in", program, cause);
        this.name = "InvalidAsset";
        this.code = 24;
      }
    };
    exports2.InvalidAssetError = InvalidAssetError;
    codeToErrorMap.set(24, InvalidAssetError);
    nameToErrorMap.set("InvalidAsset", InvalidAssetError);
    var MissingCollectionError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing collection", program, cause);
        this.name = "MissingCollection";
        this.code = 25;
      }
    };
    exports2.MissingCollectionError = MissingCollectionError;
    codeToErrorMap.set(25, MissingCollectionError);
    nameToErrorMap.set("MissingCollection", MissingCollectionError);
    var NoApprovalsError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Neither the asset or any plugins have approved this operation", program, cause);
        this.name = "NoApprovals";
        this.code = 26;
      }
    };
    exports2.NoApprovalsError = NoApprovalsError;
    codeToErrorMap.set(26, NoApprovalsError);
    nameToErrorMap.set("NoApprovals", NoApprovalsError);
    var CannotRedelegateError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Plugin Manager cannot redelegate a delegated plugin without revoking first", program, cause);
        this.name = "CannotRedelegate";
        this.code = 27;
      }
    };
    exports2.CannotRedelegateError = CannotRedelegateError;
    codeToErrorMap.set(27, CannotRedelegateError);
    nameToErrorMap.set("CannotRedelegate", CannotRedelegateError);
    var InvalidPluginSettingError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid setting for plugin", program, cause);
        this.name = "InvalidPluginSetting";
        this.code = 28;
      }
    };
    exports2.InvalidPluginSettingError = InvalidPluginSettingError;
    codeToErrorMap.set(28, InvalidPluginSettingError);
    nameToErrorMap.set("InvalidPluginSetting", InvalidPluginSettingError);
    var ConflictingAuthorityError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Cannot specify both an update authority and collection on an asset", program, cause);
        this.name = "ConflictingAuthority";
        this.code = 29;
      }
    };
    exports2.ConflictingAuthorityError = ConflictingAuthorityError;
    codeToErrorMap.set(29, ConflictingAuthorityError);
    nameToErrorMap.set("ConflictingAuthority", ConflictingAuthorityError);
    var InvalidLogWrapperProgramError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid Log Wrapper Program", program, cause);
        this.name = "InvalidLogWrapperProgram";
        this.code = 30;
      }
    };
    exports2.InvalidLogWrapperProgramError = InvalidLogWrapperProgramError;
    codeToErrorMap.set(30, InvalidLogWrapperProgramError);
    nameToErrorMap.set("InvalidLogWrapperProgram", InvalidLogWrapperProgramError);
    var ExternalPluginAdapterNotFoundError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("External Plugin Adapter not found", program, cause);
        this.name = "ExternalPluginAdapterNotFound";
        this.code = 31;
      }
    };
    exports2.ExternalPluginAdapterNotFoundError = ExternalPluginAdapterNotFoundError;
    codeToErrorMap.set(31, ExternalPluginAdapterNotFoundError);
    nameToErrorMap.set("ExternalPluginAdapterNotFound", ExternalPluginAdapterNotFoundError);
    var ExternalPluginAdapterAlreadyExistsError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("External Plugin Adapter already exists", program, cause);
        this.name = "ExternalPluginAdapterAlreadyExists";
        this.code = 32;
      }
    };
    exports2.ExternalPluginAdapterAlreadyExistsError = ExternalPluginAdapterAlreadyExistsError;
    codeToErrorMap.set(32, ExternalPluginAdapterAlreadyExistsError);
    nameToErrorMap.set("ExternalPluginAdapterAlreadyExists", ExternalPluginAdapterAlreadyExistsError);
    var MissingAssetError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing asset needed for extra account PDA derivation", program, cause);
        this.name = "MissingAsset";
        this.code = 33;
      }
    };
    exports2.MissingAssetError = MissingAssetError;
    codeToErrorMap.set(33, MissingAssetError);
    nameToErrorMap.set("MissingAsset", MissingAssetError);
    var MissingExternalPluginAdapterAccountError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing account needed for external plugin adapter", program, cause);
        this.name = "MissingExternalPluginAdapterAccount";
        this.code = 34;
      }
    };
    exports2.MissingExternalPluginAdapterAccountError = MissingExternalPluginAdapterAccountError;
    codeToErrorMap.set(34, MissingExternalPluginAdapterAccountError);
    nameToErrorMap.set("MissingExternalPluginAdapterAccount", MissingExternalPluginAdapterAccountError);
    var OracleCanRejectOnlyError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Oracle external plugin adapter can only be configured to reject", program, cause);
        this.name = "OracleCanRejectOnly";
        this.code = 35;
      }
    };
    exports2.OracleCanRejectOnlyError = OracleCanRejectOnlyError;
    codeToErrorMap.set(35, OracleCanRejectOnlyError);
    nameToErrorMap.set("OracleCanRejectOnly", OracleCanRejectOnlyError);
    var RequiresLifecycleCheckError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("External plugin adapter must have at least one lifecycle check", program, cause);
        this.name = "RequiresLifecycleCheck";
        this.code = 36;
      }
    };
    exports2.RequiresLifecycleCheckError = RequiresLifecycleCheckError;
    codeToErrorMap.set(36, RequiresLifecycleCheckError);
    nameToErrorMap.set("RequiresLifecycleCheck", RequiresLifecycleCheckError);
    var DuplicateLifecycleChecksError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Duplicate lifecycle checks were provided for external plugin adapter ", program, cause);
        this.name = "DuplicateLifecycleChecks";
        this.code = 37;
      }
    };
    exports2.DuplicateLifecycleChecksError = DuplicateLifecycleChecksError;
    codeToErrorMap.set(37, DuplicateLifecycleChecksError);
    nameToErrorMap.set("DuplicateLifecycleChecks", DuplicateLifecycleChecksError);
    var InvalidOracleAccountDataError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Could not read from oracle account", program, cause);
        this.name = "InvalidOracleAccountData";
        this.code = 38;
      }
    };
    exports2.InvalidOracleAccountDataError = InvalidOracleAccountDataError;
    codeToErrorMap.set(38, InvalidOracleAccountDataError);
    nameToErrorMap.set("InvalidOracleAccountData", InvalidOracleAccountDataError);
    var UninitializedOracleAccountError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Oracle account is uninitialized", program, cause);
        this.name = "UninitializedOracleAccount";
        this.code = 39;
      }
    };
    exports2.UninitializedOracleAccountError = UninitializedOracleAccountError;
    codeToErrorMap.set(39, UninitializedOracleAccountError);
    nameToErrorMap.set("UninitializedOracleAccount", UninitializedOracleAccountError);
    var MissingSignerError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Missing required signer for operation", program, cause);
        this.name = "MissingSigner";
        this.code = 40;
      }
    };
    exports2.MissingSignerError = MissingSignerError;
    codeToErrorMap.set(40, MissingSignerError);
    nameToErrorMap.set("MissingSigner", MissingSignerError);
    var InvalidPluginOperationError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid plugin operation", program, cause);
        this.name = "InvalidPluginOperation";
        this.code = 41;
      }
    };
    exports2.InvalidPluginOperationError = InvalidPluginOperationError;
    codeToErrorMap.set(41, InvalidPluginOperationError);
    nameToErrorMap.set("InvalidPluginOperation", InvalidPluginOperationError);
    var CollectionMustBeEmptyError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Collection must be empty to be burned", program, cause);
        this.name = "CollectionMustBeEmpty";
        this.code = 42;
      }
    };
    exports2.CollectionMustBeEmptyError = CollectionMustBeEmptyError;
    codeToErrorMap.set(42, CollectionMustBeEmptyError);
    nameToErrorMap.set("CollectionMustBeEmpty", CollectionMustBeEmptyError);
    var TwoDataSourcesError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Two data sources provided, only one is allowed", program, cause);
        this.name = "TwoDataSources";
        this.code = 43;
      }
    };
    exports2.TwoDataSourcesError = TwoDataSourcesError;
    codeToErrorMap.set(43, TwoDataSourcesError);
    nameToErrorMap.set("TwoDataSources", TwoDataSourcesError);
    var UnsupportedOperationError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("External Plugin does not support this operation", program, cause);
        this.name = "UnsupportedOperation";
        this.code = 44;
      }
    };
    exports2.UnsupportedOperationError = UnsupportedOperationError;
    codeToErrorMap.set(44, UnsupportedOperationError);
    nameToErrorMap.set("UnsupportedOperation", UnsupportedOperationError);
    var NoDataSourcesError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("No data sources provided, one is required", program, cause);
        this.name = "NoDataSources";
        this.code = 45;
      }
    };
    exports2.NoDataSourcesError = NoDataSourcesError;
    codeToErrorMap.set(45, NoDataSourcesError);
    nameToErrorMap.set("NoDataSources", NoDataSourcesError);
    var InvalidPluginAdapterTargetError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("This plugin adapter cannot be added to an Asset", program, cause);
        this.name = "InvalidPluginAdapterTarget";
        this.code = 46;
      }
    };
    exports2.InvalidPluginAdapterTargetError = InvalidPluginAdapterTargetError;
    codeToErrorMap.set(46, InvalidPluginAdapterTargetError);
    nameToErrorMap.set("InvalidPluginAdapterTarget", InvalidPluginAdapterTargetError);
    var CannotAddDataSectionError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Cannot add a Data Section without a linked external plugin", program, cause);
        this.name = "CannotAddDataSection";
        this.code = 47;
      }
    };
    exports2.CannotAddDataSectionError = CannotAddDataSectionError;
    codeToErrorMap.set(47, CannotAddDataSectionError);
    nameToErrorMap.set("CannotAddDataSection", CannotAddDataSectionError);
    var PermanentDelegatesPreventMoveError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Cannot move asset to collection with permanent delegates", program, cause);
        this.name = "PermanentDelegatesPreventMove";
        this.code = 48;
      }
    };
    exports2.PermanentDelegatesPreventMoveError = PermanentDelegatesPreventMoveError;
    codeToErrorMap.set(48, PermanentDelegatesPreventMoveError);
    nameToErrorMap.set("PermanentDelegatesPreventMove", PermanentDelegatesPreventMoveError);
    var InvalidExecutePdaError = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Invalid Signing PDA for Asset or Collection Execute", program, cause);
        this.name = "InvalidExecutePda";
        this.code = 49;
      }
    };
    exports2.InvalidExecutePdaError = InvalidExecutePdaError;
    codeToErrorMap.set(49, InvalidExecutePdaError);
    nameToErrorMap.set("InvalidExecutePda", InvalidExecutePdaError);
    var BlockedByBubblegumV2Error = class extends umi_1.ProgramError {
      constructor(program, cause) {
        super("Bubblegum V2 Plugin limits other plugins", program, cause);
        this.name = "BlockedByBubblegumV2";
        this.code = 50;
      }
    };
    exports2.BlockedByBubblegumV2Error = BlockedByBubblegumV2Error;
    codeToErrorMap.set(50, BlockedByBubblegumV2Error);
    nameToErrorMap.set("BlockedByBubblegumV2", BlockedByBubblegumV2Error);
    function getMplCoreErrorFromCode(code, program, cause) {
      const constructor = codeToErrorMap.get(code);
      return constructor ? new constructor(program, cause) : null;
    }
    exports2.getMplCoreErrorFromCode = getMplCoreErrorFromCode;
    function getMplCoreErrorFromName(name, program, cause) {
      const constructor = nameToErrorMap.get(name);
      return constructor ? new constructor(program, cause) : null;
    }
    exports2.getMplCoreErrorFromName = getMplCoreErrorFromName;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/errors/index.js
var require_errors6 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/errors/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_mplCore(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/shared/index.js
var require_shared = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/shared/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAccountMetasAndSigners = exports2.expectPda = exports2.expectPublicKey = exports2.expectSome = void 0;
    var umi_1 = require_cjs7();
    function expectSome(value) {
      if (value == null) {
        throw new Error("Expected a value but received null or undefined.");
      }
      return value;
    }
    exports2.expectSome = expectSome;
    function expectPublicKey(value) {
      if (!value) {
        throw new Error("Expected a PublicKey.");
      }
      return (0, umi_1.publicKey)(value, false);
    }
    exports2.expectPublicKey = expectPublicKey;
    function expectPda(value) {
      if (!value || !Array.isArray(value) || !(0, umi_1.isPda)(value)) {
        throw new Error("Expected a PDA.");
      }
      return value;
    }
    exports2.expectPda = expectPda;
    function getAccountMetasAndSigners(accounts, optionalAccountStrategy, programId) {
      const keys = [];
      const signers = [];
      accounts.forEach((account) => {
        if (!account.value) {
          if (optionalAccountStrategy === "omitted")
            return;
          keys.push({ pubkey: programId, isSigner: false, isWritable: false });
          return;
        }
        if ((0, umi_1.isSigner)(account.value)) {
          signers.push(account.value);
        }
        keys.push({
          pubkey: (0, umi_1.publicKey)(account.value, false),
          isSigner: (0, umi_1.isSigner)(account.value),
          isWritable: account.isWritable
        });
      });
      return [keys, signers];
    }
    exports2.getAccountMetasAndSigners = getAccountMetasAndSigners;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addCollectionExternalPluginAdapterV1.js
var require_addCollectionExternalPluginAdapterV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addCollectionExternalPluginAdapterV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addCollectionExternalPluginAdapterV1 = exports2.getAddCollectionExternalPluginAdapterV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getAddCollectionExternalPluginAdapterV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["initInfo", (0, types_1.getBaseExternalPluginAdapterInitInfoSerializer)()]
      ], { description: "AddCollectionExternalPluginAdapterV1InstructionData" }), (value) => ({ ...value, discriminator: 23 }));
    }
    exports2.getAddCollectionExternalPluginAdapterV1InstructionDataSerializer = getAddCollectionExternalPluginAdapterV1InstructionDataSerializer;
    function addCollectionExternalPluginAdapterV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getAddCollectionExternalPluginAdapterV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.addCollectionExternalPluginAdapterV1 = addCollectionExternalPluginAdapterV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addCollectionPluginV1.js
var require_addCollectionPluginV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addCollectionPluginV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addCollectionPluginV1 = exports2.getAddCollectionPluginV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getAddCollectionPluginV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["plugin", (0, types_1.getPluginSerializer)()],
        ["initAuthority", (0, serializers_1.option)((0, types_1.getBasePluginAuthoritySerializer)())]
      ], { description: "AddCollectionPluginV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 3,
        initAuthority: value.initAuthority ?? (0, umi_1.none)()
      }));
    }
    exports2.getAddCollectionPluginV1InstructionDataSerializer = getAddCollectionPluginV1InstructionDataSerializer;
    function addCollectionPluginV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getAddCollectionPluginV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.addCollectionPluginV1 = addCollectionPluginV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addExternalPluginAdapterV1.js
var require_addExternalPluginAdapterV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addExternalPluginAdapterV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addExternalPluginAdapterV1 = exports2.getAddExternalPluginAdapterV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getAddExternalPluginAdapterV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["initInfo", (0, types_1.getBaseExternalPluginAdapterInitInfoSerializer)()]
      ], { description: "AddExternalPluginAdapterV1InstructionData" }), (value) => ({ ...value, discriminator: 22 }));
    }
    exports2.getAddExternalPluginAdapterV1InstructionDataSerializer = getAddExternalPluginAdapterV1InstructionDataSerializer;
    function addExternalPluginAdapterV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getAddExternalPluginAdapterV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.addExternalPluginAdapterV1 = addExternalPluginAdapterV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addPluginV1.js
var require_addPluginV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/addPluginV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addPluginV1 = exports2.getAddPluginV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getAddPluginV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["plugin", (0, types_1.getPluginSerializer)()],
        ["initAuthority", (0, serializers_1.option)((0, types_1.getBasePluginAuthoritySerializer)())]
      ], { description: "AddPluginV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 2,
        initAuthority: value.initAuthority ?? (0, umi_1.none)()
      }));
    }
    exports2.getAddPluginV1InstructionDataSerializer = getAddPluginV1InstructionDataSerializer;
    function addPluginV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getAddPluginV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.addPluginV1 = addPluginV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/approveCollectionPluginAuthorityV1.js
var require_approveCollectionPluginAuthorityV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/approveCollectionPluginAuthorityV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.approveCollectionPluginAuthorityV1 = exports2.getApproveCollectionPluginAuthorityV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getApproveCollectionPluginAuthorityV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["pluginType", (0, types_1.getPluginTypeSerializer)()],
        ["newAuthority", (0, types_1.getBasePluginAuthoritySerializer)()]
      ], { description: "ApproveCollectionPluginAuthorityV1InstructionData" }), (value) => ({ ...value, discriminator: 9 }));
    }
    exports2.getApproveCollectionPluginAuthorityV1InstructionDataSerializer = getApproveCollectionPluginAuthorityV1InstructionDataSerializer;
    function approveCollectionPluginAuthorityV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getApproveCollectionPluginAuthorityV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.approveCollectionPluginAuthorityV1 = approveCollectionPluginAuthorityV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/approvePluginAuthorityV1.js
var require_approvePluginAuthorityV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/approvePluginAuthorityV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.approvePluginAuthorityV1 = exports2.getApprovePluginAuthorityV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getApprovePluginAuthorityV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["pluginType", (0, types_1.getPluginTypeSerializer)()],
        ["newAuthority", (0, types_1.getBasePluginAuthoritySerializer)()]
      ], { description: "ApprovePluginAuthorityV1InstructionData" }), (value) => ({ ...value, discriminator: 8 }));
    }
    exports2.getApprovePluginAuthorityV1InstructionDataSerializer = getApprovePluginAuthorityV1InstructionDataSerializer;
    function approvePluginAuthorityV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getApprovePluginAuthorityV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.approvePluginAuthorityV1 = approvePluginAuthorityV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/burnCollectionV1.js
var require_burnCollectionV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/burnCollectionV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.burnCollectionV1 = exports2.getBurnCollectionV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getBurnCollectionV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["compressionProof", (0, serializers_1.option)((0, types_1.getCompressionProofSerializer)())]
      ], { description: "BurnCollectionV1InstructionData" }), (value) => ({ ...value, discriminator: 13 }));
    }
    exports2.getBurnCollectionV1InstructionDataSerializer = getBurnCollectionV1InstructionDataSerializer;
    function burnCollectionV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: true,
          value: input.authority ?? null
        },
        logWrapper: {
          index: 3,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getBurnCollectionV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.burnCollectionV1 = burnCollectionV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/burnV1.js
var require_burnV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/burnV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.burnV1 = exports2.getBurnV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getBurnV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["compressionProof", (0, serializers_1.option)((0, types_1.getCompressionProofSerializer)())]
      ], { description: "BurnV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 12,
        compressionProof: value.compressionProof ?? (0, umi_1.none)()
      }));
    }
    exports2.getBurnV1InstructionDataSerializer = getBurnV1InstructionDataSerializer;
    function burnV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getBurnV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.burnV1 = burnV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/collect.js
var require_collect = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/collect.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.collect = exports2.getCollectInstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    function getCollectInstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([["discriminator", (0, serializers_1.u8)()]], {
        description: "CollectInstructionData"
      }), (value) => ({ ...value, discriminator: 19 }));
    }
    exports2.getCollectInstructionDataSerializer = getCollectInstructionDataSerializer;
    function collect(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        recipient1: {
          index: 0,
          isWritable: true,
          value: input.recipient1 ?? null
        },
        recipient2: {
          index: 1,
          isWritable: true,
          value: input.recipient2 ?? null
        }
      };
      if (!resolvedAccounts.recipient1.value) {
        resolvedAccounts.recipient1.value = (0, umi_1.publicKey)("8AT6o8Qk5T9QnZvPThMrF9bcCQLTGkyGvVZZzHgCw11v");
      }
      if (!resolvedAccounts.recipient2.value) {
        resolvedAccounts.recipient2.value = (0, umi_1.publicKey)("MmHsqX4LxTfifxoH8BVRLUKrwDn1LPCac6YcCZTHhwt");
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getCollectInstructionDataSerializer().serialize({});
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.collect = collect;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/compressV1.js
var require_compressV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/compressV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.compressV1 = exports2.getCompressV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    function getCompressV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([["discriminator", (0, serializers_1.u8)()]], {
        description: "CompressV1InstructionData"
      }), (value) => ({ ...value, discriminator: 17 }));
    }
    exports2.getCompressV1InstructionDataSerializer = getCompressV1InstructionDataSerializer;
    function compressV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: false,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getCompressV1InstructionDataSerializer().serialize({});
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.compressV1 = compressV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createCollectionV1.js
var require_createCollectionV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createCollectionV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createCollectionV1 = exports2.getCreateCollectionV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getCreateCollectionV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["name", (0, serializers_1.string)()],
        ["uri", (0, serializers_1.string)()],
        ["plugins", (0, serializers_1.option)((0, serializers_1.array)((0, types_1.getPluginAuthorityPairSerializer)()))]
      ], { description: "CreateCollectionV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 1,
        plugins: value.plugins ?? (0, umi_1.none)()
      }));
    }
    exports2.getCreateCollectionV1InstructionDataSerializer = getCreateCollectionV1InstructionDataSerializer;
    function createCollectionV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        updateAuthority: {
          index: 1,
          isWritable: false,
          value: input.updateAuthority ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getCreateCollectionV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.createCollectionV1 = createCollectionV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createCollectionV2.js
var require_createCollectionV2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createCollectionV2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createCollectionV2 = exports2.getCreateCollectionV2InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getCreateCollectionV2InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["name", (0, serializers_1.string)()],
        ["uri", (0, serializers_1.string)()],
        ["plugins", (0, serializers_1.option)((0, serializers_1.array)((0, types_1.getPluginAuthorityPairSerializer)()))],
        [
          "externalPluginAdapters",
          (0, serializers_1.option)((0, serializers_1.array)((0, types_1.getBaseExternalPluginAdapterInitInfoSerializer)()))
        ]
      ], { description: "CreateCollectionV2InstructionData" }), (value) => ({
        ...value,
        discriminator: 21,
        plugins: value.plugins ?? (0, umi_1.none)(),
        externalPluginAdapters: value.externalPluginAdapters ?? []
      }));
    }
    exports2.getCreateCollectionV2InstructionDataSerializer = getCreateCollectionV2InstructionDataSerializer;
    function createCollectionV2(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        updateAuthority: {
          index: 1,
          isWritable: false,
          value: input.updateAuthority ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getCreateCollectionV2InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.createCollectionV2 = createCollectionV2;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createV1.js
var require_createV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createV1 = exports2.getCreateV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getCreateV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["dataState", (0, types_1.getDataStateSerializer)()],
        ["name", (0, serializers_1.string)()],
        ["uri", (0, serializers_1.string)()],
        ["plugins", (0, serializers_1.option)((0, serializers_1.array)((0, types_1.getPluginAuthorityPairSerializer)()))]
      ], { description: "CreateV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 0,
        dataState: value.dataState ?? types_1.DataState.AccountState,
        plugins: value.plugins ?? []
      }));
    }
    exports2.getCreateV1InstructionDataSerializer = getCreateV1InstructionDataSerializer;
    function createV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        payer: {
          index: 3,
          isWritable: true,
          value: input.payer ?? null
        },
        owner: {
          index: 4,
          isWritable: false,
          value: input.owner ?? null
        },
        updateAuthority: {
          index: 5,
          isWritable: false,
          value: input.updateAuthority ?? null
        },
        systemProgram: {
          index: 6,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 7,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getCreateV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.createV1 = createV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createV2.js
var require_createV2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/createV2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createV2 = exports2.getCreateV2InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getCreateV2InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["dataState", (0, types_1.getDataStateSerializer)()],
        ["name", (0, serializers_1.string)()],
        ["uri", (0, serializers_1.string)()],
        ["plugins", (0, serializers_1.option)((0, serializers_1.array)((0, types_1.getPluginAuthorityPairSerializer)()))],
        [
          "externalPluginAdapters",
          (0, serializers_1.option)((0, serializers_1.array)((0, types_1.getBaseExternalPluginAdapterInitInfoSerializer)()))
        ]
      ], { description: "CreateV2InstructionData" }), (value) => ({
        ...value,
        discriminator: 20,
        dataState: value.dataState ?? types_1.DataState.AccountState,
        plugins: value.plugins ?? [],
        externalPluginAdapters: value.externalPluginAdapters ?? []
      }));
    }
    exports2.getCreateV2InstructionDataSerializer = getCreateV2InstructionDataSerializer;
    function createV2(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        payer: {
          index: 3,
          isWritable: true,
          value: input.payer ?? null
        },
        owner: {
          index: 4,
          isWritable: false,
          value: input.owner ?? null
        },
        updateAuthority: {
          index: 5,
          isWritable: false,
          value: input.updateAuthority ?? null
        },
        systemProgram: {
          index: 6,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 7,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getCreateV2InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.createV2 = createV2;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/decompressV1.js
var require_decompressV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/decompressV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.decompressV1 = exports2.getDecompressV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getDecompressV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["compressionProof", (0, types_1.getCompressionProofSerializer)()]
      ], { description: "DecompressV1InstructionData" }), (value) => ({ ...value, discriminator: 18 }));
    }
    exports2.getDecompressV1InstructionDataSerializer = getDecompressV1InstructionDataSerializer;
    function decompressV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: false,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getDecompressV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.decompressV1 = decompressV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/executeV1.js
var require_executeV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/executeV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.executeV1 = exports2.getExecuteV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var accounts_1 = require_accounts();
    var shared_1 = require_shared();
    function getExecuteV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["instructionData", (0, serializers_1.bytes)({ size: (0, serializers_1.u32)() })]
      ], { description: "ExecuteV1InstructionData" }), (value) => ({ ...value, discriminator: 31 }));
    }
    exports2.getExecuteV1InstructionDataSerializer = getExecuteV1InstructionDataSerializer;
    function executeV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        assetSigner: {
          index: 2,
          isWritable: false,
          value: input.assetSigner ?? null
        },
        payer: {
          index: 3,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 4,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 5,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        programId: {
          index: 6,
          isWritable: false,
          value: input.programId ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.assetSigner.value) {
        resolvedAccounts.assetSigner.value = (0, accounts_1.findAssetSignerPda)(context, {
          asset: (0, shared_1.expectPublicKey)(resolvedAccounts.asset.value)
        });
      }
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      if (!resolvedAccounts.programId.value) {
        resolvedAccounts.programId.value = programId;
        resolvedAccounts.programId.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getExecuteV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.executeV1 = executeV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removeCollectionExternalPluginAdapterV1.js
var require_removeCollectionExternalPluginAdapterV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removeCollectionExternalPluginAdapterV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeCollectionExternalPluginAdapterV1 = exports2.getRemoveCollectionExternalPluginAdapterV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getRemoveCollectionExternalPluginAdapterV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["key", (0, types_1.getBaseExternalPluginAdapterKeySerializer)()]
      ], { description: "RemoveCollectionExternalPluginAdapterV1InstructionData" }), (value) => ({ ...value, discriminator: 25 }));
    }
    exports2.getRemoveCollectionExternalPluginAdapterV1InstructionDataSerializer = getRemoveCollectionExternalPluginAdapterV1InstructionDataSerializer;
    function removeCollectionExternalPluginAdapterV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getRemoveCollectionExternalPluginAdapterV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.removeCollectionExternalPluginAdapterV1 = removeCollectionExternalPluginAdapterV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removeCollectionPluginV1.js
var require_removeCollectionPluginV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removeCollectionPluginV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeCollectionPluginV1 = exports2.getRemoveCollectionPluginV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getRemoveCollectionPluginV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["pluginType", (0, types_1.getPluginTypeSerializer)()]
      ], { description: "RemoveCollectionPluginV1InstructionData" }), (value) => ({ ...value, discriminator: 5 }));
    }
    exports2.getRemoveCollectionPluginV1InstructionDataSerializer = getRemoveCollectionPluginV1InstructionDataSerializer;
    function removeCollectionPluginV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getRemoveCollectionPluginV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.removeCollectionPluginV1 = removeCollectionPluginV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removeExternalPluginAdapterV1.js
var require_removeExternalPluginAdapterV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removeExternalPluginAdapterV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeExternalPluginAdapterV1 = exports2.getRemoveExternalPluginAdapterV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getRemoveExternalPluginAdapterV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["key", (0, types_1.getBaseExternalPluginAdapterKeySerializer)()]
      ], { description: "RemoveExternalPluginAdapterV1InstructionData" }), (value) => ({ ...value, discriminator: 24 }));
    }
    exports2.getRemoveExternalPluginAdapterV1InstructionDataSerializer = getRemoveExternalPluginAdapterV1InstructionDataSerializer;
    function removeExternalPluginAdapterV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getRemoveExternalPluginAdapterV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.removeExternalPluginAdapterV1 = removeExternalPluginAdapterV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removePluginV1.js
var require_removePluginV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/removePluginV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removePluginV1 = exports2.getRemovePluginV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getRemovePluginV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["pluginType", (0, types_1.getPluginTypeSerializer)()]
      ], { description: "RemovePluginV1InstructionData" }), (value) => ({ ...value, discriminator: 4 }));
    }
    exports2.getRemovePluginV1InstructionDataSerializer = getRemovePluginV1InstructionDataSerializer;
    function removePluginV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getRemovePluginV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.removePluginV1 = removePluginV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/revokeCollectionPluginAuthorityV1.js
var require_revokeCollectionPluginAuthorityV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/revokeCollectionPluginAuthorityV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.revokeCollectionPluginAuthorityV1 = exports2.getRevokeCollectionPluginAuthorityV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getRevokeCollectionPluginAuthorityV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["pluginType", (0, types_1.getPluginTypeSerializer)()]
      ], { description: "RevokeCollectionPluginAuthorityV1InstructionData" }), (value) => ({ ...value, discriminator: 11 }));
    }
    exports2.getRevokeCollectionPluginAuthorityV1InstructionDataSerializer = getRevokeCollectionPluginAuthorityV1InstructionDataSerializer;
    function revokeCollectionPluginAuthorityV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getRevokeCollectionPluginAuthorityV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.revokeCollectionPluginAuthorityV1 = revokeCollectionPluginAuthorityV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/revokePluginAuthorityV1.js
var require_revokePluginAuthorityV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/revokePluginAuthorityV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.revokePluginAuthorityV1 = exports2.getRevokePluginAuthorityV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getRevokePluginAuthorityV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["pluginType", (0, types_1.getPluginTypeSerializer)()]
      ], { description: "RevokePluginAuthorityV1InstructionData" }), (value) => ({ ...value, discriminator: 10 }));
    }
    exports2.getRevokePluginAuthorityV1InstructionDataSerializer = getRevokePluginAuthorityV1InstructionDataSerializer;
    function revokePluginAuthorityV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getRevokePluginAuthorityV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.revokePluginAuthorityV1 = revokePluginAuthorityV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/transferV1.js
var require_transferV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/transferV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.transferV1 = exports2.getTransferV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getTransferV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["compressionProof", (0, serializers_1.option)((0, types_1.getCompressionProofSerializer)())]
      ], { description: "TransferV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 14,
        compressionProof: value.compressionProof ?? (0, umi_1.none)()
      }));
    }
    exports2.getTransferV1InstructionDataSerializer = getTransferV1InstructionDataSerializer;
    function transferV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: false,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        newOwner: {
          index: 4,
          isWritable: false,
          value: input.newOwner ?? null
        },
        systemProgram: {
          index: 5,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 6,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getTransferV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.transferV1 = transferV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionExternalPluginAdapterV1.js
var require_updateCollectionExternalPluginAdapterV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionExternalPluginAdapterV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateCollectionExternalPluginAdapterV1 = exports2.getUpdateCollectionExternalPluginAdapterV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getUpdateCollectionExternalPluginAdapterV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["key", (0, types_1.getBaseExternalPluginAdapterKeySerializer)()],
        ["updateInfo", (0, types_1.getBaseExternalPluginAdapterUpdateInfoSerializer)()]
      ], { description: "UpdateCollectionExternalPluginAdapterV1InstructionData" }), (value) => ({ ...value, discriminator: 27 }));
    }
    exports2.getUpdateCollectionExternalPluginAdapterV1InstructionDataSerializer = getUpdateCollectionExternalPluginAdapterV1InstructionDataSerializer;
    function updateCollectionExternalPluginAdapterV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdateCollectionExternalPluginAdapterV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updateCollectionExternalPluginAdapterV1 = updateCollectionExternalPluginAdapterV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionInfoV1.js
var require_updateCollectionInfoV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionInfoV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateCollectionInfoV1 = exports2.getUpdateCollectionInfoV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getUpdateCollectionInfoV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["updateType", (0, types_1.getUpdateTypeSerializer)()],
        ["amount", (0, serializers_1.u32)()]
      ], { description: "UpdateCollectionInfoV1InstructionData" }), (value) => ({ ...value, discriminator: 32 }));
    }
    exports2.getUpdateCollectionInfoV1InstructionDataSerializer = getUpdateCollectionInfoV1InstructionDataSerializer;
    function updateCollectionInfoV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        bubblegumSigner: {
          index: 1,
          isWritable: false,
          value: input.bubblegumSigner ?? null
        }
      };
      const resolvedArgs = { ...input };
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdateCollectionInfoV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updateCollectionInfoV1 = updateCollectionInfoV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionPluginV1.js
var require_updateCollectionPluginV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionPluginV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateCollectionPluginV1 = exports2.getUpdateCollectionPluginV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getUpdateCollectionPluginV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["plugin", (0, types_1.getPluginSerializer)()]
      ], { description: "UpdateCollectionPluginV1InstructionData" }), (value) => ({ ...value, discriminator: 7 }));
    }
    exports2.getUpdateCollectionPluginV1InstructionDataSerializer = getUpdateCollectionPluginV1InstructionDataSerializer;
    function updateCollectionPluginV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 3,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 4,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdateCollectionPluginV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updateCollectionPluginV1 = updateCollectionPluginV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionV1.js
var require_updateCollectionV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateCollectionV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateCollectionV1 = exports2.getUpdateCollectionV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    function getUpdateCollectionV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["newName", (0, serializers_1.option)((0, serializers_1.string)())],
        ["newUri", (0, serializers_1.option)((0, serializers_1.string)())]
      ], { description: "UpdateCollectionV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 16,
        newName: value.newName ?? (0, umi_1.none)(),
        newUri: value.newUri ?? (0, umi_1.none)()
      }));
    }
    exports2.getUpdateCollectionV1InstructionDataSerializer = getUpdateCollectionV1InstructionDataSerializer;
    function updateCollectionV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        newUpdateAuthority: {
          index: 3,
          isWritable: false,
          value: input.newUpdateAuthority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdateCollectionV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updateCollectionV1 = updateCollectionV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateExternalPluginAdapterV1.js
var require_updateExternalPluginAdapterV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateExternalPluginAdapterV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateExternalPluginAdapterV1 = exports2.getUpdateExternalPluginAdapterV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getUpdateExternalPluginAdapterV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["key", (0, types_1.getBaseExternalPluginAdapterKeySerializer)()],
        ["updateInfo", (0, types_1.getBaseExternalPluginAdapterUpdateInfoSerializer)()]
      ], { description: "UpdateExternalPluginAdapterV1InstructionData" }), (value) => ({ ...value, discriminator: 26 }));
    }
    exports2.getUpdateExternalPluginAdapterV1InstructionDataSerializer = getUpdateExternalPluginAdapterV1InstructionDataSerializer;
    function updateExternalPluginAdapterV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdateExternalPluginAdapterV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updateExternalPluginAdapterV1 = updateExternalPluginAdapterV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updatePluginV1.js
var require_updatePluginV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updatePluginV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updatePluginV1 = exports2.getUpdatePluginV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getUpdatePluginV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["plugin", (0, types_1.getPluginSerializer)()]
      ], { description: "UpdatePluginV1InstructionData" }), (value) => ({ ...value, discriminator: 6 }));
    }
    exports2.getUpdatePluginV1InstructionDataSerializer = getUpdatePluginV1InstructionDataSerializer;
    function updatePluginV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdatePluginV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updatePluginV1 = updatePluginV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateV1.js
var require_updateV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateV1 = exports2.getUpdateV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getUpdateV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["newName", (0, serializers_1.option)((0, serializers_1.string)())],
        ["newUri", (0, serializers_1.option)((0, serializers_1.string)())],
        ["newUpdateAuthority", (0, serializers_1.option)((0, types_1.getBaseUpdateAuthoritySerializer)())]
      ], { description: "UpdateV1InstructionData" }), (value) => ({
        ...value,
        discriminator: 15,
        newName: value.newName ?? (0, umi_1.none)(),
        newUri: value.newUri ?? (0, umi_1.none)(),
        newUpdateAuthority: value.newUpdateAuthority ?? (0, umi_1.none)()
      }));
    }
    exports2.getUpdateV1InstructionDataSerializer = getUpdateV1InstructionDataSerializer;
    function updateV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: false,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdateV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updateV1 = updateV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateV2.js
var require_updateV2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/updateV2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateV2 = exports2.getUpdateV2InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getUpdateV2InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["newName", (0, serializers_1.option)((0, serializers_1.string)())],
        ["newUri", (0, serializers_1.option)((0, serializers_1.string)())],
        ["newUpdateAuthority", (0, serializers_1.option)((0, types_1.getBaseUpdateAuthoritySerializer)())]
      ], { description: "UpdateV2InstructionData" }), (value) => ({
        ...value,
        discriminator: 30,
        newName: value.newName ?? (0, umi_1.none)(),
        newUri: value.newUri ?? (0, umi_1.none)(),
        newUpdateAuthority: value.newUpdateAuthority ?? (0, umi_1.none)()
      }));
    }
    exports2.getUpdateV2InstructionDataSerializer = getUpdateV2InstructionDataSerializer;
    function updateV2(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        newCollection: {
          index: 4,
          isWritable: true,
          value: input.newCollection ?? null
        },
        systemProgram: {
          index: 5,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 6,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getUpdateV2InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.updateV2 = updateV2;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/writeCollectionExternalPluginAdapterDataV1.js
var require_writeCollectionExternalPluginAdapterDataV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/writeCollectionExternalPluginAdapterDataV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.writeCollectionExternalPluginAdapterDataV1 = exports2.getWriteCollectionExternalPluginAdapterDataV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getWriteCollectionExternalPluginAdapterDataV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["key", (0, types_1.getBaseExternalPluginAdapterKeySerializer)()],
        ["data", (0, serializers_1.option)((0, serializers_1.bytes)({ size: (0, serializers_1.u32)() }))]
      ], {
        description: "WriteCollectionExternalPluginAdapterDataV1InstructionData"
      }), (value) => ({ ...value, discriminator: 29 }));
    }
    exports2.getWriteCollectionExternalPluginAdapterDataV1InstructionDataSerializer = getWriteCollectionExternalPluginAdapterDataV1InstructionDataSerializer;
    function writeCollectionExternalPluginAdapterDataV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        collection: {
          index: 0,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 1,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 2,
          isWritable: false,
          value: input.authority ?? null
        },
        buffer: {
          index: 3,
          isWritable: false,
          value: input.buffer ?? null
        },
        systemProgram: {
          index: 4,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 5,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = { ...input };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getWriteCollectionExternalPluginAdapterDataV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.writeCollectionExternalPluginAdapterDataV1 = writeCollectionExternalPluginAdapterDataV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/writeExternalPluginAdapterDataV1.js
var require_writeExternalPluginAdapterDataV1 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/writeExternalPluginAdapterDataV1.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.writeExternalPluginAdapterDataV1 = exports2.getWriteExternalPluginAdapterDataV1InstructionDataSerializer = void 0;
    var umi_1 = require_cjs7();
    var serializers_1 = require_serializers();
    var shared_1 = require_shared();
    var types_1 = require_types();
    function getWriteExternalPluginAdapterDataV1InstructionDataSerializer() {
      return (0, serializers_1.mapSerializer)((0, serializers_1.struct)([
        ["discriminator", (0, serializers_1.u8)()],
        ["key", (0, types_1.getBaseExternalPluginAdapterKeySerializer)()],
        ["data", (0, serializers_1.option)((0, serializers_1.bytes)({ size: (0, serializers_1.u32)() }))]
      ], { description: "WriteExternalPluginAdapterDataV1InstructionData" }), (value) => ({ ...value, discriminator: 28 }));
    }
    exports2.getWriteExternalPluginAdapterDataV1InstructionDataSerializer = getWriteExternalPluginAdapterDataV1InstructionDataSerializer;
    function writeExternalPluginAdapterDataV1(context, input) {
      const programId = context.programs.getPublicKey("mplCore", "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
      const resolvedAccounts = {
        asset: {
          index: 0,
          isWritable: true,
          value: input.asset ?? null
        },
        collection: {
          index: 1,
          isWritable: true,
          value: input.collection ?? null
        },
        payer: {
          index: 2,
          isWritable: true,
          value: input.payer ?? null
        },
        authority: {
          index: 3,
          isWritable: false,
          value: input.authority ?? null
        },
        buffer: {
          index: 4,
          isWritable: false,
          value: input.buffer ?? null
        },
        systemProgram: {
          index: 5,
          isWritable: false,
          value: input.systemProgram ?? null
        },
        logWrapper: {
          index: 6,
          isWritable: false,
          value: input.logWrapper ?? null
        }
      };
      const resolvedArgs = {
        ...input
      };
      if (!resolvedAccounts.payer.value) {
        resolvedAccounts.payer.value = context.payer;
      }
      if (!resolvedAccounts.systemProgram.value) {
        resolvedAccounts.systemProgram.value = context.programs.getPublicKey("splSystem", "11111111111111111111111111111111");
        resolvedAccounts.systemProgram.isWritable = false;
      }
      const orderedAccounts = Object.values(resolvedAccounts).sort((a, b) => a.index - b.index);
      const [keys, signers] = (0, shared_1.getAccountMetasAndSigners)(orderedAccounts, "programId", programId);
      const data = getWriteExternalPluginAdapterDataV1InstructionDataSerializer().serialize(resolvedArgs);
      const bytesCreatedOnChain = 0;
      return (0, umi_1.transactionBuilder)([
        { instruction: { keys, programId, data }, signers, bytesCreatedOnChain }
      ]);
    }
    exports2.writeExternalPluginAdapterDataV1 = writeExternalPluginAdapterDataV1;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/index.js
var require_instructions = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/instructions/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_addCollectionExternalPluginAdapterV1(), exports2);
    __exportStar(require_addCollectionPluginV1(), exports2);
    __exportStar(require_addExternalPluginAdapterV1(), exports2);
    __exportStar(require_addPluginV1(), exports2);
    __exportStar(require_approveCollectionPluginAuthorityV1(), exports2);
    __exportStar(require_approvePluginAuthorityV1(), exports2);
    __exportStar(require_burnCollectionV1(), exports2);
    __exportStar(require_burnV1(), exports2);
    __exportStar(require_collect(), exports2);
    __exportStar(require_compressV1(), exports2);
    __exportStar(require_createCollectionV1(), exports2);
    __exportStar(require_createCollectionV2(), exports2);
    __exportStar(require_createV1(), exports2);
    __exportStar(require_createV2(), exports2);
    __exportStar(require_decompressV1(), exports2);
    __exportStar(require_executeV1(), exports2);
    __exportStar(require_removeCollectionExternalPluginAdapterV1(), exports2);
    __exportStar(require_removeCollectionPluginV1(), exports2);
    __exportStar(require_removeExternalPluginAdapterV1(), exports2);
    __exportStar(require_removePluginV1(), exports2);
    __exportStar(require_revokeCollectionPluginAuthorityV1(), exports2);
    __exportStar(require_revokePluginAuthorityV1(), exports2);
    __exportStar(require_transferV1(), exports2);
    __exportStar(require_updateCollectionExternalPluginAdapterV1(), exports2);
    __exportStar(require_updateCollectionInfoV1(), exports2);
    __exportStar(require_updateCollectionPluginV1(), exports2);
    __exportStar(require_updateCollectionV1(), exports2);
    __exportStar(require_updateExternalPluginAdapterV1(), exports2);
    __exportStar(require_updatePluginV1(), exports2);
    __exportStar(require_updateV1(), exports2);
    __exportStar(require_updateV2(), exports2);
    __exportStar(require_writeCollectionExternalPluginAdapterDataV1(), exports2);
    __exportStar(require_writeExternalPluginAdapterDataV1(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/programs/mplCore.js
var require_mplCore2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/programs/mplCore.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getMplCoreProgramId = exports2.getMplCoreProgram = exports2.createMplCoreProgram = exports2.MPL_CORE_PROGRAM_ID = void 0;
    var errors_1 = require_errors6();
    exports2.MPL_CORE_PROGRAM_ID = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
    function createMplCoreProgram() {
      return {
        name: "mplCore",
        publicKey: exports2.MPL_CORE_PROGRAM_ID,
        getErrorFromCode(code, cause) {
          return (0, errors_1.getMplCoreErrorFromCode)(code, this, cause);
        },
        getErrorFromName(name, cause) {
          return (0, errors_1.getMplCoreErrorFromName)(name, this, cause);
        },
        isOnCluster() {
          return true;
        }
      };
    }
    exports2.createMplCoreProgram = createMplCoreProgram;
    function getMplCoreProgram(context, clusterFilter) {
      return context.programs.get("mplCore", clusterFilter);
    }
    exports2.getMplCoreProgram = getMplCoreProgram;
    function getMplCoreProgramId(context, clusterFilter) {
      return context.programs.getPublicKey("mplCore", exports2.MPL_CORE_PROGRAM_ID, clusterFilter);
    }
    exports2.getMplCoreProgramId = getMplCoreProgramId;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/programs/index.js
var require_programs = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/programs/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_mplCore2(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/index.js
var require_generated = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/generated/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_accounts(), exports2);
    __exportStar(require_errors6(), exports2);
    __exportStar(require_instructions(), exports2);
    __exportStar(require_programs(), exports2);
    __exportStar(require_shared(), exports2);
    __exportStar(require_types(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/plugin.js
var require_plugin2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/plugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mplCore = void 0;
    var generated_1 = require_generated();
    var mplCore = () => ({
      install(umi) {
        umi.programs.add((0, generated_1.createMplCoreProgram)(), false);
      }
    });
    exports2.mplCore = mplCore;
  }
});

// ../node_modules/@noble/hashes/_u64.js
var require_u642 = __commonJS({
  "../node_modules/@noble/hashes/_u64.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.toBig = exports2.shrSL = exports2.shrSH = exports2.rotrSL = exports2.rotrSH = exports2.rotrBL = exports2.rotrBH = exports2.rotr32L = exports2.rotr32H = exports2.rotlSL = exports2.rotlSH = exports2.rotlBL = exports2.rotlBH = exports2.add5L = exports2.add5H = exports2.add4L = exports2.add4H = exports2.add3L = exports2.add3H = void 0;
    exports2.add = add;
    exports2.fromBig = fromBig;
    exports2.split = split;
    var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    var _32n = /* @__PURE__ */ BigInt(32);
    function fromBig(n, le = false) {
      if (le)
        return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
      return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
    }
    function split(lst, le = false) {
      const len = lst.length;
      let Ah = new Uint32Array(len);
      let Al = new Uint32Array(len);
      for (let i = 0; i < len; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
      }
      return [Ah, Al];
    }
    var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
    exports2.toBig = toBig;
    var shrSH = (h, _l, s) => h >>> s;
    exports2.shrSH = shrSH;
    var shrSL = (h, l, s) => h << 32 - s | l >>> s;
    exports2.shrSL = shrSL;
    var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
    exports2.rotrSH = rotrSH;
    var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
    exports2.rotrSL = rotrSL;
    var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
    exports2.rotrBH = rotrBH;
    var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
    exports2.rotrBL = rotrBL;
    var rotr32H = (_h, l) => l;
    exports2.rotr32H = rotr32H;
    var rotr32L = (h, _l) => h;
    exports2.rotr32L = rotr32L;
    var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    exports2.rotlSH = rotlSH;
    var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    exports2.rotlSL = rotlSL;
    var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    exports2.rotlBH = rotlBH;
    var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
    exports2.rotlBL = rotlBL;
    function add(Ah, Al, Bh, Bl) {
      const l = (Al >>> 0) + (Bl >>> 0);
      return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
    }
    var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    exports2.add3L = add3L;
    var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
    exports2.add3H = add3H;
    var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    exports2.add4L = add4L;
    var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
    exports2.add4H = add4H;
    var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    exports2.add5L = add5L;
    var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
    exports2.add5H = add5H;
    var u642 = {
      fromBig,
      split,
      toBig,
      shrSH,
      shrSL,
      rotrSH,
      rotrSL,
      rotrBH,
      rotrBL,
      rotr32H,
      rotr32L,
      rotlSH,
      rotlSL,
      rotlBH,
      rotlBL,
      add,
      add3L,
      add3H,
      add4L,
      add4H,
      add5H,
      add5L
    };
    exports2.default = u642;
  }
});

// ../node_modules/@noble/hashes/cryptoNode.js
var require_cryptoNode = __commonJS({
  "../node_modules/@noble/hashes/cryptoNode.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.crypto = void 0;
    var nc = require("crypto");
    exports2.crypto = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : nc && typeof nc === "object" && "randomBytes" in nc ? nc : void 0;
  }
});

// ../node_modules/@noble/hashes/utils.js
var require_utils4 = __commonJS({
  "../node_modules/@noble/hashes/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.wrapXOFConstructorWithOpts = exports2.wrapConstructorWithOpts = exports2.wrapConstructor = exports2.Hash = exports2.nextTick = exports2.swap32IfBE = exports2.byteSwapIfBE = exports2.swap8IfBE = exports2.isLE = void 0;
    exports2.isBytes = isBytes;
    exports2.anumber = anumber;
    exports2.abytes = abytes;
    exports2.ahash = ahash;
    exports2.aexists = aexists;
    exports2.aoutput = aoutput;
    exports2.u8 = u83;
    exports2.u32 = u322;
    exports2.clean = clean;
    exports2.createView = createView;
    exports2.rotr = rotr;
    exports2.rotl = rotl;
    exports2.byteSwap = byteSwap;
    exports2.byteSwap32 = byteSwap32;
    exports2.bytesToHex = bytesToHex;
    exports2.hexToBytes = hexToBytes;
    exports2.asyncLoop = asyncLoop;
    exports2.utf8ToBytes = utf8ToBytes;
    exports2.bytesToUtf8 = bytesToUtf8;
    exports2.toBytes = toBytes;
    exports2.kdfInputToBytes = kdfInputToBytes;
    exports2.concatBytes = concatBytes;
    exports2.checkOpts = checkOpts;
    exports2.createHasher = createHasher;
    exports2.createOptHasher = createOptHasher;
    exports2.createXOFer = createXOFer;
    exports2.randomBytes = randomBytes;
    var crypto_1 = require_cryptoNode();
    function isBytes(a) {
      return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
    }
    function anumber(n) {
      if (!Number.isSafeInteger(n) || n < 0)
        throw new Error("positive integer expected, got " + n);
    }
    function abytes(b, ...lengths) {
      if (!isBytes(b))
        throw new Error("Uint8Array expected");
      if (lengths.length > 0 && !lengths.includes(b.length))
        throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
    }
    function ahash(h) {
      if (typeof h !== "function" || typeof h.create !== "function")
        throw new Error("Hash should be wrapped by utils.createHasher");
      anumber(h.outputLen);
      anumber(h.blockLen);
    }
    function aexists(instance, checkFinished = true) {
      if (instance.destroyed)
        throw new Error("Hash instance has been destroyed");
      if (checkFinished && instance.finished)
        throw new Error("Hash#digest() has already been called");
    }
    function aoutput(out, instance) {
      abytes(out);
      const min = instance.outputLen;
      if (out.length < min) {
        throw new Error("digestInto() expects output buffer of length at least " + min);
      }
    }
    function u83(arr) {
      return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    }
    function u322(arr) {
      return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
    }
    function clean(...arrays) {
      for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
      }
    }
    function createView(arr) {
      return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    }
    function rotr(word, shift) {
      return word << 32 - shift | word >>> shift;
    }
    function rotl(word, shift) {
      return word << shift | word >>> 32 - shift >>> 0;
    }
    exports2.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    function byteSwap(word) {
      return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
    }
    exports2.swap8IfBE = exports2.isLE ? (n) => n : (n) => byteSwap(n);
    exports2.byteSwapIfBE = exports2.swap8IfBE;
    function byteSwap32(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap(arr[i]);
      }
      return arr;
    }
    exports2.swap32IfBE = exports2.isLE ? (u) => u : byteSwap32;
    var hasHexBuiltin = /* @__PURE__ */ (() => (
      // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex(bytes) {
      abytes(bytes);
      if (hasHexBuiltin)
        return bytes.toHex();
      let hex = "";
      for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
      }
      return hex;
    }
    var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    function asciiToBase16(ch) {
      if (ch >= asciis._0 && ch <= asciis._9)
        return ch - asciis._0;
      if (ch >= asciis.A && ch <= asciis.F)
        return ch - (asciis.A - 10);
      if (ch >= asciis.a && ch <= asciis.f)
        return ch - (asciis.a - 10);
      return;
    }
    function hexToBytes(hex) {
      if (typeof hex !== "string")
        throw new Error("hex string expected, got " + typeof hex);
      if (hasHexBuiltin)
        return Uint8Array.fromHex(hex);
      const hl = hex.length;
      const al = hl / 2;
      if (hl % 2)
        throw new Error("hex string expected, got unpadded hex of length " + hl);
      const array = new Uint8Array(al);
      for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi));
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
        if (n1 === void 0 || n2 === void 0) {
          const char = hex[hi] + hex[hi + 1];
          throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2;
      }
      return array;
    }
    var nextTick = async () => {
    };
    exports2.nextTick = nextTick;
    async function asyncLoop(iters, tick, cb) {
      let ts = Date.now();
      for (let i = 0; i < iters; i++) {
        cb(i);
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
          continue;
        await (0, exports2.nextTick)();
        ts += diff;
      }
    }
    function utf8ToBytes(str) {
      if (typeof str !== "string")
        throw new Error("string expected");
      return new Uint8Array(new TextEncoder().encode(str));
    }
    function bytesToUtf8(bytes) {
      return new TextDecoder().decode(bytes);
    }
    function toBytes(data) {
      if (typeof data === "string")
        data = utf8ToBytes(data);
      abytes(data);
      return data;
    }
    function kdfInputToBytes(data) {
      if (typeof data === "string")
        data = utf8ToBytes(data);
      abytes(data);
      return data;
    }
    function concatBytes(...arrays) {
      let sum = 0;
      for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        abytes(a);
        sum += a.length;
      }
      const res = new Uint8Array(sum);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
      }
      return res;
    }
    function checkOpts(defaults, opts) {
      if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
        throw new Error("options should be object or undefined");
      const merged = Object.assign(defaults, opts);
      return merged;
    }
    var Hash = class {
    };
    exports2.Hash = Hash;
    function createHasher(hashCons) {
      const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
      const tmp = hashCons();
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = () => hashCons();
      return hashC;
    }
    function createOptHasher(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
    }
    function createXOFer(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
    }
    exports2.wrapConstructor = createHasher;
    exports2.wrapConstructorWithOpts = createOptHasher;
    exports2.wrapXOFConstructorWithOpts = createXOFer;
    function randomBytes(bytesLength = 32) {
      if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") {
        return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
      }
      if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") {
        return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
      }
      throw new Error("crypto.getRandomValues must be defined");
    }
  }
});

// ../node_modules/@noble/hashes/sha3.js
var require_sha3 = __commonJS({
  "../node_modules/@noble/hashes/sha3.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.shake256 = exports2.shake128 = exports2.keccak_512 = exports2.keccak_384 = exports2.keccak_256 = exports2.keccak_224 = exports2.sha3_512 = exports2.sha3_384 = exports2.sha3_256 = exports2.sha3_224 = exports2.Keccak = void 0;
    exports2.keccakP = keccakP;
    var _u64_ts_1 = require_u642();
    var utils_ts_1 = require_utils4();
    var _0n = BigInt(0);
    var _1n = BigInt(1);
    var _2n = BigInt(2);
    var _7n = BigInt(7);
    var _256n = BigInt(256);
    var _0x71n = BigInt(113);
    var SHA3_PI = [];
    var SHA3_ROTL = [];
    var _SHA3_IOTA = [];
    for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      SHA3_PI.push(2 * (5 * y + x));
      SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
      let t = _0n;
      for (let j = 0; j < 7; j++) {
        R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
        if (R & _2n)
          t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
      }
      _SHA3_IOTA.push(t);
    }
    var IOTAS = (0, _u64_ts_1.split)(_SHA3_IOTA, true);
    var SHA3_IOTA_H = IOTAS[0];
    var SHA3_IOTA_L = IOTAS[1];
    var rotlH = (h, l, s) => s > 32 ? (0, _u64_ts_1.rotlBH)(h, l, s) : (0, _u64_ts_1.rotlSH)(h, l, s);
    var rotlL = (h, l, s) => s > 32 ? (0, _u64_ts_1.rotlBL)(h, l, s) : (0, _u64_ts_1.rotlSL)(h, l, s);
    function keccakP(s, rounds = 24) {
      const B = new Uint32Array(5 * 2);
      for (let round = 24 - rounds; round < 24; round++) {
        for (let x = 0; x < 10; x++)
          B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
          const idx1 = (x + 8) % 10;
          const idx0 = (x + 2) % 10;
          const B0 = B[idx0];
          const B1 = B[idx0 + 1];
          const Th = rotlH(B0, B1, 1) ^ B[idx1];
          const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
          for (let y = 0; y < 50; y += 10) {
            s[x + y] ^= Th;
            s[x + y + 1] ^= Tl;
          }
        }
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
          const shift = SHA3_ROTL[t];
          const Th = rotlH(curH, curL, shift);
          const Tl = rotlL(curH, curL, shift);
          const PI = SHA3_PI[t];
          curH = s[PI];
          curL = s[PI + 1];
          s[PI] = Th;
          s[PI + 1] = Tl;
        }
        for (let y = 0; y < 50; y += 10) {
          for (let x = 0; x < 10; x++)
            B[x] = s[y + x];
          for (let x = 0; x < 10; x++)
            s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        }
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
      }
      (0, utils_ts_1.clean)(B);
    }
    var Keccak = class _Keccak extends utils_ts_1.Hash {
      // NOTE: we accept arguments in bytes instead of bits here.
      constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        this.enableXOF = false;
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        (0, utils_ts_1.anumber)(outputLen);
        if (!(0 < blockLen && blockLen < 200))
          throw new Error("only keccak-f1600 function is supported");
        this.state = new Uint8Array(200);
        this.state32 = (0, utils_ts_1.u32)(this.state);
      }
      clone() {
        return this._cloneInto();
      }
      keccak() {
        (0, utils_ts_1.swap32IfBE)(this.state32);
        keccakP(this.state32, this.rounds);
        (0, utils_ts_1.swap32IfBE)(this.state32);
        this.posOut = 0;
        this.pos = 0;
      }
      update(data) {
        (0, utils_ts_1.aexists)(this);
        data = (0, utils_ts_1.toBytes)(data);
        (0, utils_ts_1.abytes)(data);
        const { blockLen, state } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          for (let i = 0; i < take; i++)
            state[this.pos++] ^= data[pos++];
          if (this.pos === blockLen)
            this.keccak();
        }
        return this;
      }
      finish() {
        if (this.finished)
          return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        state[pos] ^= suffix;
        if ((suffix & 128) !== 0 && pos === blockLen - 1)
          this.keccak();
        state[blockLen - 1] ^= 128;
        this.keccak();
      }
      writeInto(out) {
        (0, utils_ts_1.aexists)(this, false);
        (0, utils_ts_1.abytes)(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len; ) {
          if (this.posOut >= blockLen)
            this.keccak();
          const take = Math.min(blockLen - this.posOut, len - pos);
          out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
          this.posOut += take;
          pos += take;
        }
        return out;
      }
      xofInto(out) {
        if (!this.enableXOF)
          throw new Error("XOF is not possible for this instance");
        return this.writeInto(out);
      }
      xof(bytes) {
        (0, utils_ts_1.anumber)(bytes);
        return this.xofInto(new Uint8Array(bytes));
      }
      digestInto(out) {
        (0, utils_ts_1.aoutput)(out, this);
        if (this.finished)
          throw new Error("digest() was already called");
        this.writeInto(out);
        this.destroy();
        return out;
      }
      digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
      }
      destroy() {
        this.destroyed = true;
        (0, utils_ts_1.clean)(this.state);
      }
      _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
      }
    };
    exports2.Keccak = Keccak;
    var gen = (suffix, blockLen, outputLen) => (0, utils_ts_1.createHasher)(() => new Keccak(blockLen, suffix, outputLen));
    exports2.sha3_224 = (() => gen(6, 144, 224 / 8))();
    exports2.sha3_256 = (() => gen(6, 136, 256 / 8))();
    exports2.sha3_384 = (() => gen(6, 104, 384 / 8))();
    exports2.sha3_512 = (() => gen(6, 72, 512 / 8))();
    exports2.keccak_224 = (() => gen(1, 144, 224 / 8))();
    exports2.keccak_256 = (() => gen(1, 136, 256 / 8))();
    exports2.keccak_384 = (() => gen(1, 104, 384 / 8))();
    exports2.keccak_512 = (() => gen(1, 72, 512 / 8))();
    var genShake = (suffix, blockLen, outputLen) => (0, utils_ts_1.createXOFer)((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === void 0 ? outputLen : opts.dkLen, true));
    exports2.shake128 = (() => genShake(31, 168, 128 / 8))();
    exports2.shake256 = (() => genShake(31, 136, 256 / 8))();
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/hash.js
var require_hash = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/hash.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.hash = void 0;
    var serializers_1 = require_serializers();
    var sha3_1 = require_sha3();
    function hash(input) {
      return (0, sha3_1.keccak_256)(Array.isArray(input) ? (0, serializers_1.mergeBytes)(input) : input);
    }
    exports2.hash = hash;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/authority.js
var require_authority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/authority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addressPluginAuthority = exports2.updatePluginAuthority = exports2.ownerPluginAuthority = exports2.nonePluginAuthority = void 0;
    var plugins_1 = require_plugins();
    function nonePluginAuthority() {
      return (0, plugins_1.pluginAuthority)("None");
    }
    exports2.nonePluginAuthority = nonePluginAuthority;
    function ownerPluginAuthority() {
      return (0, plugins_1.pluginAuthority)("Owner");
    }
    exports2.ownerPluginAuthority = ownerPluginAuthority;
    function updatePluginAuthority() {
      return (0, plugins_1.pluginAuthority)("UpdateAuthority");
    }
    exports2.updatePluginAuthority = updatePluginAuthority;
    function addressPluginAuthority(address) {
      return (0, plugins_1.pluginAuthority)("Address", { address });
    }
    exports2.addressPluginAuthority = addressPluginAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/state.js
var require_state = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/state.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isAssetOwner = exports2.isFrozen = exports2.deriveAssetPlugins = exports2.deriveExternalPluginAdapters = exports2.getExternalPluginAdapterKeyAsString = exports2.collectionAddress = void 0;
    var umi_1 = require_cjs7();
    var plugins_1 = require_plugins();
    function collectionAddress(asset) {
      if (asset.updateAuthority.type === "Collection") {
        return asset.updateAuthority.address;
      }
      return void 0;
    }
    exports2.collectionAddress = collectionAddress;
    var externalPluginAdapterKeys = [
      "oracles",
      "appDatas",
      "lifecycleHooks",
      "dataSections",
      "linkedAppDatas"
    ];
    var getExternalPluginAdapterKeyAsString = (plugin) => {
      switch (plugin.type) {
        case "Oracle":
          return `${plugin.type}-${plugin.baseAddress}`;
        case "AppData":
          return `${plugin.type}-${plugin.dataAuthority.type}${plugin.dataAuthority.address ? `-${plugin.dataAuthority.address}` : ""}`;
        case "LifecycleHook":
          return `${plugin.type}-${plugin.hookedProgram}`;
        case "LinkedAppData":
          return `${plugin.type}-${plugin.dataAuthority.type}${plugin.dataAuthority.address ? `-${plugin.dataAuthority.address}` : ""}`;
        case "DataSection":
          return `${plugin.type}-${(0, exports2.getExternalPluginAdapterKeyAsString)(plugin.parentKey)}`;
        default:
          throw new Error("Unknown ExternalPluginAdapter type");
      }
    };
    exports2.getExternalPluginAdapterKeyAsString = getExternalPluginAdapterKeyAsString;
    var deriveExternalPluginAdapters = (asset, collection) => {
      if (!collection) {
        return asset;
      }
      const externalPluginAdapters = {};
      externalPluginAdapterKeys.forEach((key) => {
        const set = /* @__PURE__ */ new Set();
        if (asset[key] || collection[key]) {
          externalPluginAdapters[key] = [];
        }
        asset[key]?.forEach((plugin) => {
          set.add((0, exports2.getExternalPluginAdapterKeyAsString)(plugin));
          externalPluginAdapters[key]?.push(plugin);
        });
        collection[key]?.forEach((plugin) => {
          if (!set.has((0, exports2.getExternalPluginAdapterKeyAsString)(plugin))) {
            externalPluginAdapters[key]?.push(plugin);
          }
        });
      });
      return externalPluginAdapters;
    };
    exports2.deriveExternalPluginAdapters = deriveExternalPluginAdapters;
    function deriveAssetPlugins(asset, collection) {
      if (!collection) {
        return asset;
      }
      const externalPluginAdapters = (0, exports2.deriveExternalPluginAdapters)(asset, collection);
      externalPluginAdapters.dataSections?.forEach((dataSection) => {
        let appData;
        let dataAuth;
        switch (dataSection.parentKey.type) {
          case "LinkedAppData":
            dataAuth = dataSection.parentKey.dataAuthority;
            appData = externalPluginAdapters.linkedAppDatas?.find((plugin) => (0, plugins_1.comparePluginAuthorities)(dataAuth, plugin.dataAuthority));
            if (appData) {
              appData.data = dataSection.data;
            }
            break;
          case "LinkedLifecycleHook":
          default:
            throw new Error("LinkedLifecycleHook currently unsupported");
        }
      });
      const { numMinted, currentSize, masterEdition, ...colRest } = collection;
      return {
        ...colRest,
        ...asset,
        ...externalPluginAdapters
      };
    }
    exports2.deriveAssetPlugins = deriveAssetPlugins;
    function isFrozen(asset, collection) {
      const dAsset = deriveAssetPlugins(asset, collection);
      return dAsset.freezeDelegate?.frozen || dAsset.permanentFreezeDelegate?.frozen || false;
    }
    exports2.isFrozen = isFrozen;
    function isAssetOwner(pubkey, asset) {
      const key = (0, umi_1.publicKey)(pubkey);
      return key === asset.owner;
    }
    exports2.isAssetOwner = isAssetOwner;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/authority.js
var require_authority2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/authority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.hasCollectionUpdateAuthority = exports2.hasAssetUpdateAuthority = exports2.hasPluginUpdateAuthority = exports2.hasPluginOwnerAuthority = exports2.hasPluginAddressAuthority = void 0;
    var umi_1 = require_cjs7();
    var state_1 = require_state();
    function hasPluginAddressAuthority(pubkey, authority) {
      return authority.type === "Address" && authority.address === (0, umi_1.publicKey)(pubkey);
    }
    exports2.hasPluginAddressAuthority = hasPluginAddressAuthority;
    function hasPluginOwnerAuthority(pubkey, authority, asset) {
      return authority.type === "Owner" && (0, state_1.isAssetOwner)(pubkey, asset);
    }
    exports2.hasPluginOwnerAuthority = hasPluginOwnerAuthority;
    function hasPluginUpdateAuthority(pubkey, authority, asset, collection) {
      return authority.type === "UpdateAuthority" && hasAssetUpdateAuthority(pubkey, asset, collection);
    }
    exports2.hasPluginUpdateAuthority = hasPluginUpdateAuthority;
    function hasAssetUpdateAuthority(pubkey, asset, collection) {
      const key = (0, umi_1.publicKey)(pubkey);
      const dAsset = (0, state_1.deriveAssetPlugins)(asset, collection);
      if (dAsset.updateAuthority.type === "Collection" && dAsset.updateAuthority.address !== collection?.publicKey) {
        throw Error("Collection mismatch");
      }
      if (dAsset.updateAuthority.type === "Address" && dAsset.updateAuthority.address === key || dAsset.updateDelegate?.authority.type === "Address" && dAsset.updateDelegate?.authority.address === key || dAsset.updateDelegate?.authority.type === "Owner" && dAsset.owner === key || dAsset.updateAuthority.type === "Collection" && collection?.updateAuthority === key) {
        return true;
      }
      return false;
    }
    exports2.hasAssetUpdateAuthority = hasAssetUpdateAuthority;
    function hasCollectionUpdateAuthority(pubkey, collection) {
      const key = (0, umi_1.publicKey)(pubkey);
      if (collection.updateAuthority === key || collection.updateDelegate?.authority.type === "Address" && collection.updateDelegate?.authority.address === key) {
        return true;
      }
      return false;
    }
    exports2.hasCollectionUpdateAuthority = hasCollectionUpdateAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/plugin.js
var require_plugin3 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/plugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.checkPluginAuthorities = exports2.pluginTypeFromAssetPluginKey = exports2.assetPluginKeyFromType = void 0;
    var umi_1 = require_cjs7();
    var utils_1 = require_utils3();
    var generated_1 = require_generated();
    var state_1 = require_state();
    var authority_1 = require_authority2();
    function assetPluginKeyFromType(pluginType) {
      return (0, utils_1.lowercaseFirstLetter)(generated_1.PluginType[pluginType]);
    }
    exports2.assetPluginKeyFromType = assetPluginKeyFromType;
    function pluginTypeFromAssetPluginKey(key) {
      return generated_1.PluginType[(0, utils_1.capitalizeFirstLetter)(key)];
    }
    exports2.pluginTypeFromAssetPluginKey = pluginTypeFromAssetPluginKey;
    function checkPluginAuthorities({ authority, pluginTypes, asset, collection }) {
      const cAddress = (0, state_1.collectionAddress)(asset);
      if (cAddress && cAddress !== collection?.publicKey) {
        throw new Error("Collection mismatch");
      }
      const dAsset = (0, state_1.deriveAssetPlugins)(asset, collection);
      const auth = (0, umi_1.publicKey)(authority);
      const isUpdateAuth = (0, authority_1.hasAssetUpdateAuthority)(auth, asset, collection);
      const isOwner = (0, state_1.isAssetOwner)(auth, asset);
      return pluginTypes.map((type) => {
        const plugin = dAsset[assetPluginKeyFromType(type)];
        if (plugin) {
          if ((0, authority_1.hasPluginAddressAuthority)(auth, plugin.authority) || plugin.authority.type === "UpdateAuthority" && isUpdateAuth || plugin.authority.type === "Owner" && isOwner) {
            return true;
          }
        }
        return false;
      });
    }
    exports2.checkPluginAuthorities = checkPluginAuthorities;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/lifecycle.js
var require_lifecycle = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/lifecycle.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.validateUpdate = exports2.canUpdate = exports2.validateBurn = exports2.canBurn = exports2.validateTransfer = exports2.canTransfer = exports2.LifecycleValidationError = void 0;
    var generated_1 = require_generated();
    var state_1 = require_state();
    var plugin_1 = require_plugin3();
    var authority_1 = require_authority2();
    var plugins_1 = require_plugins();
    var LifecycleValidationError;
    (function(LifecycleValidationError2) {
      LifecycleValidationError2["OracleValidationFailed"] = "Oracle validation failed.";
      LifecycleValidationError2["NoAuthority"] = "No authority to perform this action.";
      LifecycleValidationError2["AssetFrozen"] = "Asset is frozen.";
    })(LifecycleValidationError = exports2.LifecycleValidationError || (exports2.LifecycleValidationError = {}));
    function canTransfer(authority, asset, collection) {
      const dAsset = (0, state_1.deriveAssetPlugins)(asset, collection);
      const permaTransferDelegate = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.PermanentTransferDelegate],
        asset: dAsset,
        collection
      });
      if (permaTransferDelegate.some((d) => d)) {
        return true;
      }
      if ((0, state_1.isFrozen)(asset, collection)) {
        return false;
      }
      if (dAsset.owner === authority) {
        return true;
      }
      const transferDelegates = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.TransferDelegate],
        asset: dAsset,
        collection
      });
      return transferDelegates.some((d) => d);
    }
    exports2.canTransfer = canTransfer;
    async function validateTransfer(context, { authority, asset, collection, recipient }) {
      const dAsset = (0, state_1.deriveAssetPlugins)(asset, collection);
      const permaTransferDelegate = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.PermanentTransferDelegate],
        asset: dAsset,
        collection
      });
      if (permaTransferDelegate.some((d) => d)) {
        return null;
      }
      if ((0, state_1.isFrozen)(asset, collection)) {
        return LifecycleValidationError.AssetFrozen;
      }
      if (dAsset.oracles?.length) {
        const eligibleOracles = dAsset.oracles.filter((o) => o.lifecycleChecks?.transfer?.includes(plugins_1.CheckResult.CAN_REJECT)).filter((o) => {
          if (!o.baseAddressConfig) {
            return true;
          }
          if (recipient) {
            return true;
          }
          if (!(0, plugins_1.getExtraAccountRequiredInputs)(o.baseAddressConfig).includes("recipient")) {
            return true;
          }
          return false;
        });
        if (eligibleOracles.length) {
          const accountsWithOffset = eligibleOracles.map((o) => {
            const account = (0, plugins_1.findOracleAccount)(context, o, {
              asset: asset.publicKey,
              collection: collection?.publicKey,
              owner: asset.owner,
              recipient
            });
            return {
              pubkey: account,
              offset: o.resultsOffset
            };
          });
          const oracleValidations = (await context.rpc.getAccounts(accountsWithOffset.map((a) => a.pubkey))).map((a, index) => {
            if (a.exists) {
              return (0, plugins_1.deserializeOracleValidation)(a.data, accountsWithOffset[index].offset);
            }
            return null;
          });
          const oraclePass = oracleValidations.every((v) => {
            if (v?.__kind === "Uninitialized") {
              return false;
            }
            return v?.transfer === generated_1.ExternalValidationResult.Pass;
          });
          if (!oraclePass) {
            return LifecycleValidationError.OracleValidationFailed;
          }
        }
      }
      if (dAsset.owner === authority) {
        return null;
      }
      const transferDelegates = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.TransferDelegate],
        asset: dAsset,
        collection
      });
      if (transferDelegates.some((d) => d)) {
        return null;
      }
      return LifecycleValidationError.NoAuthority;
    }
    exports2.validateTransfer = validateTransfer;
    function canBurn(authority, asset, collection) {
      const dAsset = (0, state_1.deriveAssetPlugins)(asset, collection);
      const permaBurnDelegate = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.PermanentBurnDelegate],
        asset: dAsset,
        collection
      });
      if (permaBurnDelegate.some((d) => d)) {
        return true;
      }
      if ((0, state_1.isFrozen)(asset, collection)) {
        return false;
      }
      if (dAsset.owner === authority) {
        return true;
      }
      const burnDelegates = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.BurnDelegate],
        asset,
        collection
      });
      return burnDelegates.some((d) => d);
    }
    exports2.canBurn = canBurn;
    async function validateBurn(context, { authority, asset, collection }) {
      const dAsset = (0, state_1.deriveAssetPlugins)(asset, collection);
      const permaBurnDelegate = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.PermanentBurnDelegate],
        asset: dAsset,
        collection
      });
      if (permaBurnDelegate.some((d) => d)) {
        return null;
      }
      if ((0, state_1.isFrozen)(asset, collection)) {
        return LifecycleValidationError.AssetFrozen;
      }
      if (dAsset.oracles?.length) {
        const eligibleOracles = dAsset.oracles.filter((o) => o.lifecycleChecks?.burn?.includes(plugins_1.CheckResult.CAN_REJECT));
        if (eligibleOracles.length) {
          const accountsWithOffset = eligibleOracles.map((o) => {
            const account = (0, plugins_1.findOracleAccount)(context, o, {
              asset: asset.publicKey,
              collection: collection?.publicKey,
              owner: asset.owner
            });
            return {
              pubkey: account,
              offset: o.resultsOffset
            };
          });
          const oracleValidations = (await context.rpc.getAccounts(accountsWithOffset.map((a) => a.pubkey))).map((a, index) => {
            if (a.exists) {
              return (0, plugins_1.deserializeOracleValidation)(a.data, accountsWithOffset[index].offset);
            }
            return null;
          });
          const oraclePass = oracleValidations.every((v) => {
            if (v?.__kind === "Uninitialized") {
              return false;
            }
            return v?.burn === generated_1.ExternalValidationResult.Pass;
          });
          if (!oraclePass) {
            return LifecycleValidationError.OracleValidationFailed;
          }
        }
      }
      if (dAsset.owner === authority) {
        return null;
      }
      const burnDelegates = (0, plugin_1.checkPluginAuthorities)({
        authority,
        pluginTypes: [generated_1.PluginType.BurnDelegate],
        asset,
        collection
      });
      if (burnDelegates.some((d) => d)) {
        return null;
      }
      return LifecycleValidationError.NoAuthority;
    }
    exports2.validateBurn = validateBurn;
    function canUpdate(authority, asset, collection) {
      return (0, authority_1.hasAssetUpdateAuthority)(authority, asset, collection);
    }
    exports2.canUpdate = canUpdate;
    async function validateUpdate(context, { authority, asset, collection }) {
      if (asset.oracles?.length) {
        const eligibleOracles = asset.oracles.filter((o) => o.lifecycleChecks?.update?.includes(plugins_1.CheckResult.CAN_REJECT));
        if (eligibleOracles.length) {
          const accountsWithOffset = eligibleOracles.map((o) => {
            const account = (0, plugins_1.findOracleAccount)(context, o, {
              asset: asset.publicKey,
              collection: collection?.publicKey,
              owner: asset.owner
            });
            return {
              pubkey: account,
              offset: o.resultsOffset
            };
          });
          const oracleValidations = (await context.rpc.getAccounts(accountsWithOffset.map((a) => a.pubkey))).map((a, index) => {
            if (a.exists) {
              return (0, plugins_1.deserializeOracleValidation)(a.data, accountsWithOffset[index].offset);
            }
            return null;
          });
          const oraclePass = oracleValidations.every((v) => {
            if (v?.__kind === "Uninitialized") {
              return false;
            }
            return v?.update === generated_1.ExternalValidationResult.Pass;
          });
          if (!oraclePass) {
            return LifecycleValidationError.OracleValidationFailed;
          }
        }
      }
      if (!(0, authority_1.hasAssetUpdateAuthority)(authority, asset, collection)) {
        return LifecycleValidationError.NoAuthority;
      }
      return null;
    }
    exports2.validateUpdate = validateUpdate;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/fetch.js
var require_fetch = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/fetch.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fetchCollection = exports2.fetchAllAssets = exports2.fetchAsset = exports2.fetchCollectionsByUpdateAuthority = exports2.fetchAssetsByCollection = exports2.fetchAssetsByOwner = exports2.deriveAssetPluginsWithFetch = void 0;
    var umi_1 = require_cjs7();
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var state_1 = require_state();
    var deriveAssetPluginsWithFetch = async (umi, assets) => {
      const collectionKeys = Array.from(new Set(assets.map((asset) => (0, state_1.collectionAddress)(asset)))).filter((collection) => !!collection);
      const collections = await (0, generated_1.fetchAllCollectionV1)(umi, collectionKeys);
      const collectionMap = collections.reduce((map, collection) => {
        map[collection.publicKey] = collection;
        return map;
      }, {});
      return assets.map((asset) => {
        const collection = (0, state_1.collectionAddress)(asset);
        if (!collection) {
          return asset;
        }
        return (0, state_1.deriveAssetPlugins)(asset, collectionMap[collection]);
      });
    };
    exports2.deriveAssetPluginsWithFetch = deriveAssetPluginsWithFetch;
    var fetchAssetsByOwner = async (umi, owner, options = {}) => {
      const assets = await (0, generated_1.getAssetV1GpaBuilder)(umi).whereField("key", generated_1.Key.AssetV1).whereField("owner", (0, umi_1.publicKey)(owner)).getDeserialized();
      if (options.skipDerivePlugins) {
        return assets;
      }
      return (0, exports2.deriveAssetPluginsWithFetch)(umi, assets);
    };
    exports2.fetchAssetsByOwner = fetchAssetsByOwner;
    var fetchAssetsByCollection = async (umi, collection, options = {}) => {
      const assets = await (0, generated_1.getAssetV1GpaBuilder)(umi).whereField("key", generated_1.Key.AssetV1).whereField("updateAuthority", (0, plugins_1.updateAuthority)("Collection", [(0, umi_1.publicKey)(collection)])).getDeserialized();
      if (options.skipDerivePlugins) {
        return assets;
      }
      return (0, exports2.deriveAssetPluginsWithFetch)(umi, assets);
    };
    exports2.fetchAssetsByCollection = fetchAssetsByCollection;
    var fetchCollectionsByUpdateAuthority = async (umi, authority) => (0, generated_1.getCollectionV1GpaBuilder)(umi).whereField("key", generated_1.Key.CollectionV1).whereField("updateAuthority", (0, umi_1.publicKey)(authority)).getDeserialized();
    exports2.fetchCollectionsByUpdateAuthority = fetchCollectionsByUpdateAuthority;
    var fetchAsset = async (umi, asset, options = {}) => {
      const assetV1 = await (0, generated_1.fetchAssetV1)(umi, (0, umi_1.publicKey)(asset));
      if (options.skipDerivePlugins) {
        return assetV1;
      }
      const collection = (0, state_1.collectionAddress)(assetV1);
      if (!collection) {
        return assetV1;
      }
      return (0, state_1.deriveAssetPlugins)(assetV1, await (0, generated_1.fetchCollectionV1)(umi, collection));
    };
    exports2.fetchAsset = fetchAsset;
    var fetchAllAssets = async (umi, assets, options = {}) => {
      const chunkSize = options.chunkSize ?? 1e3;
      const assetChunks = [];
      for (let i = 0; i < assets.length; i += chunkSize) {
        assetChunks.push(assets.slice(i, i + chunkSize));
      }
      const assetV1s = (await Promise.all(assetChunks.map((chunk) => (0, generated_1.fetchAllAssetV1)(umi, chunk.map((asset) => (0, umi_1.publicKey)(asset)))))).flat();
      if (options.skipDerivePlugins) {
        return assetV1s;
      }
      const collectionKeys = Array.from(new Set(assetV1s.map((asset) => (0, state_1.collectionAddress)(asset)))).filter((collection) => !!collection);
      const collections = await (0, generated_1.fetchAllCollectionV1)(umi, collectionKeys);
      const collectionMap = collections.reduce((map, collection) => {
        map[collection.publicKey] = collection;
        return map;
      }, {});
      return assetV1s.map((assetV1) => {
        const collection = (0, state_1.collectionAddress)(assetV1);
        if (!collection) {
          return assetV1;
        }
        return (0, state_1.deriveAssetPlugins)(assetV1, collectionMap[collection]);
      });
    };
    exports2.fetchAllAssets = fetchAllAssets;
    var fetchCollection = async (umi, collection, options) => (0, generated_1.fetchCollectionV1)(umi, (0, umi_1.publicKey)(collection), options);
    exports2.fetchCollection = fetchCollection;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/index.js
var require_helpers = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/helpers/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_state(), exports2);
    __exportStar(require_lifecycle(), exports2);
    __exportStar(require_plugin3(), exports2);
    __exportStar(require_authority2(), exports2);
    __exportStar(require_fetch(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/errors.js
var require_errors7 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/errors.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ERR_CANNOT_REVOKE = exports2.ERR_CANNOT_DELEGATE = void 0;
    exports2.ERR_CANNOT_DELEGATE = "Cannot delegate. The target delegate is already either a plugin authority or the asset owner";
    exports2.ERR_CANNOT_REVOKE = "Cannot revoke. Either no plugins defined or the plugin authority is already the asset owner";
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/approvePluginAuthority.js
var require_approvePluginAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/approvePluginAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.approvePluginAuthority = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var approvePluginAuthority = (context, { plugin, newAuthority, ...args }) => (0, generated_1.approvePluginAuthorityV1)(context, {
      ...args,
      pluginType: generated_1.PluginType[plugin.type],
      newAuthority: (0, plugins_1.pluginAuthorityToBase)(newAuthority)
    });
    exports2.approvePluginAuthority = approvePluginAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/legacyDelegate.js
var require_legacyDelegate = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/legacyDelegate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.legacyDelegate = void 0;
    var umi_1 = require_cjs7();
    var errors_1 = require_errors7();
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var authority_1 = require_authority();
    var approvePluginAuthority_1 = require_approvePluginAuthority();
    function legacyDelegate(context, asset, targetDelegate) {
      const definedPlugins = (({ freezeDelegate, transferDelegate, burnDelegate }) => ({
        ...freezeDelegate ? { freezeDelegate } : {},
        ...transferDelegate ? { transferDelegate } : {},
        ...burnDelegate ? { burnDelegate } : {}
      }))(asset);
      const canDelegate = Object.values(definedPlugins).every((pluginValue) => {
        const assetOwner = asset.owner;
        const pluginAuthority = pluginValue.authority;
        const pluginAuthorityAddress = pluginAuthority.address;
        if (pluginAuthority.type === "Owner")
          return targetDelegate !== assetOwner;
        return pluginAuthorityAddress !== targetDelegate && pluginAuthorityAddress !== assetOwner;
      });
      if (!canDelegate) {
        throw new Error(errors_1.ERR_CANNOT_DELEGATE);
      }
      let txBuilder = (0, umi_1.transactionBuilder)();
      const definedPluginsKeys = Object.keys(definedPlugins);
      definedPluginsKeys.forEach((pluginKey) => {
        const plugType = (0, plugins_1.pluginKeyToPluginType)(pluginKey);
        txBuilder = txBuilder.add((0, approvePluginAuthority_1.approvePluginAuthority)(context, {
          asset: asset.publicKey,
          plugin: { type: plugType },
          newAuthority: {
            type: "Address",
            address: targetDelegate
          }
        }));
      });
      const requiredPlugins = [
        "freezeDelegate",
        "transferDelegate",
        "burnDelegate"
      ];
      const missingPlugins = requiredPlugins.filter((requiredPlugin) => !definedPluginsKeys.includes(requiredPlugin));
      missingPlugins.forEach((missingPlugin) => {
        const plugin = (() => {
          if (missingPlugin === "freezeDelegate") {
            return (0, plugins_1.createPlugin)({
              type: "FreezeDelegate",
              data: { frozen: false }
            });
          }
          if (missingPlugin === "transferDelegate") {
            return (0, plugins_1.createPlugin)({ type: "TransferDelegate" });
          }
          return (0, plugins_1.createPlugin)({ type: "BurnDelegate" });
        })();
        txBuilder = txBuilder.add((0, generated_1.addPluginV1)(context, {
          asset: asset.publicKey,
          plugin,
          initAuthority: (0, authority_1.addressPluginAuthority)(targetDelegate)
        }));
      });
      return txBuilder;
    }
    exports2.legacyDelegate = legacyDelegate;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/legacyRevoke.js
var require_legacyRevoke = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/legacyRevoke.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.legacyRevoke = void 0;
    var umi_1 = require_cjs7();
    var generated_1 = require_generated();
    var errors_1 = require_errors7();
    var plugins_1 = require_plugins();
    function legacyRevoke(context, asset) {
      const definedPlugins = (({ freezeDelegate, transferDelegate, burnDelegate }) => ({
        ...freezeDelegate ? { freezeDelegate } : {},
        ...transferDelegate ? { transferDelegate } : {},
        ...burnDelegate ? { burnDelegate } : {}
      }))(asset);
      const definedPluginsValues = Object.values(definedPlugins);
      const canRevoke = definedPluginsValues.length > 0 && definedPluginsValues.every((pluginValue) => {
        const assetOwner = asset.owner;
        const pluginAuthority = pluginValue.authority;
        return pluginAuthority.type !== "Owner" && pluginAuthority.address !== assetOwner;
      });
      if (!canRevoke) {
        throw new Error(errors_1.ERR_CANNOT_REVOKE);
      }
      let txBuilder = (0, umi_1.transactionBuilder)();
      Object.keys(definedPlugins).forEach((pluginKey) => {
        const plugType = (0, plugins_1.pluginKeyToPluginType)(pluginKey);
        txBuilder = txBuilder.add((0, generated_1.revokePluginAuthorityV1)(context, {
          asset: asset.publicKey,
          pluginType: generated_1.PluginType[plugType]
        }));
      });
      return txBuilder;
    }
    exports2.legacyRevoke = legacyRevoke;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/freeze.js
var require_freeze = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/freeze.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.thawAsset = exports2.freezeAsset = void 0;
    var umi_1 = require_cjs7();
    var generated_1 = require_generated();
    var helpers_1 = require_helpers();
    var plugins_1 = require_plugins();
    var authority_1 = require_authority();
    function freezeAsset(context, { asset, authority, collection, delegate }) {
      if ((0, helpers_1.isFrozen)(asset, collection)) {
        throw new Error("Cannot freeze: asset is already frozen");
      }
      if (asset.freezeDelegate && asset.freezeDelegate.authority.type === "None") {
        throw new Error("Cannot freeze: owner has made the freeze immutable until transfer");
      }
      let txBuilder = (0, umi_1.transactionBuilder)();
      if (asset.freezeDelegate) {
        if (asset.freezeDelegate.authority.type !== "Owner") {
          txBuilder = txBuilder.add((0, generated_1.revokePluginAuthorityV1)(context, {
            asset: asset.publicKey,
            collection: collection?.publicKey,
            pluginType: generated_1.PluginType.FreezeDelegate,
            authority
          }));
        }
        txBuilder = txBuilder.add((0, generated_1.removePluginV1)(context, {
          asset: asset.publicKey,
          collection: collection?.publicKey,
          pluginType: generated_1.PluginType.FreezeDelegate,
          authority
        }));
      }
      txBuilder = txBuilder.add((0, generated_1.addPluginV1)(context, {
        asset: asset.publicKey,
        collection: collection?.publicKey,
        plugin: (0, plugins_1.createPlugin)({
          type: "FreezeDelegate",
          data: { frozen: true }
        }),
        initAuthority: (0, authority_1.addressPluginAuthority)((0, umi_1.publicKey)(delegate)),
        authority
      }));
      return txBuilder;
    }
    exports2.freezeAsset = freezeAsset;
    function thawAsset(context, { asset, delegate, collection }) {
      if (!(0, helpers_1.isFrozen)(asset, collection)) {
        throw new Error("Cannot thaw: asset is not frozen");
      }
      return (0, umi_1.transactionBuilder)().add((0, generated_1.updatePluginV1)(context, {
        asset: asset.publicKey,
        collection: collection?.publicKey,
        plugin: (0, plugins_1.createPlugin)({
          type: "FreezeDelegate",
          data: { frozen: false }
        }),
        authority: delegate
      })).add((0, generated_1.revokePluginAuthorityV1)(context, {
        asset: asset.publicKey,
        collection: collection?.publicKey,
        pluginType: generated_1.PluginType.FreezeDelegate,
        authority: delegate
      }));
    }
    exports2.thawAsset = thawAsset;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/create.js
var require_create = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/create.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.create = void 0;
    var umi_1 = require_cjs7();
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var helpers_1 = require_helpers();
    var externalPluginAdapters_1 = require_externalPluginAdapters();
    var create = (context, { asset, plugins, collection, ...args }) => {
      const owner = args.owner || args.updateAuthority || args.payer;
      const assetExternalPluginAdapters = {
        oracles: [],
        lifecycleHooks: []
      };
      const externalPluginAdapters = [];
      const firstPartyPlugins = [];
      plugins?.forEach((plugin) => {
        if ((0, externalPluginAdapters_1.isExternalPluginAdapterType)(plugin)) {
          externalPluginAdapters.push(plugin);
          switch (plugin.type) {
            case "Oracle":
              assetExternalPluginAdapters.oracles?.push({
                ...plugin,
                resultsOffset: plugin.resultsOffset || { type: "NoOffset" },
                baseAddress: plugin.baseAddress,
                authority: plugin.initPluginAuthority || {
                  type: "UpdateAuthority"
                },
                type: "Oracle"
              });
              break;
            case "AppData":
              break;
            case "LifecycleHook":
              assetExternalPluginAdapters.lifecycleHooks?.push({
                ...plugin,
                hookedProgram: plugin.hookedProgram,
                authority: plugin.initPluginAuthority || {
                  type: "UpdateAuthority"
                },
                type: "LifecycleHook",
                schema: plugin.schema || generated_1.ExternalPluginAdapterSchema.Binary
              });
              break;
            default:
          }
        } else {
          firstPartyPlugins.push(plugin);
        }
      });
      const derivedExternalPluginAdapters = (0, helpers_1.deriveExternalPluginAdapters)(assetExternalPluginAdapters, collection);
      const extraAccounts = (0, plugins_1.findExtraAccounts)(context, "create", derivedExternalPluginAdapters, {
        asset: asset.publicKey,
        collection: collection ? collection.publicKey : void 0,
        // need to replicate program behavior
        owner: owner ? (0, umi_1.publicKey)(owner) : context.identity.publicKey
      });
      return (0, generated_1.createV2)(context, {
        ...args,
        plugins: firstPartyPlugins.map(plugins_1.pluginAuthorityPairV2),
        externalPluginAdapters: externalPluginAdapters.map(plugins_1.createExternalPluginAdapterInitInfo),
        asset,
        collection: collection ? collection.publicKey : void 0
      }).addRemainingAccounts(extraAccounts);
    };
    exports2.create = create;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/update.js
var require_update = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/update.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.update = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var helpers_1 = require_helpers();
    var update = (context, { asset, collection, name, uri, ...args }) => {
      const derivedExternalPluginAdapters = (0, helpers_1.deriveExternalPluginAdapters)(asset, collection);
      const extraAccounts = (0, plugins_1.findExtraAccounts)(context, "update", derivedExternalPluginAdapters, {
        asset: asset.publicKey,
        collection: collection?.publicKey,
        owner: asset.owner
      });
      return (0, generated_1.updateV2)(context, {
        ...args,
        asset: asset.publicKey,
        collection: collection?.publicKey,
        newName: name,
        newUri: uri
      }).addRemainingAccounts(extraAccounts);
    };
    exports2.update = update;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/transfer.js
var require_transfer = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/transfer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.transfer = void 0;
    var umi_1 = require_cjs7();
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var helpers_1 = require_helpers();
    var transfer = (context, { asset, collection, ...args }) => {
      const derivedExternalPluginAdapters = (0, helpers_1.deriveExternalPluginAdapters)(asset, collection);
      const extraAccounts = (0, plugins_1.findExtraAccounts)(context, "transfer", derivedExternalPluginAdapters, {
        asset: asset.publicKey,
        collection: collection?.publicKey,
        owner: asset.owner,
        recipient: (0, umi_1.publicKey)(args.newOwner)
      });
      return (0, generated_1.transferV1)(context, {
        ...args,
        asset: asset.publicKey,
        collection: collection?.publicKey
      }).addRemainingAccounts(extraAccounts);
    };
    exports2.transfer = transfer;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/burn.js
var require_burn = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/burn.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.burn = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var helpers_1 = require_helpers();
    var burn = (context, { asset, collection, ...args }) => {
      const derivedExternalPluginAdapters = (0, helpers_1.deriveExternalPluginAdapters)(asset, collection);
      const extraAccounts = (0, plugins_1.findExtraAccounts)(context, "burn", derivedExternalPluginAdapters, {
        asset: asset.publicKey,
        collection: collection?.publicKey,
        owner: asset.owner
      });
      return (0, generated_1.burnV1)(context, {
        ...args,
        asset: asset.publicKey,
        collection: collection?.publicKey
      }).addRemainingAccounts(extraAccounts);
    };
    exports2.burn = burn;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/addPlugin.js
var require_addPlugin = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/addPlugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addPlugin = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var addPlugin = (context, { plugin, ...args }) => {
      if ((0, plugins_1.isExternalPluginAdapterType)(plugin)) {
        return (0, generated_1.addExternalPluginAdapterV1)(context, {
          ...args,
          initInfo: (0, plugins_1.createExternalPluginAdapterInitInfo)(plugin)
        });
      }
      const pair = (0, plugins_1.pluginAuthorityPairV2)(plugin);
      return (0, generated_1.addPluginV1)(context, {
        ...args,
        plugin: pair.plugin,
        initAuthority: pair.authority
      });
    };
    exports2.addPlugin = addPlugin;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/removePlugin.js
var require_removePlugin = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/removePlugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removePlugin = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var externalPluginAdapterKey_1 = require_externalPluginAdapterKey();
    var removePlugin = (context, { plugin, ...args }) => {
      if ((0, plugins_1.isExternalPluginAdapterType)(plugin)) {
        return (0, generated_1.removeExternalPluginAdapterV1)(context, {
          ...args,
          key: (0, externalPluginAdapterKey_1.externalPluginAdapterKeyToBase)(plugin)
        });
      }
      return (0, generated_1.removePluginV1)(context, {
        ...args,
        pluginType: generated_1.PluginType[plugin.type]
      });
    };
    exports2.removePlugin = removePlugin;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/updatePlugin.js
var require_updatePlugin = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/updatePlugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updatePlugin = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var updatePlugin = (context, { plugin, ...args }) => {
      if ((0, plugins_1.isExternalPluginAdapterType)(plugin)) {
        const plug = plugin;
        return (0, generated_1.updateExternalPluginAdapterV1)(context, {
          ...args,
          updateInfo: (0, plugins_1.createExternalPluginAdapterUpdateInfo)(plug),
          key: (0, plugins_1.externalPluginAdapterKeyToBase)(plug.key)
        });
      }
      return (0, generated_1.updatePluginV1)(context, {
        ...args,
        plugin: (0, plugins_1.createPluginV2)(plugin)
      });
    };
    exports2.updatePlugin = updatePlugin;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/revokePluginAuthority.js
var require_revokePluginAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/revokePluginAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.revokePluginAuthority = void 0;
    var generated_1 = require_generated();
    var revokePluginAuthority = (context, { plugin, ...args }) => (0, generated_1.revokePluginAuthorityV1)(context, {
      ...args,
      pluginType: generated_1.PluginType[plugin.type]
    });
    exports2.revokePluginAuthority = revokePluginAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/addCollectionPlugin.js
var require_addCollectionPlugin = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/addCollectionPlugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addCollectionPlugin = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var externalPluginAdapters_1 = require_externalPluginAdapters();
    var addCollectionPlugin = (context, { plugin, ...args }) => {
      if ((0, externalPluginAdapters_1.isExternalPluginAdapterType)(plugin)) {
        return (0, generated_1.addCollectionExternalPluginAdapterV1)(context, {
          ...args,
          initInfo: (0, externalPluginAdapters_1.createExternalPluginAdapterInitInfo)(plugin)
        });
      }
      const pair = (0, plugins_1.pluginAuthorityPairV2)(plugin);
      return (0, generated_1.addCollectionPluginV1)(context, {
        ...args,
        plugin: pair.plugin,
        initAuthority: pair.authority
      });
    };
    exports2.addCollectionPlugin = addCollectionPlugin;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/approveCollectionPluginAuthority.js
var require_approveCollectionPluginAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/approveCollectionPluginAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.approveCollectionPluginAuthority = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var approveCollectionPluginAuthority = (context, { plugin, newAuthority, ...args }) => (0, generated_1.approveCollectionPluginAuthorityV1)(context, {
      ...args,
      pluginType: generated_1.PluginType[plugin.type],
      newAuthority: (0, plugins_1.pluginAuthorityToBase)(newAuthority)
    });
    exports2.approveCollectionPluginAuthority = approveCollectionPluginAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/burnCollection.js
var require_burnCollection = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/burnCollection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.burnCollection = void 0;
    var generated_1 = require_generated();
    Object.defineProperty(exports2, "burnCollection", { enumerable: true, get: function() {
      return generated_1.burnCollectionV1;
    } });
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/createCollection.js
var require_createCollection = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/createCollection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createCollection = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var externalPluginAdapters_1 = require_externalPluginAdapters();
    var createCollection = (context, { plugins, ...args }) => {
      const firstPartyPlugins = [];
      const externalPluginAdapters = [];
      plugins?.forEach((plugin) => {
        if ((0, externalPluginAdapters_1.isExternalPluginAdapterType)(plugin)) {
          externalPluginAdapters.push(plugin);
        } else {
          firstPartyPlugins.push(plugin);
        }
      });
      return (0, generated_1.createCollectionV2)(context, {
        ...args,
        plugins: firstPartyPlugins.map(plugins_1.pluginAuthorityPairV2),
        externalPluginAdapters: externalPluginAdapters.map(plugins_1.createExternalPluginAdapterInitInfo)
      });
    };
    exports2.createCollection = createCollection;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/removeCollectionPlugin.js
var require_removeCollectionPlugin = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/removeCollectionPlugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.removeCollectionPlugin = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var externalPluginAdapters_1 = require_externalPluginAdapters();
    var removeCollectionPlugin = (context, { plugin, ...args }) => {
      if ((0, externalPluginAdapters_1.isExternalPluginAdapterType)(plugin)) {
        return (0, generated_1.removeCollectionExternalPluginAdapterV1)(context, {
          ...args,
          key: (0, plugins_1.externalPluginAdapterKeyToBase)(plugin)
        });
      }
      return (0, generated_1.removeCollectionPluginV1)(context, {
        ...args,
        pluginType: generated_1.PluginType[plugin.type]
      });
    };
    exports2.removeCollectionPlugin = removeCollectionPlugin;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/revokeCollectionPluginAuthority.js
var require_revokeCollectionPluginAuthority = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/revokeCollectionPluginAuthority.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.revokeCollectionPluginAuthority = void 0;
    var generated_1 = require_generated();
    var revokeCollectionPluginAuthority = (context, { plugin, ...args }) => (0, generated_1.revokeCollectionPluginAuthorityV1)(context, {
      ...args,
      pluginType: generated_1.PluginType[plugin.type]
    });
    exports2.revokeCollectionPluginAuthority = revokeCollectionPluginAuthority;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/updateCollection.js
var require_updateCollection = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/updateCollection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateCollection = void 0;
    var generated_1 = require_generated();
    var updateCollection = (context, { name, uri, ...args }) => (0, generated_1.updateCollectionV1)(context, {
      ...args,
      newName: name,
      newUri: uri
    });
    exports2.updateCollection = updateCollection;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/updateCollectionPlugin.js
var require_updateCollectionPlugin = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/updateCollectionPlugin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.updateCollectionPlugin = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var updateCollectionPlugin = (context, { plugin, ...args }) => {
      if ((0, plugins_1.isExternalPluginAdapterType)(plugin)) {
        const plug = plugin;
        return (0, generated_1.updateCollectionExternalPluginAdapterV1)(context, {
          ...args,
          updateInfo: (0, plugins_1.createExternalPluginAdapterUpdateInfo)(plug),
          key: (0, plugins_1.externalPluginAdapterKeyToBase)(plug.key)
        });
      }
      return (0, generated_1.updateCollectionPluginV1)(context, {
        ...args,
        plugin: (0, plugins_1.createPluginV2)(plugin)
      });
    };
    exports2.updateCollectionPlugin = updateCollectionPlugin;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/index.js
var require_collection = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/collection/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_addCollectionPlugin(), exports2);
    __exportStar(require_approveCollectionPluginAuthority(), exports2);
    __exportStar(require_burnCollection(), exports2);
    __exportStar(require_createCollection(), exports2);
    __exportStar(require_removeCollectionPlugin(), exports2);
    __exportStar(require_revokeCollectionPluginAuthority(), exports2);
    __exportStar(require_updateCollection(), exports2);
    __exportStar(require_updateCollectionPlugin(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/writeData.js
var require_writeData = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/writeData.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.writeData = void 0;
    var generated_1 = require_generated();
    var plugins_1 = require_plugins();
    var writeData = (context, args) => {
      const { key, ...rest } = args;
      return (0, generated_1.writeExternalPluginAdapterDataV1)(context, {
        ...rest,
        key: (0, plugins_1.externalPluginAdapterKeyToBase)(key)
      });
    };
    exports2.writeData = writeData;
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/execute.js
var require_execute = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/execute.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.execute = void 0;
    var umi_1 = require_cjs7();
    var generated_1 = require_generated();
    var execute = (context, args) => executeCommon(context, args);
    exports2.execute = execute;
    var executeCommon = (context, args) => {
      let executeBuilder = new umi_1.TransactionBuilder();
      const signers = [];
      let builder = new umi_1.TransactionBuilder();
      if (args.instructions instanceof umi_1.TransactionBuilder) {
        builder = args.instructions;
      } else if (args.instructions) {
        args.instructions.forEach((instruction) => {
          const ixSigners = [];
          instruction.keys.forEach((key) => {
            const signer = signers.find((signerKey) => signerKey.publicKey === key.pubkey);
            if (signer) {
              ixSigners.push(signer);
            }
          });
          builder = builder.add({
            instruction,
            signers: ixSigners,
            bytesCreatedOnChain: 0
          });
        });
      } else {
        throw new Error("No builder or instructions provided");
      }
      for (const ix of builder.items) {
        const [assetSigner] = (0, generated_1.findAssetSignerPda)(context, {
          asset: args.asset.publicKey
        });
        const baseBuilder = (0, generated_1.executeV1)(context, {
          ...args,
          asset: args.asset.publicKey,
          collection: args.collection?.publicKey,
          assetSigner,
          // Forward the programID of the instruction being executed.
          programId: ix.instruction.programId,
          // Forward the data of the instruction being executed.
          instructionData: ix.instruction.data
        });
        executeBuilder = executeBuilder.add(baseBuilder.addRemainingAccounts(ix.instruction.keys.map((key) => {
          if (key.pubkey === assetSigner) {
            return {
              pubkey: key.pubkey,
              isSigner: false,
              isWritable: key.isWritable
            };
          }
          return key;
        })));
        const executeBuilderItems = executeBuilder.items;
        executeBuilderItems[0].signers.push(
          ...signers.filter((signer) => signer.publicKey !== assetSigner)
        );
        executeBuilder = executeBuilder.setItems(executeBuilderItems);
      }
      return executeBuilder;
    };
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/index.js
var require_instructions2 = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/instructions/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_legacyDelegate(), exports2);
    __exportStar(require_legacyRevoke(), exports2);
    __exportStar(require_freeze(), exports2);
    __exportStar(require_create(), exports2);
    __exportStar(require_update(), exports2);
    __exportStar(require_transfer(), exports2);
    __exportStar(require_burn(), exports2);
    __exportStar(require_addPlugin(), exports2);
    __exportStar(require_removePlugin(), exports2);
    __exportStar(require_updatePlugin(), exports2);
    __exportStar(require_approvePluginAuthority(), exports2);
    __exportStar(require_revokePluginAuthority(), exports2);
    __exportStar(require_collection(), exports2);
    __exportStar(require_writeData(), exports2);
    __exportStar(require_execute(), exports2);
  }
});

// ../node_modules/@metaplex-foundation/mpl-core/dist/src/index.js
var require_src = __commonJS({
  "../node_modules/@metaplex-foundation/mpl-core/dist/src/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_generated(), exports2);
    __exportStar(require_plugin2(), exports2);
    __exportStar(require_hash(), exports2);
    __exportStar(require_authority(), exports2);
    __exportStar(require_plugins(), exports2);
    __exportStar(require_helpers(), exports2);
    __exportStar(require_instructions2(), exports2);
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  MarketStates: () => MarketStates,
  PositionDirection: () => PositionDirection,
  PositionStatus: () => PositionStatus,
  WinningDirection: () => WinningDirection,
  default: () => ShortXClient
});
module.exports = __toCommonJS(index_exports);
var import_anchor3 = require("@coral-xyz/anchor");
var import_fs = __toESM(require("fs"), 1);

// src/trade.ts
var anchor = __toESM(require("@coral-xyz/anchor"), 1);
var import_web38 = require("@solana/web3.js");
var import_bn2 = __toESM(require_bn(), 1);

// src/types/trade.ts
var MarketStates = /* @__PURE__ */ ((MarketStates3) => {
  MarketStates3["ACTIVE"] = "active";
  MarketStates3["ENDED"] = "ended";
  MarketStates3["RESOLVING"] = "resolving";
  MarketStates3["RESOLVED"] = "resolved";
  return MarketStates3;
})(MarketStates || {});
var WinningDirection = /* @__PURE__ */ ((WinningDirection2) => {
  WinningDirection2["NONE"] = "None";
  WinningDirection2["YES"] = "Yes";
  WinningDirection2["NO"] = "No";
  WinningDirection2["DRAW"] = "Draw";
  return WinningDirection2;
})(WinningDirection || {});

// ../node_modules/@solana/spl-token/lib/esm/constants.js
var import_web3 = require("@solana/web3.js");
var TOKEN_PROGRAM_ID = new import_web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
var TOKEN_2022_PROGRAM_ID = new import_web3.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
var ASSOCIATED_TOKEN_PROGRAM_ID = new import_web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
var NATIVE_MINT = new import_web3.PublicKey("So11111111111111111111111111111111111111112");
var NATIVE_MINT_2022 = new import_web3.PublicKey("9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP");

// ../node_modules/@solana/buffer-layout-utils/lib/esm/base.mjs
var encodeDecode = (layout) => {
  const decode2 = layout.decode.bind(layout);
  const encode2 = layout.encode.bind(layout);
  return { decode: decode2, encode: encode2 };
};

// ../node_modules/@solana/buffer-layout-utils/lib/esm/bigint.mjs
var import_buffer_layout = __toESM(require_Layout(), 1);
var import_bigint_buffer = __toESM(require_node(), 1);
var bigInt = (length) => (property) => {
  const layout = (0, import_buffer_layout.blob)(length, property);
  const { encode: encode2, decode: decode2 } = encodeDecode(layout);
  const bigIntLayout = layout;
  bigIntLayout.decode = (buffer, offset) => {
    const src = decode2(buffer, offset);
    return (0, import_bigint_buffer.toBigIntLE)(Buffer.from(src));
  };
  bigIntLayout.encode = (bigInt2, buffer, offset) => {
    const src = (0, import_bigint_buffer.toBufferLE)(bigInt2, length);
    return encode2(src, buffer, offset);
  };
  return bigIntLayout;
};
var bigIntBE = (length) => (property) => {
  const layout = (0, import_buffer_layout.blob)(length, property);
  const { encode: encode2, decode: decode2 } = encodeDecode(layout);
  const bigIntLayout = layout;
  bigIntLayout.decode = (buffer, offset) => {
    const src = decode2(buffer, offset);
    return (0, import_bigint_buffer.toBigIntBE)(Buffer.from(src));
  };
  bigIntLayout.encode = (bigInt2, buffer, offset) => {
    const src = (0, import_bigint_buffer.toBufferBE)(bigInt2, length);
    return encode2(src, buffer, offset);
  };
  return bigIntLayout;
};
var u64 = bigInt(8);
var u64be = bigIntBE(8);
var u128 = bigInt(16);
var u128be = bigIntBE(16);
var u192 = bigInt(24);
var u192be = bigIntBE(24);
var u256 = bigInt(32);
var u256be = bigIntBE(32);

// ../node_modules/bignumber.js/bignumber.mjs
var isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
var mathceil = Math.ceil;
var mathfloor = Math.floor;
var bignumberError = "[BigNumber Error] ";
var tooManyDigits = bignumberError + "Number primitive has more than 15 significant digits: ";
var BASE = 1e14;
var LOG_BASE = 14;
var MAX_SAFE_INTEGER = 9007199254740991;
var POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13];
var SQRT_BASE = 1e7;
var MAX = 1e9;
function clone(configObject) {
  var div, convertBase, parseNumeric, P = BigNumber2.prototype = { constructor: BigNumber2, toString: null, valueOf: null }, ONE = new BigNumber2(1), DECIMAL_PLACES = 20, ROUNDING_MODE = 4, TO_EXP_NEG = -7, TO_EXP_POS = 21, MIN_EXP = -1e7, MAX_EXP = 1e7, CRYPTO = false, MODULO_MODE = 1, POW_PRECISION = 0, FORMAT = {
    prefix: "",
    groupSize: 3,
    secondaryGroupSize: 0,
    groupSeparator: ",",
    decimalSeparator: ".",
    fractionGroupSize: 0,
    fractionGroupSeparator: "\xA0",
    // non-breaking space
    suffix: ""
  }, ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz", alphabetHasNormalDecimalDigits = true;
  function BigNumber2(v, b) {
    var alphabet, c, caseChanged, e, i, isNum, len, str, x = this;
    if (!(x instanceof BigNumber2)) return new BigNumber2(v, b);
    if (b == null) {
      if (v && v._isBigNumber === true) {
        x.s = v.s;
        if (!v.c || v.e > MAX_EXP) {
          x.c = x.e = null;
        } else if (v.e < MIN_EXP) {
          x.c = [x.e = 0];
        } else {
          x.e = v.e;
          x.c = v.c.slice();
        }
        return;
      }
      if ((isNum = typeof v == "number") && v * 0 == 0) {
        x.s = 1 / v < 0 ? (v = -v, -1) : 1;
        if (v === ~~v) {
          for (e = 0, i = v; i >= 10; i /= 10, e++) ;
          if (e > MAX_EXP) {
            x.c = x.e = null;
          } else {
            x.e = e;
            x.c = [v];
          }
          return;
        }
        str = String(v);
      } else {
        if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);
        x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
      }
      if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
      if ((i = str.search(/e/i)) > 0) {
        if (e < 0) e = i;
        e += +str.slice(i + 1);
        str = str.substring(0, i);
      } else if (e < 0) {
        e = str.length;
      }
    } else {
      intCheck(b, 2, ALPHABET.length, "Base");
      if (b == 10 && alphabetHasNormalDecimalDigits) {
        x = new BigNumber2(v);
        return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
      }
      str = String(v);
      if (isNum = typeof v == "number") {
        if (v * 0 != 0) return parseNumeric(x, str, isNum, b);
        x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;
        if (BigNumber2.DEBUG && str.replace(/^0\.0*|\./, "").length > 15) {
          throw Error(tooManyDigits + v);
        }
      } else {
        x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
      }
      alphabet = ALPHABET.slice(0, b);
      e = i = 0;
      for (len = str.length; i < len; i++) {
        if (alphabet.indexOf(c = str.charAt(i)) < 0) {
          if (c == ".") {
            if (i > e) {
              e = len;
              continue;
            }
          } else if (!caseChanged) {
            if (str == str.toUpperCase() && (str = str.toLowerCase()) || str == str.toLowerCase() && (str = str.toUpperCase())) {
              caseChanged = true;
              i = -1;
              e = 0;
              continue;
            }
          }
          return parseNumeric(x, String(v), isNum, b);
        }
      }
      isNum = false;
      str = convertBase(str, b, 10, x.s);
      if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
      else e = str.length;
    }
    for (i = 0; str.charCodeAt(i) === 48; i++) ;
    for (len = str.length; str.charCodeAt(--len) === 48; ) ;
    if (str = str.slice(i, ++len)) {
      len -= i;
      if (isNum && BigNumber2.DEBUG && len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
        throw Error(tooManyDigits + x.s * v);
      }
      if ((e = e - i - 1) > MAX_EXP) {
        x.c = x.e = null;
      } else if (e < MIN_EXP) {
        x.c = [x.e = 0];
      } else {
        x.e = e;
        x.c = [];
        i = (e + 1) % LOG_BASE;
        if (e < 0) i += LOG_BASE;
        if (i < len) {
          if (i) x.c.push(+str.slice(0, i));
          for (len -= LOG_BASE; i < len; ) {
            x.c.push(+str.slice(i, i += LOG_BASE));
          }
          i = LOG_BASE - (str = str.slice(i)).length;
        } else {
          i -= len;
        }
        for (; i--; str += "0") ;
        x.c.push(+str);
      }
    } else {
      x.c = [x.e = 0];
    }
  }
  BigNumber2.clone = clone;
  BigNumber2.ROUND_UP = 0;
  BigNumber2.ROUND_DOWN = 1;
  BigNumber2.ROUND_CEIL = 2;
  BigNumber2.ROUND_FLOOR = 3;
  BigNumber2.ROUND_HALF_UP = 4;
  BigNumber2.ROUND_HALF_DOWN = 5;
  BigNumber2.ROUND_HALF_EVEN = 6;
  BigNumber2.ROUND_HALF_CEIL = 7;
  BigNumber2.ROUND_HALF_FLOOR = 8;
  BigNumber2.EUCLID = 9;
  BigNumber2.config = BigNumber2.set = function(obj) {
    var p, v;
    if (obj != null) {
      if (typeof obj == "object") {
        if (obj.hasOwnProperty(p = "DECIMAL_PLACES")) {
          v = obj[p];
          intCheck(v, 0, MAX, p);
          DECIMAL_PLACES = v;
        }
        if (obj.hasOwnProperty(p = "ROUNDING_MODE")) {
          v = obj[p];
          intCheck(v, 0, 8, p);
          ROUNDING_MODE = v;
        }
        if (obj.hasOwnProperty(p = "EXPONENTIAL_AT")) {
          v = obj[p];
          if (v && v.pop) {
            intCheck(v[0], -MAX, 0, p);
            intCheck(v[1], 0, MAX, p);
            TO_EXP_NEG = v[0];
            TO_EXP_POS = v[1];
          } else {
            intCheck(v, -MAX, MAX, p);
            TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
          }
        }
        if (obj.hasOwnProperty(p = "RANGE")) {
          v = obj[p];
          if (v && v.pop) {
            intCheck(v[0], -MAX, -1, p);
            intCheck(v[1], 1, MAX, p);
            MIN_EXP = v[0];
            MAX_EXP = v[1];
          } else {
            intCheck(v, -MAX, MAX, p);
            if (v) {
              MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
            } else {
              throw Error(bignumberError + p + " cannot be zero: " + v);
            }
          }
        }
        if (obj.hasOwnProperty(p = "CRYPTO")) {
          v = obj[p];
          if (v === !!v) {
            if (v) {
              if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
                CRYPTO = v;
              } else {
                CRYPTO = !v;
                throw Error(bignumberError + "crypto unavailable");
              }
            } else {
              CRYPTO = v;
            }
          } else {
            throw Error(bignumberError + p + " not true or false: " + v);
          }
        }
        if (obj.hasOwnProperty(p = "MODULO_MODE")) {
          v = obj[p];
          intCheck(v, 0, 9, p);
          MODULO_MODE = v;
        }
        if (obj.hasOwnProperty(p = "POW_PRECISION")) {
          v = obj[p];
          intCheck(v, 0, MAX, p);
          POW_PRECISION = v;
        }
        if (obj.hasOwnProperty(p = "FORMAT")) {
          v = obj[p];
          if (typeof v == "object") FORMAT = v;
          else throw Error(bignumberError + p + " not an object: " + v);
        }
        if (obj.hasOwnProperty(p = "ALPHABET")) {
          v = obj[p];
          if (typeof v == "string" && !/^.?$|[+\-.\s]|(.).*\1/.test(v)) {
            alphabetHasNormalDecimalDigits = v.slice(0, 10) == "0123456789";
            ALPHABET = v;
          } else {
            throw Error(bignumberError + p + " invalid: " + v);
          }
        }
      } else {
        throw Error(bignumberError + "Object expected: " + obj);
      }
    }
    return {
      DECIMAL_PLACES,
      ROUNDING_MODE,
      EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
      RANGE: [MIN_EXP, MAX_EXP],
      CRYPTO,
      MODULO_MODE,
      POW_PRECISION,
      FORMAT,
      ALPHABET
    };
  };
  BigNumber2.isBigNumber = function(v) {
    if (!v || v._isBigNumber !== true) return false;
    if (!BigNumber2.DEBUG) return true;
    var i, n, c = v.c, e = v.e, s = v.s;
    out: if ({}.toString.call(c) == "[object Array]") {
      if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {
        if (c[0] === 0) {
          if (e === 0 && c.length === 1) return true;
          break out;
        }
        i = (e + 1) % LOG_BASE;
        if (i < 1) i += LOG_BASE;
        if (String(c[0]).length == i) {
          for (i = 0; i < c.length; i++) {
            n = c[i];
            if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
          }
          if (n !== 0) return true;
        }
      }
    } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
      return true;
    }
    throw Error(bignumberError + "Invalid BigNumber: " + v);
  };
  BigNumber2.maximum = BigNumber2.max = function() {
    return maxOrMin(arguments, -1);
  };
  BigNumber2.minimum = BigNumber2.min = function() {
    return maxOrMin(arguments, 1);
  };
  BigNumber2.random = function() {
    var pow2_53 = 9007199254740992;
    var random53bitInt = Math.random() * pow2_53 & 2097151 ? function() {
      return mathfloor(Math.random() * pow2_53);
    } : function() {
      return (Math.random() * 1073741824 | 0) * 8388608 + (Math.random() * 8388608 | 0);
    };
    return function(dp) {
      var a, b, e, k, v, i = 0, c = [], rand = new BigNumber2(ONE);
      if (dp == null) dp = DECIMAL_PLACES;
      else intCheck(dp, 0, MAX);
      k = mathceil(dp / LOG_BASE);
      if (CRYPTO) {
        if (crypto.getRandomValues) {
          a = crypto.getRandomValues(new Uint32Array(k *= 2));
          for (; i < k; ) {
            v = a[i] * 131072 + (a[i + 1] >>> 11);
            if (v >= 9e15) {
              b = crypto.getRandomValues(new Uint32Array(2));
              a[i] = b[0];
              a[i + 1] = b[1];
            } else {
              c.push(v % 1e14);
              i += 2;
            }
          }
          i = k / 2;
        } else if (crypto.randomBytes) {
          a = crypto.randomBytes(k *= 7);
          for (; i < k; ) {
            v = (a[i] & 31) * 281474976710656 + a[i + 1] * 1099511627776 + a[i + 2] * 4294967296 + a[i + 3] * 16777216 + (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];
            if (v >= 9e15) {
              crypto.randomBytes(7).copy(a, i);
            } else {
              c.push(v % 1e14);
              i += 7;
            }
          }
          i = k / 7;
        } else {
          CRYPTO = false;
          throw Error(bignumberError + "crypto unavailable");
        }
      }
      if (!CRYPTO) {
        for (; i < k; ) {
          v = random53bitInt();
          if (v < 9e15) c[i++] = v % 1e14;
        }
      }
      k = c[--i];
      dp %= LOG_BASE;
      if (k && dp) {
        v = POWS_TEN[LOG_BASE - dp];
        c[i] = mathfloor(k / v) * v;
      }
      for (; c[i] === 0; c.pop(), i--) ;
      if (i < 0) {
        c = [e = 0];
      } else {
        for (e = -1; c[0] === 0; c.splice(0, 1), e -= LOG_BASE) ;
        for (i = 1, v = c[0]; v >= 10; v /= 10, i++) ;
        if (i < LOG_BASE) e -= LOG_BASE - i;
      }
      rand.e = e;
      rand.c = c;
      return rand;
    };
  }();
  BigNumber2.sum = function() {
    var i = 1, args = arguments, sum = new BigNumber2(args[0]);
    for (; i < args.length; ) sum = sum.plus(args[i++]);
    return sum;
  };
  convertBase = /* @__PURE__ */ function() {
    var decimal = "0123456789";
    function toBaseOut(str, baseIn, baseOut, alphabet) {
      var j, arr = [0], arrL, i = 0, len = str.length;
      for (; i < len; ) {
        for (arrL = arr.length; arrL--; arr[arrL] *= baseIn) ;
        arr[0] += alphabet.indexOf(str.charAt(i++));
        for (j = 0; j < arr.length; j++) {
          if (arr[j] > baseOut - 1) {
            if (arr[j + 1] == null) arr[j + 1] = 0;
            arr[j + 1] += arr[j] / baseOut | 0;
            arr[j] %= baseOut;
          }
        }
      }
      return arr.reverse();
    }
    return function(str, baseIn, baseOut, sign, callerIsToString) {
      var alphabet, d, e, k, r, x, xc, y, i = str.indexOf("."), dp = DECIMAL_PLACES, rm = ROUNDING_MODE;
      if (i >= 0) {
        k = POW_PRECISION;
        POW_PRECISION = 0;
        str = str.replace(".", "");
        y = new BigNumber2(baseIn);
        x = y.pow(str.length - i);
        POW_PRECISION = k;
        y.c = toBaseOut(
          toFixedPoint(coeffToString(x.c), x.e, "0"),
          10,
          baseOut,
          decimal
        );
        y.e = y.c.length;
      }
      xc = toBaseOut(str, baseIn, baseOut, callerIsToString ? (alphabet = ALPHABET, decimal) : (alphabet = decimal, ALPHABET));
      e = k = xc.length;
      for (; xc[--k] == 0; xc.pop()) ;
      if (!xc[0]) return alphabet.charAt(0);
      if (i < 0) {
        --e;
      } else {
        x.c = xc;
        x.e = e;
        x.s = sign;
        x = div(x, y, dp, rm, baseOut);
        xc = x.c;
        r = x.r;
        e = x.e;
      }
      d = e + dp + 1;
      i = xc[d];
      k = baseOut / 2;
      r = r || d < 0 || xc[d + 1] != null;
      r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : i > k || i == k && (rm == 4 || r || rm == 6 && xc[d - 1] & 1 || rm == (x.s < 0 ? 8 : 7));
      if (d < 1 || !xc[0]) {
        str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
      } else {
        xc.length = d;
        if (r) {
          for (--baseOut; ++xc[--d] > baseOut; ) {
            xc[d] = 0;
            if (!d) {
              ++e;
              xc = [1].concat(xc);
            }
          }
        }
        for (k = xc.length; !xc[--k]; ) ;
        for (i = 0, str = ""; i <= k; str += alphabet.charAt(xc[i++])) ;
        str = toFixedPoint(str, e, alphabet.charAt(0));
      }
      return str;
    };
  }();
  div = /* @__PURE__ */ function() {
    function multiply(x, k, base) {
      var m, temp, xlo, xhi, carry = 0, i = x.length, klo = k % SQRT_BASE, khi = k / SQRT_BASE | 0;
      for (x = x.slice(); i--; ) {
        xlo = x[i] % SQRT_BASE;
        xhi = x[i] / SQRT_BASE | 0;
        m = khi * xlo + xhi * klo;
        temp = klo * xlo + m % SQRT_BASE * SQRT_BASE + carry;
        carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
        x[i] = temp % base;
      }
      if (carry) x = [carry].concat(x);
      return x;
    }
    function compare2(a, b, aL, bL) {
      var i, cmp;
      if (aL != bL) {
        cmp = aL > bL ? 1 : -1;
      } else {
        for (i = cmp = 0; i < aL; i++) {
          if (a[i] != b[i]) {
            cmp = a[i] > b[i] ? 1 : -1;
            break;
          }
        }
      }
      return cmp;
    }
    function subtract(a, b, aL, base) {
      var i = 0;
      for (; aL--; ) {
        a[aL] -= i;
        i = a[aL] < b[aL] ? 1 : 0;
        a[aL] = i * base + a[aL] - b[aL];
      }
      for (; !a[0] && a.length > 1; a.splice(0, 1)) ;
    }
    return function(x, y, dp, rm, base) {
      var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0, yL, yz, s = x.s == y.s ? 1 : -1, xc = x.c, yc = y.c;
      if (!xc || !xc[0] || !yc || !yc[0]) {
        return new BigNumber2(
          // Return NaN if either NaN, or both Infinity or 0.
          !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN : (
            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
          )
        );
      }
      q = new BigNumber2(s);
      qc = q.c = [];
      e = x.e - y.e;
      s = dp + e + 1;
      if (!base) {
        base = BASE;
        e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
        s = s / LOG_BASE | 0;
      }
      for (i = 0; yc[i] == (xc[i] || 0); i++) ;
      if (yc[i] > (xc[i] || 0)) e--;
      if (s < 0) {
        qc.push(1);
        more = true;
      } else {
        xL = xc.length;
        yL = yc.length;
        i = 0;
        s += 2;
        n = mathfloor(base / (yc[0] + 1));
        if (n > 1) {
          yc = multiply(yc, n, base);
          xc = multiply(xc, n, base);
          yL = yc.length;
          xL = xc.length;
        }
        xi = yL;
        rem = xc.slice(0, yL);
        remL = rem.length;
        for (; remL < yL; rem[remL++] = 0) ;
        yz = yc.slice();
        yz = [0].concat(yz);
        yc0 = yc[0];
        if (yc[1] >= base / 2) yc0++;
        do {
          n = 0;
          cmp = compare2(yc, rem, yL, remL);
          if (cmp < 0) {
            rem0 = rem[0];
            if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
            n = mathfloor(rem0 / yc0);
            if (n > 1) {
              if (n >= base) n = base - 1;
              prod = multiply(yc, n, base);
              prodL = prod.length;
              remL = rem.length;
              while (compare2(prod, rem, prodL, remL) == 1) {
                n--;
                subtract(prod, yL < prodL ? yz : yc, prodL, base);
                prodL = prod.length;
                cmp = 1;
              }
            } else {
              if (n == 0) {
                cmp = n = 1;
              }
              prod = yc.slice();
              prodL = prod.length;
            }
            if (prodL < remL) prod = [0].concat(prod);
            subtract(rem, prod, remL, base);
            remL = rem.length;
            if (cmp == -1) {
              while (compare2(yc, rem, yL, remL) < 1) {
                n++;
                subtract(rem, yL < remL ? yz : yc, remL, base);
                remL = rem.length;
              }
            }
          } else if (cmp === 0) {
            n++;
            rem = [0];
          }
          qc[i++] = n;
          if (rem[0]) {
            rem[remL++] = xc[xi] || 0;
          } else {
            rem = [xc[xi]];
            remL = 1;
          }
        } while ((xi++ < xL || rem[0] != null) && s--);
        more = rem[0] != null;
        if (!qc[0]) qc.splice(0, 1);
      }
      if (base == BASE) {
        for (i = 1, s = qc[0]; s >= 10; s /= 10, i++) ;
        round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);
      } else {
        q.e = e;
        q.r = +more;
      }
      return q;
    };
  }();
  function format(n, i, rm, id) {
    var c0, e, ne, len, str;
    if (rm == null) rm = ROUNDING_MODE;
    else intCheck(rm, 0, 8);
    if (!n.c) return n.toString();
    c0 = n.c[0];
    ne = n.e;
    if (i == null) {
      str = coeffToString(n.c);
      str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS) ? toExponential(str, ne) : toFixedPoint(str, ne, "0");
    } else {
      n = round(new BigNumber2(n), i, rm);
      e = n.e;
      str = coeffToString(n.c);
      len = str.length;
      if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {
        for (; len < i; str += "0", len++) ;
        str = toExponential(str, e);
      } else {
        i -= ne;
        str = toFixedPoint(str, e, "0");
        if (e + 1 > len) {
          if (--i > 0) for (str += "."; i--; str += "0") ;
        } else {
          i += e - len;
          if (i > 0) {
            if (e + 1 == len) str += ".";
            for (; i--; str += "0") ;
          }
        }
      }
    }
    return n.s < 0 && c0 ? "-" + str : str;
  }
  function maxOrMin(args, n) {
    var k, y, i = 1, x = new BigNumber2(args[0]);
    for (; i < args.length; i++) {
      y = new BigNumber2(args[i]);
      if (!y.s || (k = compare(x, y)) === n || k === 0 && x.s === n) {
        x = y;
      }
    }
    return x;
  }
  function normalise(n, c, e) {
    var i = 1, j = c.length;
    for (; !c[--j]; c.pop()) ;
    for (j = c[0]; j >= 10; j /= 10, i++) ;
    if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {
      n.c = n.e = null;
    } else if (e < MIN_EXP) {
      n.c = [n.e = 0];
    } else {
      n.e = e;
      n.c = c;
    }
    return n;
  }
  parseNumeric = /* @__PURE__ */ function() {
    var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i, dotAfter = /^([^.]+)\.$/, dotBefore = /^\.([^.]+)$/, isInfinityOrNaN = /^-?(Infinity|NaN)$/, whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;
    return function(x, str, isNum, b) {
      var base, s = isNum ? str : str.replace(whitespaceOrPlus, "");
      if (isInfinityOrNaN.test(s)) {
        x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
      } else {
        if (!isNum) {
          s = s.replace(basePrefix, function(m, p1, p2) {
            base = (p2 = p2.toLowerCase()) == "x" ? 16 : p2 == "b" ? 2 : 8;
            return !b || b == base ? p1 : m;
          });
          if (b) {
            base = b;
            s = s.replace(dotAfter, "$1").replace(dotBefore, "0.$1");
          }
          if (str != s) return new BigNumber2(s, base);
        }
        if (BigNumber2.DEBUG) {
          throw Error(bignumberError + "Not a" + (b ? " base " + b : "") + " number: " + str);
        }
        x.s = null;
      }
      x.c = x.e = null;
    };
  }();
  function round(x, sd, rm, r) {
    var d, i, j, k, n, ni, rd, xc = x.c, pows10 = POWS_TEN;
    if (xc) {
      out: {
        for (d = 1, k = xc[0]; k >= 10; k /= 10, d++) ;
        i = sd - d;
        if (i < 0) {
          i += LOG_BASE;
          j = sd;
          n = xc[ni = 0];
          rd = mathfloor(n / pows10[d - j - 1] % 10);
        } else {
          ni = mathceil((i + 1) / LOG_BASE);
          if (ni >= xc.length) {
            if (r) {
              for (; xc.length <= ni; xc.push(0)) ;
              n = rd = 0;
              d = 1;
              i %= LOG_BASE;
              j = i - LOG_BASE + 1;
            } else {
              break out;
            }
          } else {
            n = k = xc[ni];
            for (d = 1; k >= 10; k /= 10, d++) ;
            i %= LOG_BASE;
            j = i - LOG_BASE + d;
            rd = j < 0 ? 0 : mathfloor(n / pows10[d - j - 1] % 10);
          }
        }
        r = r || sd < 0 || // Are there any non-zero digits after the rounding digit?
        // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
        // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
        xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);
        r = rm < 4 ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
        (i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
        if (sd < 1 || !xc[0]) {
          xc.length = 0;
          if (r) {
            sd -= x.e + 1;
            xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
            x.e = -sd || 0;
          } else {
            xc[0] = x.e = 0;
          }
          return x;
        }
        if (i == 0) {
          xc.length = ni;
          k = 1;
          ni--;
        } else {
          xc.length = ni + 1;
          k = pows10[LOG_BASE - i];
          xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
        }
        if (r) {
          for (; ; ) {
            if (ni == 0) {
              for (i = 1, j = xc[0]; j >= 10; j /= 10, i++) ;
              j = xc[0] += k;
              for (k = 1; j >= 10; j /= 10, k++) ;
              if (i != k) {
                x.e++;
                if (xc[0] == BASE) xc[0] = 1;
              }
              break;
            } else {
              xc[ni] += k;
              if (xc[ni] != BASE) break;
              xc[ni--] = 0;
              k = 1;
            }
          }
        }
        for (i = xc.length; xc[--i] === 0; xc.pop()) ;
      }
      if (x.e > MAX_EXP) {
        x.c = x.e = null;
      } else if (x.e < MIN_EXP) {
        x.c = [x.e = 0];
      }
    }
    return x;
  }
  function valueOf(n) {
    var str, e = n.e;
    if (e === null) return n.toString();
    str = coeffToString(n.c);
    str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(str, e) : toFixedPoint(str, e, "0");
    return n.s < 0 ? "-" + str : str;
  }
  P.absoluteValue = P.abs = function() {
    var x = new BigNumber2(this);
    if (x.s < 0) x.s = 1;
    return x;
  };
  P.comparedTo = function(y, b) {
    return compare(this, new BigNumber2(y, b));
  };
  P.decimalPlaces = P.dp = function(dp, rm) {
    var c, n, v, x = this;
    if (dp != null) {
      intCheck(dp, 0, MAX);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(new BigNumber2(x), dp + x.e + 1, rm);
    }
    if (!(c = x.c)) return null;
    n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;
    if (v = c[v]) for (; v % 10 == 0; v /= 10, n--) ;
    if (n < 0) n = 0;
    return n;
  };
  P.dividedBy = P.div = function(y, b) {
    return div(this, new BigNumber2(y, b), DECIMAL_PLACES, ROUNDING_MODE);
  };
  P.dividedToIntegerBy = P.idiv = function(y, b) {
    return div(this, new BigNumber2(y, b), 0, 1);
  };
  P.exponentiatedBy = P.pow = function(n, m) {
    var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y, x = this;
    n = new BigNumber2(n);
    if (n.c && !n.isInteger()) {
      throw Error(bignumberError + "Exponent not an integer: " + valueOf(n));
    }
    if (m != null) m = new BigNumber2(m);
    nIsBig = n.e > 14;
    if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {
      y = new BigNumber2(Math.pow(+valueOf(x), nIsBig ? n.s * (2 - isOdd(n)) : +valueOf(n)));
      return m ? y.mod(m) : y;
    }
    nIsNeg = n.s < 0;
    if (m) {
      if (m.c ? !m.c[0] : !m.s) return new BigNumber2(NaN);
      isModExp = !nIsNeg && x.isInteger() && m.isInteger();
      if (isModExp) x = x.mod(m);
    } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0 ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7 : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {
      k = x.s < 0 && isOdd(n) ? -0 : 0;
      if (x.e > -1) k = 1 / k;
      return new BigNumber2(nIsNeg ? 1 / k : k);
    } else if (POW_PRECISION) {
      k = mathceil(POW_PRECISION / LOG_BASE + 2);
    }
    if (nIsBig) {
      half = new BigNumber2(0.5);
      if (nIsNeg) n.s = 1;
      nIsOdd = isOdd(n);
    } else {
      i = Math.abs(+valueOf(n));
      nIsOdd = i % 2;
    }
    y = new BigNumber2(ONE);
    for (; ; ) {
      if (nIsOdd) {
        y = y.times(x);
        if (!y.c) break;
        if (k) {
          if (y.c.length > k) y.c.length = k;
        } else if (isModExp) {
          y = y.mod(m);
        }
      }
      if (i) {
        i = mathfloor(i / 2);
        if (i === 0) break;
        nIsOdd = i % 2;
      } else {
        n = n.times(half);
        round(n, n.e + 1, 1);
        if (n.e > 14) {
          nIsOdd = isOdd(n);
        } else {
          i = +valueOf(n);
          if (i === 0) break;
          nIsOdd = i % 2;
        }
      }
      x = x.times(x);
      if (k) {
        if (x.c && x.c.length > k) x.c.length = k;
      } else if (isModExp) {
        x = x.mod(m);
      }
    }
    if (isModExp) return y;
    if (nIsNeg) y = ONE.div(y);
    return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
  };
  P.integerValue = function(rm) {
    var n = new BigNumber2(this);
    if (rm == null) rm = ROUNDING_MODE;
    else intCheck(rm, 0, 8);
    return round(n, n.e + 1, rm);
  };
  P.isEqualTo = P.eq = function(y, b) {
    return compare(this, new BigNumber2(y, b)) === 0;
  };
  P.isFinite = function() {
    return !!this.c;
  };
  P.isGreaterThan = P.gt = function(y, b) {
    return compare(this, new BigNumber2(y, b)) > 0;
  };
  P.isGreaterThanOrEqualTo = P.gte = function(y, b) {
    return (b = compare(this, new BigNumber2(y, b))) === 1 || b === 0;
  };
  P.isInteger = function() {
    return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
  };
  P.isLessThan = P.lt = function(y, b) {
    return compare(this, new BigNumber2(y, b)) < 0;
  };
  P.isLessThanOrEqualTo = P.lte = function(y, b) {
    return (b = compare(this, new BigNumber2(y, b))) === -1 || b === 0;
  };
  P.isNaN = function() {
    return !this.s;
  };
  P.isNegative = function() {
    return this.s < 0;
  };
  P.isPositive = function() {
    return this.s > 0;
  };
  P.isZero = function() {
    return !!this.c && this.c[0] == 0;
  };
  P.minus = function(y, b) {
    var i, j, t, xLTy, x = this, a = x.s;
    y = new BigNumber2(y, b);
    b = y.s;
    if (!a || !b) return new BigNumber2(NaN);
    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }
    var xe = x.e / LOG_BASE, ye = y.e / LOG_BASE, xc = x.c, yc = y.c;
    if (!xe || !ye) {
      if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber2(yc ? x : NaN);
      if (!xc[0] || !yc[0]) {
        return yc[0] ? (y.s = -b, y) : new BigNumber2(xc[0] ? x : (
          // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
          ROUNDING_MODE == 3 ? -0 : 0
        ));
      }
    }
    xe = bitFloor(xe);
    ye = bitFloor(ye);
    xc = xc.slice();
    if (a = xe - ye) {
      if (xLTy = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }
      t.reverse();
      for (b = a; b--; t.push(0)) ;
      t.reverse();
    } else {
      j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;
      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xLTy = xc[b] < yc[b];
          break;
        }
      }
    }
    if (xLTy) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }
    b = (j = yc.length) - (i = xc.length);
    if (b > 0) for (; b--; xc[i++] = 0) ;
    b = BASE - 1;
    for (; j > a; ) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i]; xc[i] = b) ;
        --xc[i];
        xc[j] += BASE;
      }
      xc[j] -= yc[j];
    }
    for (; xc[0] == 0; xc.splice(0, 1), --ye) ;
    if (!xc[0]) {
      y.s = ROUNDING_MODE == 3 ? -1 : 1;
      y.c = [y.e = 0];
      return y;
    }
    return normalise(y, xc, ye);
  };
  P.modulo = P.mod = function(y, b) {
    var q, s, x = this;
    y = new BigNumber2(y, b);
    if (!x.c || !y.s || y.c && !y.c[0]) {
      return new BigNumber2(NaN);
    } else if (!y.c || x.c && !x.c[0]) {
      return new BigNumber2(x);
    }
    if (MODULO_MODE == 9) {
      s = y.s;
      y.s = 1;
      q = div(x, y, 0, 3);
      y.s = s;
      q.s *= s;
    } else {
      q = div(x, y, 0, MODULO_MODE);
    }
    y = x.minus(q.times(y));
    if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;
    return y;
  };
  P.multipliedBy = P.times = function(y, b) {
    var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc, base, sqrtBase, x = this, xc = x.c, yc = (y = new BigNumber2(y, b)).c;
    if (!xc || !yc || !xc[0] || !yc[0]) {
      if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
        y.c = y.e = y.s = null;
      } else {
        y.s *= x.s;
        if (!xc || !yc) {
          y.c = y.e = null;
        } else {
          y.c = [0];
          y.e = 0;
        }
      }
      return y;
    }
    e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
    y.s *= x.s;
    xcL = xc.length;
    ycL = yc.length;
    if (xcL < ycL) {
      zc = xc;
      xc = yc;
      yc = zc;
      i = xcL;
      xcL = ycL;
      ycL = i;
    }
    for (i = xcL + ycL, zc = []; i--; zc.push(0)) ;
    base = BASE;
    sqrtBase = SQRT_BASE;
    for (i = ycL; --i >= 0; ) {
      c = 0;
      ylo = yc[i] % sqrtBase;
      yhi = yc[i] / sqrtBase | 0;
      for (k = xcL, j = i + k; j > i; ) {
        xlo = xc[--k] % sqrtBase;
        xhi = xc[k] / sqrtBase | 0;
        m = yhi * xlo + xhi * ylo;
        xlo = ylo * xlo + m % sqrtBase * sqrtBase + zc[j] + c;
        c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
        zc[j--] = xlo % base;
      }
      zc[j] = c;
    }
    if (c) {
      ++e;
    } else {
      zc.splice(0, 1);
    }
    return normalise(y, zc, e);
  };
  P.negated = function() {
    var x = new BigNumber2(this);
    x.s = -x.s || null;
    return x;
  };
  P.plus = function(y, b) {
    var t, x = this, a = x.s;
    y = new BigNumber2(y, b);
    b = y.s;
    if (!a || !b) return new BigNumber2(NaN);
    if (a != b) {
      y.s = -b;
      return x.minus(y);
    }
    var xe = x.e / LOG_BASE, ye = y.e / LOG_BASE, xc = x.c, yc = y.c;
    if (!xe || !ye) {
      if (!xc || !yc) return new BigNumber2(a / 0);
      if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber2(xc[0] ? x : a * 0);
    }
    xe = bitFloor(xe);
    ye = bitFloor(ye);
    xc = xc.slice();
    if (a = xe - ye) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }
      t.reverse();
      for (; a--; t.push(0)) ;
      t.reverse();
    }
    a = xc.length;
    b = yc.length;
    if (a - b < 0) {
      t = yc;
      yc = xc;
      xc = t;
      b = a;
    }
    for (a = 0; b; ) {
      a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
      xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
    }
    if (a) {
      xc = [a].concat(xc);
      ++ye;
    }
    return normalise(y, xc, ye);
  };
  P.precision = P.sd = function(sd, rm) {
    var c, n, v, x = this;
    if (sd != null && sd !== !!sd) {
      intCheck(sd, 1, MAX);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(new BigNumber2(x), sd, rm);
    }
    if (!(c = x.c)) return null;
    v = c.length - 1;
    n = v * LOG_BASE + 1;
    if (v = c[v]) {
      for (; v % 10 == 0; v /= 10, n--) ;
      for (v = c[0]; v >= 10; v /= 10, n++) ;
    }
    if (sd && x.e + 1 > n) n = x.e + 1;
    return n;
  };
  P.shiftedBy = function(k) {
    intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
    return this.times("1e" + k);
  };
  P.squareRoot = P.sqrt = function() {
    var m, n, r, rep, t, x = this, c = x.c, s = x.s, e = x.e, dp = DECIMAL_PLACES + 4, half = new BigNumber2("0.5");
    if (s !== 1 || !c || !c[0]) {
      return new BigNumber2(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
    }
    s = Math.sqrt(+valueOf(x));
    if (s == 0 || s == 1 / 0) {
      n = coeffToString(c);
      if ((n.length + e) % 2 == 0) n += "0";
      s = Math.sqrt(+n);
      e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);
      if (s == 1 / 0) {
        n = "5e" + e;
      } else {
        n = s.toExponential();
        n = n.slice(0, n.indexOf("e") + 1) + e;
      }
      r = new BigNumber2(n);
    } else {
      r = new BigNumber2(s + "");
    }
    if (r.c[0]) {
      e = r.e;
      s = e + dp;
      if (s < 3) s = 0;
      for (; ; ) {
        t = r;
        r = half.times(t.plus(div(x, t, dp, 1)));
        if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {
          if (r.e < e) --s;
          n = n.slice(s - 3, s + 1);
          if (n == "9999" || !rep && n == "4999") {
            if (!rep) {
              round(t, t.e + DECIMAL_PLACES + 2, 0);
              if (t.times(t).eq(x)) {
                r = t;
                break;
              }
            }
            dp += 4;
            s += 4;
            rep = 1;
          } else {
            if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
              round(r, r.e + DECIMAL_PLACES + 2, 1);
              m = !r.times(r).eq(x);
            }
            break;
          }
        }
      }
    }
    return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
  };
  P.toExponential = function(dp, rm) {
    if (dp != null) {
      intCheck(dp, 0, MAX);
      dp++;
    }
    return format(this, dp, rm, 1);
  };
  P.toFixed = function(dp, rm) {
    if (dp != null) {
      intCheck(dp, 0, MAX);
      dp = dp + this.e + 1;
    }
    return format(this, dp, rm);
  };
  P.toFormat = function(dp, rm, format2) {
    var str, x = this;
    if (format2 == null) {
      if (dp != null && rm && typeof rm == "object") {
        format2 = rm;
        rm = null;
      } else if (dp && typeof dp == "object") {
        format2 = dp;
        dp = rm = null;
      } else {
        format2 = FORMAT;
      }
    } else if (typeof format2 != "object") {
      throw Error(bignumberError + "Argument not an object: " + format2);
    }
    str = x.toFixed(dp, rm);
    if (x.c) {
      var i, arr = str.split("."), g1 = +format2.groupSize, g2 = +format2.secondaryGroupSize, groupSeparator = format2.groupSeparator || "", intPart = arr[0], fractionPart = arr[1], isNeg = x.s < 0, intDigits = isNeg ? intPart.slice(1) : intPart, len = intDigits.length;
      if (g2) {
        i = g1;
        g1 = g2;
        g2 = i;
        len -= i;
      }
      if (g1 > 0 && len > 0) {
        i = len % g1 || g1;
        intPart = intDigits.substr(0, i);
        for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
        if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
        if (isNeg) intPart = "-" + intPart;
      }
      str = fractionPart ? intPart + (format2.decimalSeparator || "") + ((g2 = +format2.fractionGroupSize) ? fractionPart.replace(
        new RegExp("\\d{" + g2 + "}\\B", "g"),
        "$&" + (format2.fractionGroupSeparator || "")
      ) : fractionPart) : intPart;
    }
    return (format2.prefix || "") + str + (format2.suffix || "");
  };
  P.toFraction = function(md) {
    var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s, x = this, xc = x.c;
    if (md != null) {
      n = new BigNumber2(md);
      if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
        throw Error(bignumberError + "Argument " + (n.isInteger() ? "out of range: " : "not an integer: ") + valueOf(n));
      }
    }
    if (!xc) return new BigNumber2(x);
    d = new BigNumber2(ONE);
    n1 = d0 = new BigNumber2(ONE);
    d1 = n0 = new BigNumber2(ONE);
    s = coeffToString(xc);
    e = d.e = s.length - x.e - 1;
    d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
    md = !md || n.comparedTo(d) > 0 ? e > 0 ? d : n1 : n;
    exp = MAX_EXP;
    MAX_EXP = 1 / 0;
    n = new BigNumber2(s);
    n0.c[0] = 0;
    for (; ; ) {
      q = div(n, d, 0, 1);
      d2 = d0.plus(q.times(d1));
      if (d2.comparedTo(md) == 1) break;
      d0 = d1;
      d1 = d2;
      n1 = n0.plus(q.times(d2 = n1));
      n0 = d2;
      d = n.minus(q.times(d2 = d));
      n = d2;
    }
    d2 = div(md.minus(d0), d1, 0, 1);
    n0 = n0.plus(d2.times(n1));
    d0 = d0.plus(d2.times(d1));
    n0.s = n1.s = x.s;
    e = e * 2;
    r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
      div(n0, d0, e, ROUNDING_MODE).minus(x).abs()
    ) < 1 ? [n1, d1] : [n0, d0];
    MAX_EXP = exp;
    return r;
  };
  P.toNumber = function() {
    return +valueOf(this);
  };
  P.toPrecision = function(sd, rm) {
    if (sd != null) intCheck(sd, 1, MAX);
    return format(this, sd, rm, 2);
  };
  P.toString = function(b) {
    var str, n = this, s = n.s, e = n.e;
    if (e === null) {
      if (s) {
        str = "Infinity";
        if (s < 0) str = "-" + str;
      } else {
        str = "NaN";
      }
    } else {
      if (b == null) {
        str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(coeffToString(n.c), e) : toFixedPoint(coeffToString(n.c), e, "0");
      } else if (b === 10 && alphabetHasNormalDecimalDigits) {
        n = round(new BigNumber2(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
        str = toFixedPoint(coeffToString(n.c), n.e, "0");
      } else {
        intCheck(b, 2, ALPHABET.length, "Base");
        str = convertBase(toFixedPoint(coeffToString(n.c), e, "0"), 10, b, s, true);
      }
      if (s < 0 && n.c[0]) str = "-" + str;
    }
    return str;
  };
  P.valueOf = P.toJSON = function() {
    return valueOf(this);
  };
  P._isBigNumber = true;
  P[Symbol.toStringTag] = "BigNumber";
  P[Symbol.for("nodejs.util.inspect.custom")] = P.valueOf;
  if (configObject != null) BigNumber2.set(configObject);
  return BigNumber2;
}
function bitFloor(n) {
  var i = n | 0;
  return n > 0 || n === i ? i : i - 1;
}
function coeffToString(a) {
  var s, z, i = 1, j = a.length, r = a[0] + "";
  for (; i < j; ) {
    s = a[i++] + "";
    z = LOG_BASE - s.length;
    for (; z--; s = "0" + s) ;
    r += s;
  }
  for (j = r.length; r.charCodeAt(--j) === 48; ) ;
  return r.slice(0, j + 1 || 1);
}
function compare(x, y) {
  var a, b, xc = x.c, yc = y.c, i = x.s, j = y.s, k = x.e, l = y.e;
  if (!i || !j) return null;
  a = xc && !xc[0];
  b = yc && !yc[0];
  if (a || b) return a ? b ? 0 : -j : i;
  if (i != j) return i;
  a = i < 0;
  b = k == l;
  if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;
  if (!b) return k > l ^ a ? 1 : -1;
  j = (k = xc.length) < (l = yc.length) ? k : l;
  for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;
  return k == l ? 0 : k > l ^ a ? 1 : -1;
}
function intCheck(n, min, max, name) {
  if (n < min || n > max || n !== mathfloor(n)) {
    throw Error(bignumberError + (name || "Argument") + (typeof n == "number" ? n < min || n > max ? " out of range: " : " not an integer: " : " not a primitive number: ") + String(n));
  }
}
function isOdd(n) {
  var k = n.c.length - 1;
  return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
}
function toExponential(str, e) {
  return (str.length > 1 ? str.charAt(0) + "." + str.slice(1) : str) + (e < 0 ? "e" : "e+") + e;
}
function toFixedPoint(str, e, z) {
  var len, zs;
  if (e < 0) {
    for (zs = z + "."; ++e; zs += z) ;
    str = zs + str;
  } else {
    len = str.length;
    if (++e > len) {
      for (zs = z, e -= len; --e; zs += z) ;
      str += zs;
    } else if (e < len) {
      str = str.slice(0, e) + "." + str.slice(e);
    }
  }
  return str;
}
var BigNumber = clone();
var bignumber_default = BigNumber;

// ../node_modules/@solana/buffer-layout-utils/lib/esm/decimal.mjs
var WAD = new bignumber_default("1e+18");

// ../node_modules/@solana/buffer-layout-utils/lib/esm/native.mjs
var import_buffer_layout2 = __toESM(require_Layout(), 1);
var bool = (property) => {
  const layout = (0, import_buffer_layout2.u8)(property);
  const { encode: encode2, decode: decode2 } = encodeDecode(layout);
  const boolLayout = layout;
  boolLayout.decode = (buffer, offset) => {
    const src = decode2(buffer, offset);
    return !!src;
  };
  boolLayout.encode = (bool2, buffer, offset) => {
    const src = Number(bool2);
    return encode2(src, buffer, offset);
  };
  return boolLayout;
};

// ../node_modules/@solana/buffer-layout-utils/lib/esm/web3.mjs
var import_buffer_layout3 = __toESM(require_Layout(), 1);
var import_web32 = require("@solana/web3.js");
var publicKey = (property) => {
  const layout = (0, import_buffer_layout3.blob)(32, property);
  const { encode: encode2, decode: decode2 } = encodeDecode(layout);
  const publicKeyLayout = layout;
  publicKeyLayout.decode = (buffer, offset) => {
    const src = decode2(buffer, offset);
    return new import_web32.PublicKey(src);
  };
  publicKeyLayout.encode = (publicKey2, buffer, offset) => {
    const src = publicKey2.toBuffer();
    return encode2(src, buffer, offset);
  };
  return publicKeyLayout;
};

// ../node_modules/@solana/spl-token/lib/esm/errors.js
var TokenError = class extends Error {
  constructor(message) {
    super(message);
  }
};
var TokenOwnerOffCurveError = class extends TokenError {
  constructor() {
    super(...arguments);
    this.name = "TokenOwnerOffCurveError";
  }
};

// ../node_modules/@solana/spl-token/lib/esm/state/mint.js
var import_buffer_layout4 = __toESM(require_Layout(), 1);
var import_web33 = require("@solana/web3.js");
var MintLayout = (0, import_buffer_layout4.struct)([
  (0, import_buffer_layout4.u32)("mintAuthorityOption"),
  publicKey("mintAuthority"),
  u64("supply"),
  (0, import_buffer_layout4.u8)("decimals"),
  bool("isInitialized"),
  (0, import_buffer_layout4.u32)("freezeAuthorityOption"),
  publicKey("freezeAuthority")
]);
var MINT_SIZE = MintLayout.span;
function getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve = false, programId = TOKEN_PROGRAM_ID, associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID) {
  if (!allowOwnerOffCurve && !import_web33.PublicKey.isOnCurve(owner.toBuffer()))
    throw new TokenOwnerOffCurveError();
  const [address] = import_web33.PublicKey.findProgramAddressSync([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], associatedTokenProgramId);
  return address;
}

// src/types/position.ts
var PositionDirection = /* @__PURE__ */ ((PositionDirection2) => {
  PositionDirection2["YES"] = "yes";
  PositionDirection2["NO"] = "no";
  return PositionDirection2;
})(PositionDirection || {});
var PositionStatus = /* @__PURE__ */ ((PositionStatus2) => {
  PositionStatus2["INIT"] = "init";
  PositionStatus2["OPEN"] = "open";
  PositionStatus2["CLOSED"] = "closed";
  PositionStatus2["CLAIMED"] = "claimed";
  PositionStatus2["LIQUIDATED"] = "liquidated";
  PositionStatus2["WAITING"] = "waiting";
  return PositionStatus2;
})(PositionStatus || {});

// src/utils/helpers.ts
var encodeString = (value, alloc = 32) => {
  const buffer = Buffer.alloc(alloc, 32);
  buffer.write(value);
  return Array(...buffer);
};
var formatMarket = (account, address) => {
  return {
    bump: account.bump,
    address: address.toString(),
    authority: account.authority.toString(),
    marketId: account.marketId.toString(),
    yesLiquidity: account.yesLiquidity.toString(),
    noLiquidity: account.noLiquidity.toString(),
    volume: account.volume.toString(),
    oraclePubkey: account.oraclePubkey ? account.oraclePubkey.toString() : "",
    nftCollectionMint: account.nftCollection ? account.nftCollection.toString() : "",
    marketUsdcVault: account.marketUsdcVault ? account.marketUsdcVault.toString() : "",
    marketState: getMarketState(account.marketState),
    updateTs: account.updateTs.toString(),
    nextPositionId: account.nextPositionId.toString(),
    marketStart: account.marketStart.toString(),
    marketEnd: account.marketEnd.toString(),
    question: Buffer.from(account.question).toString().replace(/\0+$/, ""),
    winningDirection: getWinningDirection(account.winningDirection)
  };
};
var formatPositionAccount = (account, marketId) => {
  console.log("formatPositionAccount", account);
  return {
    authority: account.authority,
    marketId: marketId ? marketId : account.marketId ? account.marketId.toNumber() : 0,
    positions: account.positions.map(
      (position) => formatPosition(position)
    ),
    nonce: account.nonce,
    isSubPosition: account.isSubPosition
  };
};
var formatPosition = (position) => {
  return {
    ts: position.ts.toString(),
    positionNonce: position.positionNonce.toString(),
    createdAt: position.createdAt ? position.createdAt.toString() : "",
    positionId: position.positionId.toString(),
    marketId: position.marketId.toString(),
    mint: position.mint ? position.mint.toString() : "",
    positionStatus: getPositionStatus(position.positionStatus),
    direction: getPositionDirection(position.direction),
    amount: position.amount.toString()
  };
};
var getMarketState = (status) => {
  const currentStatus = Object.keys(status)[0];
  return currentStatus;
};
var getWinningDirection = (direction) => {
  const key = Object.keys(direction)[0];
  switch (key) {
    case "yes":
      return "Yes" /* YES */;
    case "no":
      return "No" /* NO */;
    case "none":
      return "None" /* NONE */;
    default:
      const upperKey = key.toUpperCase();
      if (upperKey in WinningDirection) {
        return WinningDirection[upperKey];
      }
      throw new Error(`Invalid winning direction variant: ${key}`);
  }
};
var getPositionDirection = (direction) => {
  if (Object.keys(direction)[0] === "yes") {
    return "yes" /* YES */;
  }
  return "no" /* NO */;
};
var getPositionStatus = (status) => {
  let currentStatus = Object.keys(status)[0];
  switch (currentStatus) {
    case "init":
      return "init" /* INIT */;
    case "open":
      return "open" /* OPEN */;
    case "closed":
      return "closed" /* CLOSED */;
    case "claimed":
      return "claimed" /* CLAIMED */;
    case "liquidated":
      return "liquidated" /* LIQUIDATED */;
    case "waiting":
      return "waiting" /* WAITING */;
    default:
      throw new Error("Invalid order status");
  }
};

// src/utils/pda/index.ts
var import_web34 = require("@solana/web3.js");
var import_bn = __toESM(require_bn(), 1);
var getMarketPDA = (programId, marketId) => {
  return import_web34.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), new import_bn.default(marketId).toArrayLike(Buffer, "le", 8)],
    programId
  )[0];
};
var getConfigPDA = (programId) => {
  return import_web34.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  )[0];
};
var getCollectionPDA = (programId, marketId) => {
  return import_web34.PublicKey.findProgramAddressSync(
    [
      Buffer.from("collection"),
      new import_bn.default(marketId).toArrayLike(Buffer, "le", 8)
    ],
    programId
  )[0];
};
var getPositionNftPDA = (programId, marketId, positionId) => {
  return import_web34.PublicKey.findProgramAddressSync(
    [
      Buffer.from("nft"),
      new import_bn.default(marketId).toArrayLike(Buffer, "le", 8),
      positionId.toArrayLike(Buffer, "le", 8)
    ],
    programId
  )[0];
};
var getPositionAccountPDA = (programId, marketId, subPositionKey) => {
  return subPositionKey ? import_web34.PublicKey.findProgramAddressSync(
    [Buffer.from("position"), new import_bn.default(marketId).toArrayLike(Buffer, "le", 8), subPositionKey.toBuffer()],
    programId
  )[0] : import_web34.PublicKey.findProgramAddressSync(
    [Buffer.from("position"), new import_bn.default(marketId).toArrayLike(Buffer, "le", 8)],
    programId
  )[0];
};
var getSubPositionAccountPDA = (programId, marketId, sub_position_key, nonce) => {
  return import_web34.PublicKey.findProgramAddressSync(
    [
      Buffer.from("sub_position_account"),
      new import_bn.default(marketId).toArrayLike(Buffer, "le", 8),
      sub_position_key.toBuffer(),
      new import_bn.default(nonce).toArrayLike(Buffer, "le", 8)
    ],
    programId
  )[0];
};

// src/utils/sendVersionedTransaction.ts
var import_web35 = require("@solana/web3.js");

// src/utils/getPriorityFee.ts
var import_axios = __toESM(require("axios"), 1);
var getPriorityFee = async () => {
  let fee = 1e3;
  try {
    const response = await import_axios.default.get("https://solanacompass.com/api/fees");
    console.log("SDK: fee response", response.data);
    fee = response.data[1].priorityTx;
  } catch (e) {
    fee = 1e3;
  }
  return fee;
};
var getPriorityFee_default = getPriorityFee;

// src/utils/sendVersionedTransaction.ts
var createVersionedTransaction = async (program, ixs, payer, options, addressLookupTableAccounts) => {
  const payerPublicKey = payer;
  if (options?.microLamports) {
    ixs.push(
      import_web35.ComputeBudgetProgram.setComputeUnitLimit({
        units: options.microLamports
      })
    );
  }
  if (!options?.microLamports) {
    const priorityFee = await getPriorityFee_default();
    ixs.push(
      import_web35.ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee
      })
    );
  }
  const { blockhash } = await program.provider.connection.getLatestBlockhash();
  const tx = new import_web35.VersionedTransaction(
    new import_web35.TransactionMessage({
      instructions: ixs,
      recentBlockhash: blockhash,
      payerKey: payerPublicKey
    }).compileToV0Message(addressLookupTableAccounts)
  );
  return tx;
};
var sendVersionedTransaction_default = createVersionedTransaction;

// src/utils/swap.ts
var import_axios2 = __toESM(require("axios"), 1);
var import_web36 = require("@solana/web3.js");
var swap = async ({
  connection,
  wallet,
  inToken,
  amount,
  usdcMint
}) => {
  const token = TOKENS[inToken];
  if (!token) {
    throw new Error("Token not found");
  }
  const formattedAmountIn = amount * 10 ** token.decimals;
  const quoteResponse = await import_axios2.default.get(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inToken}&outputMint=${usdcMint}&amount=${formattedAmountIn}&slippageBps=1000`
  );
  const { data: quoteData } = quoteResponse;
  const swapResponse = await import_axios2.default.post(
    "https://quote-api.jup.ag/v6/swap-instructions",
    {
      userPublicKey: wallet,
      wrapAndUnwrapSol: true,
      quoteResponse: quoteData
    }
  );
  const {
    setupInstructions,
    swapInstruction,
    addressLookupTableAddresses,
    cleanupInstruction
  } = swapResponse.data;
  return {
    swapIxs: [
      deserializeInstruction(swapInstruction),
      import_web36.ComputeBudgetProgram.setComputeUnitLimit({
        units: 5e5
      })
    ],
    addressLookupTableAccounts: await getAddressLookupTableAccounts(
      connection,
      addressLookupTableAddresses
    ),
    setupInstructions: setupInstructions.map(deserializeInstruction),
    cleanupInstruction: deserializeInstruction(cleanupInstruction),
    usdcAmount: quoteData.outAmount
  };
};
var deserializeInstruction = (instruction) => {
  return new import_web36.TransactionInstruction({
    programId: new import_web36.PublicKey(instruction.programId),
    keys: instruction.accounts.map((key) => ({
      pubkey: new import_web36.PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable
    })),
    data: Buffer.from(instruction.data, "base64")
  });
};
var getAddressLookupTableAccounts = async (connection, keys) => {
  const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
    keys.map((key) => new import_web36.PublicKey(key))
  );
  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new import_web36.AddressLookupTableAccount({
        key: new import_web36.PublicKey(addressLookupTableAddress),
        state: import_web36.AddressLookupTableAccount.deserialize(accountInfo.data)
      });
      acc.push(addressLookupTableAccount);
    }
    return acc;
  }, new Array());
};
var TOKENS = {
  So11111111111111111111111111111111111111112: {
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6
  }
};

// src/utils/constants.ts
var USDC_DECIMALS = 6;
var METAPLEX_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

// src/position.ts
var import_anchor = require("@coral-xyz/anchor");
var import_web37 = require("@solana/web3.js");
var import_bytes = require("@coral-xyz/anchor/dist/cjs/utils/bytes/index.js");
var Position = class {
  constructor(program) {
    this.program = program;
    this.METAPLEX_PROGRAM_ID = new import_web37.PublicKey(METAPLEX_ID);
  }
  /**
   * Get all Position Accounts for a Market
   * @param marketId - Market ID
   *
   */
  async getPositionsAccountsForMarket(marketId) {
    const allAccounts = await this.program.account.positionAccount.all();
    console.log(
      "SDK: All position accounts for user for market:",
      allAccounts.map((acc) => ({
        marketId: acc.account.marketId,
        authority: acc.account.authority.toString()
        // log other fields you want to see
      }))
    );
    const response = await this.program.account.positionAccount.all([
      {
        memcmp: {
          offset: 8 + 1,
          bytes: import_bytes.bs58.encode(new import_anchor.BN(marketId).toArray("le", 8))
        }
      }
    ]);
    return response.map(
      ({ account }) => formatPositionAccount(account, marketId)
    );
  }
  /**
   * Get all Positions for a user
   * @param user - User PublicKey
   *
   */
  // async getPositionsForUser(user: PublicKey) {
  //   // Then try the filtered query
  //   const allAccounts = await this.program.account.positionAccount.all();
  //   const formattedPositionAccounts = allAccounts.map(({ account }) =>
  //     formatPositionAccount(account)
  //   );
  //   const positions = formattedPositionAccounts.flatMap(
  //     (positionAccount) => positionAccount.positions
  //   );
  //   const userPositions = positions.filter(
  //     (position) => position.authority === user.toBase58()
  //   );
  //   return userPositions;
  // }
  /**
   * Get User positions for a particular market
   * @param user - User PublicKey
   * @param marketId - Market ID
   */
  // async getUserPositionsForMarket(user: PublicKey, marketId: number) {
  //   const positionAccounts = await this.getPositionsAccountsForMarket(marketId);
  //   const positions = positionAccounts.flatMap(
  //     (positionAccount) => positionAccount.positions
  //   );
  //   return positions.filter(
  //     (position) => position.authority === user.toBase58()
  //   );
  // }
  /**
   * Get the PDA for a position account
   * @param marketId - Market ID
   * @param marketAddress - Market Address
   * @param positionNonce - The nonce of the position account
   *
   */
  async getPositionsAccountPda(marketId, positionNonce = 0) {
    let positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );
    if (positionNonce !== 0) {
      const marketAddress = getMarketPDA(this.program.programId, marketId);
      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketAddress,
        positionNonce
      );
      positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        marketId,
        subPositionAccountPDA
      );
    }
    return this.program.account.positionAccount.fetch(positionAccountPDA);
  }
  /**
   * Create Sub positions account
   * @param user - User PublicKey the main user
   * @param payer - Payer PublicKey
   * @param options - RPC options
   *
   */
  async createSubPositionAccount(marketId, payer, marketAddress, options) {
    const ixs = [];
    const positionAccount = await this.getPositionsAccountPda(marketId);
    const subPositionAccountPDA = getSubPositionAccountPDA(
      this.program.programId,
      marketId,
      marketAddress,
      positionAccount.nonce + 1
    );
    const marketPositionsAccount = getPositionAccountPDA(
      this.program.programId,
      marketId
    );
    try {
      ixs.push(
        await this.program.methods.createSubPositionAccount(subPositionAccountPDA).accountsPartial({
          signer: payer,
          market: marketAddress,
          marketPositionsAccount,
          subMarketPositions: subPositionAccountPDA,
          systemProgram: import_web37.SystemProgram.programId
        }).instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
    return ixs;
  }
  /**
   * Get position account Nonce With Slots
   * @param positionAccounts - Position Accounts
   *
   */
  getPositionAccountNonceWithSlots(positionAccounts, payer) {
    const marketId = Number(positionAccounts[0].marketId);
    const marketAddress = getMarketPDA(this.program.programId, marketId);
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }
    let nonce = null;
    for (const positionAccount of positionAccounts.reverse()) {
      if (nonce !== null) {
        break;
      }
      console.log("SDK: positionAccount", positionAccount);
      let freeSlots = 0;
      positionAccount.positions.forEach((position) => {
        if (nonce !== null) {
          return;
        }
        if (position.positionStatus !== "open" /* OPEN */ && position.positionStatus !== "waiting" /* WAITING */ && freeSlots >= 2) {
          nonce = positionAccount.isSubPosition ? Number(positionAccount.nonce) : 0;
        }
        if (position.positionStatus !== "open" /* OPEN */ && position.positionStatus !== "waiting" /* WAITING */) {
          freeSlots += 1;
        }
      });
    }
    if (nonce === null) {
      throw new Error("No open orders found");
    }
    if (nonce === 0) {
      return getPositionAccountPDA(this.program.programId, Number(marketId));
    }
    console.log("SDK: nonce", nonce);
    const subPositionAccountPDA = getSubPositionAccountPDA(
      this.program.programId,
      Number(marketId),
      marketAddress,
      nonce
    );
    const positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      Number(marketId),
      subPositionAccountPDA
    );
    return positionAccountPDA;
  }
  async getPositionAccountIxs(marketId, payer) {
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }
    let marketAddress = getMarketPDA(this.program.programId, marketId);
    const marketPositionsAccount = getPositionAccountPDA(
      this.program.programId,
      marketId
    );
    console.log("SDK: marketPositionsAccount from positions", marketPositionsAccount.toString());
    const ixs = [];
    let positionAccounts = [];
    positionAccounts = await this.getPositionsAccountsForMarket(marketId);
    console.log("SDK: initial positionAccounts", positionAccounts);
    if (positionAccounts.length === 0) {
      throw new Error(
        "No position accounts found for this market. Something went wrong."
      );
    }
    try {
      const positionAccountWithSlots = this.getPositionAccountNonceWithSlots(
        positionAccounts,
        payer
      );
      console.log("SDK: returned positionAccountPDA", positionAccountWithSlots);
      return { positionAccountPDA: positionAccountWithSlots, ixs };
    } catch {
      const mainPositionAccount = positionAccounts.find(
        (positionAccount) => !positionAccount.isSubPosition
      );
      if (!mainPositionAccount) {
        throw new Error(
          "Main position account not found. Cannot determine next sub-position nonce."
        );
      }
      const subPositionAccountKey = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketAddress,
        Number(mainPositionAccount.nonce) + 1
      );
      console.log("SDK: subPositionAccountKey", subPositionAccountKey.toString());
      const subPositionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        marketId,
        subPositionAccountKey
      );
      console.log("SDK: subPositionAccountPDA", subPositionAccountPDA.toString());
      ixs.push(
        await this.program.methods.createSubPositionAccount(subPositionAccountKey).accountsPartial({
          signer: payer,
          market: marketAddress,
          marketPositionsAccount,
          subMarketPositions: subPositionAccountPDA,
          systemProgram: import_web37.SystemProgram.programId
        }).instruction()
      );
      return {
        positionAccountPDA: subPositionAccountPDA,
        ixs
      };
    }
  }
  // async mintExistingPosition(
  //   marketId: number,
  //   positionId: number,
  //   positionNonce: number,
  //   payer: PublicKey,
  //   metadataUri: string,
  //   collectionAuthority: PublicKey,
  //   options?: RpcOptions
  // ) {
  //   const ixs: TransactionInstruction[] = [];
  //   const marketPDA = getMarketPDA(this.program.programId, marketId);
  //   let positionAccountPDA = getPositionAccountPDA(
  //     this.program.programId,
  //     marketId
  //   );
  //   if (positionNonce !== 0) {
  //     const subPositionAccountPDA = getSubPositionAccountPDA(
  //       this.program.programId,
  //       marketId,
  //       marketPDA,
  //       positionNonce
  //     );
  //     positionAccountPDA = getPositionAccountPDA(
  //       this.program.programId,
  //       marketId,
  //       subPositionAccountPDA
  //     );
  //   }
  //   const marketAccount = await this.program.account.marketState.fetch(
  //     marketPDA
  //   );
  //   const nftMintKeypair = Keypair.generate();
  //   // Get the NFT metadata PDA
  //   const nftMetadataPda = getNftMetadataPDA(
  //     nftMintKeypair.publicKey,
  //     this.METAPLEX_PROGRAM_ID
  //   );
  //   // Get the NFT master edition PDA
  //   const nftMasterEditionPda = getNftMasterEditionPDA(
  //     nftMintKeypair.publicKey,
  //     this.METAPLEX_PROGRAM_ID
  //   );
  //   // Create the user's NFT token account using ATA program
  //   const nftTokenAccount = getAssociatedTokenAddressSync(
  //     nftMintKeypair.publicKey,
  //     payer, // Create token account for admin since they own the position
  //     false, // allowOwnerOffCurve
  //     TOKEN_PROGRAM_ID
  //   );
  //   if (
  //     !marketAccount.nftCollectionMint ||
  //     !marketAccount.nftCollectionMetadata ||
  //     !marketAccount.nftCollectionMasterEdition
  //   ) {
  //     throw new Error(
  //       "Market account does not have a collection mint, metadata, or master edition"
  //     );
  //   }
  //   try {
  //     ixs.push(
  //       await this.program.methods
  //         .mintPosition({
  //           positionId: new BN(positionId),
  //           metadataUri: metadataUri,
  //         })
  //         .accountsPartial({
  //           signer: payer,
  //           market: marketPDA,
  //           marketPositionsAccount: positionAccountPDA,
  //           nftMint: nftMintKeypair.publicKey,
  //           nftTokenAccount: nftTokenAccount,
  //           metadataAccount: nftMetadataPda,
  //           masterEdition: nftMasterEditionPda,
  //           collectionMint: marketAccount.nftCollectionMint,
  //           collectionMetadata: marketAccount.nftCollectionMetadata,
  //           collectionMasterEdition: marketAccount.nftCollectionMasterEdition,
  //           collectionAuthority: collectionAuthority, //needs to be the same as market creator and needs to sign.
  //           tokenProgram: TOKEN_PROGRAM_ID,
  //           tokenMetadataProgram: this.METAPLEX_PROGRAM_ID,
  //           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //           systemProgram: SystemProgram.programId,
  //           sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
  //         })
  //         .instruction()
  //     );
  //     const tx = await createVersionedTransaction(
  //       this.program,
  //       ixs,
  //       payer,
  //       options
  //     );
  //     tx.sign([nftMintKeypair]);
  //     return tx;
  //   } catch (error) {
  //     console.log("error", error);
  //     throw error;
  //   }
  // }
};

// src/trade.ts
var import_mpl_core = __toESM(require_src(), 1);
var Trade = class {
  constructor(program, adminKey, feeVault, usdcMint) {
    this.program = program;
    this.METAPLEX_PROGRAM_ID = new import_web38.PublicKey(METAPLEX_ID);
    this.decimals = USDC_DECIMALS;
    this.ADMIN_KEY = adminKey;
    this.FEE_VAULT = feeVault;
    this.USDC_MINT = usdcMint;
    this.position = new Position(this.program);
  }
  /**
   * Get All Markets
   *
   */
  async getAllMarkets() {
    try {
      const marketV2 = await this.program.account.marketState.all();
      console.log("SDK:marketV2", marketV2);
      return marketV2.map(
        ({ account, publicKey: publicKey2 }) => formatMarket(account, publicKey2)
      );
    } catch (error) {
      console.log("SDK: getAllMarkets error", error);
      throw error;
    }
  }
  /**
   * Get Market By ID
   * @param marketId - The ID of the market
   *
   */
  async getMarketById(marketId) {
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const response = await this.program.account.marketState.fetch(marketPDA);
    return formatMarket(response, marketPDA);
  }
  /**
   * Get Market By Address
   * @param address - The address of the market PDA
   *
   */
  async getMarketByAddress(address) {
    const account = await this.program.account.marketState.fetch(address);
    return formatMarket(account, address);
  }
  /**
   * Create Market
   * @param args.marketId - new markert id - length + 1
   * @param args.startTime - start time
   * @param args.endTime - end time
   * @param args.question - question (max 80 characters)
   * @param args.oraclePubkey - oracle pubkey
   * @param args.metadataUri - metadata uri
   * @param args.mintPublicKey - collection mint public key. This needs to sign the transaction.
   * @param args.payer - payer
   * @param options - RPC options
   *
   */
  async createMarket({
    startTime,
    endTime,
    question,
    oraclePubkey,
    metadataUri,
    payer
  }, options) {
    if (question.length > 80) {
      throw new Error("Question must be less than 80 characters");
    }
    const ixs = [];
    const configPDA = getConfigPDA(this.program.programId);
    const configAccount = await this.program.account.config.fetch(configPDA);
    const marketIdBN = configAccount.nextMarketId;
    const marketId = marketIdBN.toNumber();
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const marketPositionsPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );
    const collectionMintPDA = getCollectionPDA(
      this.program.programId,
      marketId
    );
    try {
      ixs.push(
        await this.program.methods.createMarket({
          question: encodeString(question, 80),
          marketStart: new import_bn2.default(startTime),
          marketEnd: new import_bn2.default(endTime),
          metadataUri
        }).accountsPartial({
          payer,
          feeVault: this.FEE_VAULT,
          config: configPDA,
          oraclePubkey,
          market: marketPDA,
          marketPositionsAccount: marketPositionsPDA,
          usdcMint: this.USDC_MINT,
          collection: collectionMintPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          mplCoreProgram: import_mpl_core.MPL_CORE_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId
        }).instruction()
      );
      const createMarketTx = await sendVersionedTransaction_default(
        this.program,
        ixs,
        payer,
        options
      );
      let crankOracleTx = void 0;
      try {
      } catch (error) {
        console.log("error cranking oracle", error);
      }
      let txs = [createMarketTx];
      if (crankOracleTx) {
        txs.unshift(crankOracleTx);
      }
      return { txs, marketId };
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }
  // async crankOracle(
  //   oraclePubkey: PublicKey,
  //   payer: PublicKey
  // ): Promise<VersionedTransaction | undefined> {
  //   if (!oraclePubkey) {
  //     throw new Error("Oracle pubkey is required");
  //   }
  //   if (!payer) {
  //     throw new Error("Payer is required");
  //   }
  //   const queue = await getDefaultDevnetQueue("https://api.devnet.solana.com");
  //   const connection = new Connection("https://api.devnet.solana.com");
  //   const pullFeed = new PullFeed(queue.program, oraclePubkey);
  //   console.log("Pull Feed:", pullFeed.pubkey.toBase58(), "\n");
  //   // Use the default crossbar server
  //   const crossbarClient = CrossbarClient.default();
  //   try {
  //     const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx(
  //       {
  //         gateway: "https://switchboard-oracle.everstake.one/devnet",
  //         numSignatures: 3,
  //         crossbarClient: crossbarClient,
  //         chain: "solana",
  //         network: "devnet",
  //       },
  //       false,
  //       payer
  //     );
  //     if (!pullIx || pullIx.length === 0) {
  //       throw new Error("Failed to fetch update from local crossbar server.");
  //     }
  //     const tx = await asV0Tx({
  //       connection,
  //       ixs: pullIx!, // after the pullIx you can add whatever transactions you'd like
  //       computeUnitPrice: 200_000,
  //       computeUnitLimitMultiple: 1.3,
  //       lookupTables: luts,
  //     });
  //     for (let simulation of responses) {
  //       console.log(
  //         `Feed Public Key ${simulation.value} job outputs: ${simulation.value}`
  //       );
  //     }
  //     return tx;
  //   } catch (error) {
  //     console.error(
  //       "Failed during fetchUpdateIx or transaction submission:",
  //       error
  //     );
  //   }
  // }
  /**
   * Open Order
   * @param args.marketId - The ID of the Market
   * @param args.amount - The amount of the Order
   * @param args.direction - The direction of the Order
   * @param args.mint - The mint of the Order
   * @param args.token - The token to use for the Order
   * @param args.payer - The payer of the Order
   * @param options - RPC options
   *
   */
  async openPosition({ marketId, amount, direction, mint, token, payer, metadataUri }, options) {
    const ixs = [];
    const addressLookupTableAccounts = [];
    const { positionAccountPDA, ixs: positionAccountIxs } = await this.position.getPositionAccountIxs(marketId, payer);
    console.log(
      "SDK: positions account in trade open",
      positionAccountPDA.toString()
    );
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(
      marketPDA
    );
    const nextPositionId = marketAccount.nextPositionId;
    const configPDA = getConfigPDA(this.program.programId);
    const collectionPDA = getCollectionPDA(this.program.programId, marketId);
    const positionNftPDA = getPositionNftPDA(
      this.program.programId,
      marketId,
      nextPositionId
    );
    if (positionAccountIxs.length > 0) {
      ixs.push(...positionAccountIxs);
    }
    let amountInUSDC = amount * 10 ** USDC_DECIMALS;
    if (token !== this.USDC_MINT.toBase58()) {
      const {
        setupInstructions,
        swapIxs,
        addressLookupTableAccounts: swapAddressLookupTableAccounts,
        usdcAmount
      } = await swap({
        connection: this.program.provider.connection,
        wallet: payer.toBase58(),
        inToken: token,
        amount,
        usdcMint: this.USDC_MINT.toBase58()
      });
      amountInUSDC = usdcAmount;
      if (swapIxs.length === 0) {
        return;
      }
      ixs.push(...setupInstructions);
      ixs.push(...swapIxs);
      addressLookupTableAccounts.push(...swapAddressLookupTableAccounts);
    }
    try {
      ixs.push(
        await this.program.methods.createPosition({
          amount: new import_bn2.default(amountInUSDC),
          direction,
          metadataUri
        }).accountsPartial({
          signer: payer,
          feeVault: this.FEE_VAULT,
          marketPositionsAccount: positionAccountPDA,
          market: marketPDA,
          usdcMint: mint,
          config: configPDA,
          collection: collectionPDA,
          mplCoreProgram: import_mpl_core.MPL_CORE_PROGRAM_ID,
          positionNftAccount: positionNftPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId
        }).instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
    return { ixs, addressLookupTableAccounts };
  }
  /**
   * Resolve Market
   * @param args.marketId - The ID of the Market
   * @param args.winningDirection - The Winning Direction of the Market
   *
   * @param options - RPC options
   *
   */
  async resolveMarket({
    marketId,
    payer
  }, options) {
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(marketPDA);
    const oraclePubkey = marketAccount.oraclePubkey;
    if (!oraclePubkey) {
      throw new Error("Market has no oracle pubkey");
    }
    const ixs = [];
    try {
      ixs.push(
        await this.program.methods.resolveMarket().accountsPartial({
          signer: payer,
          market: marketPDA,
          oraclePubkey
        }).instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
    return ixs;
  }
  /**
   * Close Market and related accounts to collect remaining liquidity
   * @param marketId - The ID of the market
   * @param payer - The payer of the Market
   * @param options - RPC options
   *
   */
  async closeMarket(marketId, payer, options) {
    const ixs = [];
    const marketIdBN = new import_bn2.default(marketId);
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const configPDA = getConfigPDA(this.program.programId);
    const marketPositionsPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );
    const feeVaultUsdcAta = getAssociatedTokenAddressSync(
      this.USDC_MINT,
      this.FEE_VAULT,
      true,
      TOKEN_PROGRAM_ID
    );
    const marketVault = getAssociatedTokenAddressSync(
      this.USDC_MINT,
      marketPDA,
      true,
      TOKEN_PROGRAM_ID
    );
    try {
      ixs.push(
        await this.program.methods.closeMarket({
          marketId: marketIdBN
        }).accountsPartial({
          signer: payer,
          feeVault: this.FEE_VAULT,
          market: marketPDA,
          marketPositionsAccount: marketPositionsPDA,
          config: configPDA,
          feeVaultUsdcAta,
          usdcMint: this.USDC_MINT,
          marketVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId
        }).instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
    return ixs;
  }
  // /**
  //  * Payout Order
  //  * @param args.marketId - The ID of the Market
  //  * @param args.orderId - The ID of the Order to Payout
  //  * @param args.userNonce - The nonce of the user
  //  *
  //  * @param options - RPC options
  //  *
  //  */
  // async payoutOrder(
  //   orders: {
  //     marketId: number;
  //     orderId: number;
  //     userNonce: number;
  //   }[],
  //   payer: PublicKey,
  //   options?: RpcOptions
  // ) {
  //   const ixs: TransactionInstruction[] = [];
  //   const configPDA = getConfigPDA(this.program.programId);
  //   const marketIdBN = new BN(orders[0].marketId);
  //   const marketPDA = getMarketPDA(this.program.programId, orders[0].marketId);
  //   if (orders.length > 10) {
  //     throw new Error("Max 10 orders per transaction");
  //   }
  //   for (const order of orders) {
  //     let positionAccountPDA = getPositionAccountPDA(
  //       this.program.programId,
  //       order.marketId
  //     );
  //     if (order.userNonce !== 0) {
  //       const subPositionAccountPDA = getSubPositionAccountPDA(
  //         this.program.programId,
  //         order.marketId,
  //         marketPDA,
  //         order.userNonce
  //       );
  //       positionAccountPDA = getPositionAccountPDA(
  //         this.program.programId,
  //         order.marketId,
  //         subPositionAccountPDA
  //       );
  //     }
  //     try {
  //       ixs.push(
  //         await this.program.methods
  //           .settlePosition(new BN(order.orderId))
  //           .accountsPartial({
  //             signer: payer,
  //             feeVault: this.FEE_VAULT,
  //             marketPositionsAccount: positionAccountPDA,
  //             market: marketPDA,
  //             usdcMint: this.USDC_MINT,
  //             config: configPDA,
  //             tokenProgram: TOKEN_PROGRAM_ID,
  //             associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //             systemProgram: anchor.web3.SystemProgram.programId,
  //           })
  //           .instruction()
  //       );
  //     } catch (error) {
  //       console.log("error", error);
  //       throw error;
  //     }
  //   }
  //   return ixs;
  // }
  /**
   * Update Market
   * @param marketId - The ID of the market
   * @param marketEnd - The end time of the market
   * @param options - RPC options
   *
   */
  async updateMarket(marketId, marketEnd, payer, options) {
    const ixs = [];
    ixs.push(
      await this.program.methods.updateMarket({
        marketId: new import_bn2.default(marketId),
        marketEnd: new import_bn2.default(marketEnd)
      }).accounts({
        signer: payer,
        market: getMarketPDA(this.program.programId, marketId)
      }).instruction()
    );
    return ixs;
  }
  async payoutPosition(marketId, payer, positionId, positionNonce, options) {
    const ixs = [];
    const marketPda = getMarketPDA(this.program.programId, marketId);
    const collectionPda = getCollectionPDA(this.program.programId, marketId);
    const userUsdcAta = getAssociatedTokenAddressSync(
      this.USDC_MINT,
      payer,
      false,
      TOKEN_PROGRAM_ID
    );
    const marketVault = getAssociatedTokenAddressSync(
      this.USDC_MINT,
      marketPda,
      true,
      // allowOwnerOffCurve since marketPda is a PDA
      TOKEN_PROGRAM_ID
    );
    let positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );
    if (positionNonce !== 0) {
      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketPda,
        positionNonce
      );
      positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        marketId,
        subPositionAccountPDA
      );
    }
    const positionAccount = await this.program.account.positionAccount.fetch(
      positionAccountPDA
    );
    const currentPosition = positionAccount.positions.find(
      (p) => p.positionId.toNumber() === positionId
    );
    if (!currentPosition) {
      throw new Error("Position not found in position account");
    }
    const nftMint = currentPosition.mint;
    if (!nftMint) {
      throw new Error("Position is not an NFT");
    }
    try {
      ixs.push(
        await this.program.methods.settlePosition().accountsPartial({
          signer: payer,
          marketPositionsAccount: positionAccountPDA,
          nftMint,
          userUsdcAta,
          marketUsdcVault: marketVault,
          usdcMint: this.USDC_MINT,
          market: marketPda,
          collection: collectionPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METAPLEX_ID,
          mplCoreProgram: import_mpl_core.MPL_CORE_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId
        }).instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
    const tx = await sendVersionedTransaction_default(
      this.program,
      ixs,
      payer,
      options
    );
    return tx;
  }
  // /**
  //  * Create Customer
  //  * @param args.id - The ID of the customer
  //  * @param args.name - The name of the customer
  //  * @param args.authority - The authority of the customer
  //  *
  //  * @param options - RPC options
  //  *
  //  */
  // async createCustomer(
  //   { id, name, authority, feeRecipient }: CreateCustomerArgs,
  //   options?: RpcOptions
  // ) {
  //   const ixs: TransactionInstruction[] = [];
  //   ixs.push(
  //     await this.program.methods
  //       .createUser({ id, authority })
  //       .accounts({
  //         signer: this.program.provider.publicKey,
  //       })
  //       .instruction()
  //   );
  //   return sendVersionedTransaction(this.program, ixs, options);
  // }
};

// src/config.ts
var import_anchor2 = require("@coral-xyz/anchor");
var Config = class {
  constructor(program, adminKey, feeVault, usdcMint) {
    this.program = program;
    this.ADMIN_KEY = adminKey;
    this.FEE_VAULT = feeVault;
    this.USDC_MINT = usdcMint;
    this.trade = new Trade(this.program, this.ADMIN_KEY, this.FEE_VAULT, this.USDC_MINT);
  }
  /**
   * Init a config account to maintain details
   *
   */
  async createConfig(feeAmount, payer) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs = [];
    const feeAmountBN = new import_anchor2.BN(feeAmount);
    ixs.push(
      await this.program.methods.initializeConfig(feeAmountBN).accountsPartial({
        signer: payer,
        feeVault: this.FEE_VAULT,
        config: configPDA,
        systemProgram: import_anchor2.web3.SystemProgram.programId
      }).instruction()
    );
    return ixs;
  }
  /**
   * Get a config account to maintain details if it exists
   *
   */
  async getConfig() {
    const configPDA = getConfigPDA(this.program.programId);
    try {
      const config = await this.program.account.config.fetch(configPDA);
      return config;
    } catch (error) {
      console.error("Error fetching config or config does not exist:", error);
      return null;
    }
  }
  /**
   * Update a config account to maintain details
   *
   */
  async updateConfig(payer, feeAmount, authority, feeVault) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs = [];
    const feeAmountBN = feeAmount ? new import_anchor2.BN(feeAmount) : null;
    const authorityBN = authority || null;
    const feeVaultBN = feeVault || null;
    ixs.push(
      await this.program.methods.updateConfig(feeAmountBN, authorityBN, feeVaultBN).accountsPartial({
        signer: this.ADMIN_KEY,
        feeVault: this.FEE_VAULT,
        config: configPDA,
        systemProgram: import_anchor2.web3.SystemProgram.programId
      }).instruction()
    );
    return ixs;
  }
  /**
   * Close a config account
   * @param payer - PublicKey of the payer
   * @returns TransactionInstruction[] - Array of TransactionInstruction
   */
  async closeConfig(payer) {
    const configPDA = getConfigPDA(this.program.programId);
    const markets = await this.trade.getAllMarkets();
    if (markets.length > 0) {
      throw new Error("Cannot close config with active markets");
    }
    const ixs = [];
    try {
      ixs.push(
        await this.program.methods.closeConfig().accountsPartial({
          signer: this.ADMIN_KEY,
          config: configPDA,
          systemProgram: import_anchor2.web3.SystemProgram.programId
        }).instruction()
      );
    } catch (error) {
      console.error("Error closing config:", error);
      throw error;
    }
    return ixs;
  }
};

// src/index.ts
var ShortXClient = class {
  constructor(connection, adminKey, feeVault, usdcMint) {
    const IDL = JSON.parse(
      import_fs.default.readFileSync(
        require.resolve("shortx-sdk/idl"),
        "utf-8"
      )
    );
    this.program = new import_anchor3.Program(IDL, { connection });
    this.trade = new Trade(this.program, adminKey, feeVault, usdcMint);
    this.position = new Position(this.program);
    this.config = new Config(this.program, adminKey, feeVault, usdcMint);
    this.ADMIN_KEY = adminKey;
    this.FEE_VAULT = feeVault;
    this.USDC_MINT = usdcMint;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MarketStates,
  PositionDirection,
  PositionStatus,
  WinningDirection
});
/*! Bundled license information:

@solana/buffer-layout/lib/Layout.js:
  (**
   * Support for translating between Uint8Array instances and JavaScript
   * native types.
   *
   * {@link module:Layout~Layout|Layout} is the basis of a class
   * hierarchy that associates property names with sequences of encoded
   * bytes.
   *
   * Layouts are supported for these scalar (numeric) types:
   * * {@link module:Layout~UInt|Unsigned integers in little-endian
   *   format} with {@link module:Layout.u8|8-bit}, {@link
   *   module:Layout.u16|16-bit}, {@link module:Layout.u24|24-bit},
   *   {@link module:Layout.u32|32-bit}, {@link
   *   module:Layout.u40|40-bit}, and {@link module:Layout.u48|48-bit}
   *   representation ranges;
   * * {@link module:Layout~UIntBE|Unsigned integers in big-endian
   *   format} with {@link module:Layout.u16be|16-bit}, {@link
   *   module:Layout.u24be|24-bit}, {@link module:Layout.u32be|32-bit},
   *   {@link module:Layout.u40be|40-bit}, and {@link
   *   module:Layout.u48be|48-bit} representation ranges;
   * * {@link module:Layout~Int|Signed integers in little-endian
   *   format} with {@link module:Layout.s8|8-bit}, {@link
   *   module:Layout.s16|16-bit}, {@link module:Layout.s24|24-bit},
   *   {@link module:Layout.s32|32-bit}, {@link
   *   module:Layout.s40|40-bit}, and {@link module:Layout.s48|48-bit}
   *   representation ranges;
   * * {@link module:Layout~IntBE|Signed integers in big-endian format}
   *   with {@link module:Layout.s16be|16-bit}, {@link
   *   module:Layout.s24be|24-bit}, {@link module:Layout.s32be|32-bit},
   *   {@link module:Layout.s40be|40-bit}, and {@link
   *   module:Layout.s48be|48-bit} representation ranges;
   * * 64-bit integral values that decode to an exact (if magnitude is
   *   less than 2^53) or nearby integral Number in {@link
   *   module:Layout.nu64|unsigned little-endian}, {@link
   *   module:Layout.nu64be|unsigned big-endian}, {@link
   *   module:Layout.ns64|signed little-endian}, and {@link
   *   module:Layout.ns64be|unsigned big-endian} encodings;
   * * 32-bit floating point values with {@link
   *   module:Layout.f32|little-endian} and {@link
   *   module:Layout.f32be|big-endian} representations;
   * * 64-bit floating point values with {@link
   *   module:Layout.f64|little-endian} and {@link
   *   module:Layout.f64be|big-endian} representations;
   * * {@link module:Layout.const|Constants} that take no space in the
   *   encoded expression.
   *
   * and for these aggregate types:
   * * {@link module:Layout.seq|Sequence}s of instances of a {@link
   *   module:Layout~Layout|Layout}, with JavaScript representation as
   *   an Array and constant or data-dependent {@link
   *   module:Layout~Sequence#count|length};
   * * {@link module:Layout.struct|Structure}s that aggregate a
   *   heterogeneous sequence of {@link module:Layout~Layout|Layout}
   *   instances, with JavaScript representation as an Object;
   * * {@link module:Layout.union|Union}s that support multiple {@link
   *   module:Layout~VariantLayout|variant layouts} over a fixed
   *   (padded) or variable (not padded) span of bytes, using an
   *   unsigned integer at the start of the data or a separate {@link
   *   module:Layout.unionLayoutDiscriminator|layout element} to
   *   determine which layout to use when interpreting the buffer
   *   contents;
   * * {@link module:Layout.bits|BitStructure}s that contain a sequence
   *   of individual {@link
   *   module:Layout~BitStructure#addField|BitField}s packed into an 8,
   *   16, 24, or 32-bit unsigned integer starting at the least- or
   *   most-significant bit;
   * * {@link module:Layout.cstr|C strings} of varying length;
   * * {@link module:Layout.blob|Blobs} of fixed- or variable-{@link
   *   module:Layout~Blob#length|length} raw data.
   *
   * All {@link module:Layout~Layout|Layout} instances are immutable
   * after construction, to prevent internal state from becoming
   * inconsistent.
   *
   * @local Layout
   * @local ExternalLayout
   * @local GreedyCount
   * @local OffsetLayout
   * @local UInt
   * @local UIntBE
   * @local Int
   * @local IntBE
   * @local NearUInt64
   * @local NearUInt64BE
   * @local NearInt64
   * @local NearInt64BE
   * @local Float
   * @local FloatBE
   * @local Double
   * @local DoubleBE
   * @local Sequence
   * @local Structure
   * @local UnionDiscriminator
   * @local UnionLayoutDiscriminator
   * @local Union
   * @local VariantLayout
   * @local BitStructure
   * @local BitField
   * @local Boolean
   * @local Blob
   * @local CString
   * @local Constant
   * @local bindConstructorLayout
   * @module Layout
   * @license MIT
   * @author Peter A. Bigot
   * @see {@link https://github.com/pabigot/buffer-layout|buffer-layout on GitHub}
   *)

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=index.cjs.map