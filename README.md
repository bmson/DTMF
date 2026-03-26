# DTMF

Generate [Dual-Tone Multi-Frequency](https://en.wikipedia.org/wiki/Dual-tone_multi-frequency_signaling) tones from text or digit sequences using the Web Audio API. Zero dependencies.

Built on the [RFC 2833](https://tools.ietf.org/html/rfc2833) and [ITU E.161](https://www.itu.int/rec/T-REC-E.161) standards.

## Usage

```js
import Tone from './tone.js';

const tone = new Tone();

// From digits
const wav = await tone.create([1, 2, 3]);

// From text - letters are mapped to keypad digits per E.161
const wav = await tone.create('hello');

// Play it
const audio = new Audio(URL.createObjectURL(wav));
audio.play();
```

`create` accepts a string or array of characters. Letters are converted to their corresponding phone keypad digit (`h→4`, `e→3`, `l→5`, `o→6`), digits and `*`, `#`, ` ` are used as-is, and unrecognized characters are silently dropped.

**Returns** an audio `Blob` (via a transpiler function you wire up - see [Integration](#integration) below).

## Timing

Each tone uses an `80ms` mark (sound) followed by an `80ms` space (silence), giving `160ms` per digit. A 10-digit phone number takes `~1.6s` to render.

## Integration

The `create` method renders tones into a `Float32Array` via `OfflineAudioContext` and calls a `transpiler` function to convert the raw PCM samples into a WAV `Blob`. You'll need to provide that function - for example, using [ArraybufferToWav](https://github.com/bmson/ArraybufferToWav):

```js
import arrayBufferToWav from '../ArraybufferToWav/lib.js';

// Inside tone.js, wire up the transpiler:
// return transpiler(channelData, sampleRate)
// where transpiler = arrayBufferToWav
```

## API

### `new Tone()`

Creates a DTMF generator instance.

### `tone.create(input)`

Renders the full DTMF sequence and returns a `Promise` that resolves to a WAV `Blob`.

| Parameter | Type | Description |
|---|---|---|
| `input` | `string \| Array` | Digits, letters, `*`, `#`, or spaces. Letters are mapped to keypad digits per E.161. |

### `tone.createFrequency(context, key)`

Creates the oscillator pair for a single key and connects them through a low-pass filter (8 kHz cutoff) to the audio context destination.

### `tone.playTone(context, keys, offset?)`

Generator that schedules each tone in the sequence on the given `OfflineAudioContext`, yielding each key as it's scheduled.

## Helpers

### `getIncluded(input, compare)`

Filters `input` to only values present in `compare`.

```js
getIncluded([1, 2, 3], [1, 3]); // [1, 3]
```

### `getCollection(input, map)`

Maps each character in `input` through a lookup object, passing through unmapped values.

```js
getCollection('abc', { a: 1, b: 2, c: 3 }); // [1, 2, 3]
```

## License

ISC
