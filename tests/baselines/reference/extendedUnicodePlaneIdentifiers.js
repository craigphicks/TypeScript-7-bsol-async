//// [extendedUnicodePlaneIdentifiers.ts]
const đ = 4;
const đ = 5;
console.log(đ + đ); // 9

class K {
    #đ = 4;
    #đ = 5;
}

// lower 8 bits look like 'a'
const áĄ = 6;
console.log(áĄ ** áĄ);

// lower 8 bits aren't a valid unicode character
const á = 7;
console.log(á ** á);

// a mix, for good measure
const ááĄđ = 7;
console.log(ááĄđ ** ááĄđ);

const áĄđá = 7;
console.log(áĄđá ** áĄđá);

const đááĄ = 7;
console.log(đááĄ ** đááĄ);

const đąđŽđľđľđ¸ = "đđ¸đťđľđ­";

const âąŻâąą = "ok"; // BMP

const đ¸đšđş = "ok"; // SMP

const đĄ­đĄŽđĄŻ = "ok"; // SIP

const đĄ­đşâąąđŽ = "ok";

const đşâąąđŽđĄ­ = "ok";

const âąąđŽđĄ­đş = "ok";

const đŽđĄ­đşâąą = "ok";


//// [extendedUnicodePlaneIdentifiers.js]
var _K_đ, _K_đ;
const đ = 4;
const đ = 5;
console.log(đ + đ); // 9
class K {
    constructor() {
        _K_đ.set(this, 4);
        _K_đ.set(this, 5);
    }
}
_K_đ = new WeakMap(), _K_đ = new WeakMap();
// lower 8 bits look like 'a'
const áĄ = 6;
console.log(áĄ ** áĄ);
// lower 8 bits aren't a valid unicode character
const á = 7;
console.log(á ** á);
// a mix, for good measure
const ááĄđ = 7;
console.log(ááĄđ ** ááĄđ);
const áĄđá = 7;
console.log(áĄđá ** áĄđá);
const đááĄ = 7;
console.log(đááĄ ** đááĄ);
const đąđŽđľđľđ¸ = "đđ¸đťđľđ­";
const âąŻâąą = "ok"; // BMP
const đ¸đšđş = "ok"; // SMP
const đĄ­đĄŽđĄŻ = "ok"; // SIP
const đĄ­đşâąąđŽ = "ok";
const đşâąąđŽđĄ­ = "ok";
const âąąđŽđĄ­đş = "ok";
const đŽđĄ­đşâąą = "ok";
