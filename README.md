# DTMF

Generate [Dual-Tone Multi-Frequency](https://en.wikipedia.org/wiki/Dual-tone_multi-frequency_signaling) tones from text or digit sequences using the Web Audio API. Zero dependencies.

Built on the [RFC 2833](https://tools.ietf.org/html/rfc2833) and [ITU E.161](https://www.itu.int/rec/T-REC-E.161) standards.

## Usage

```js
import Tone from './tone.js';

const tone = new Tone();

// From digits
const [channelData, sampleRate] = await tone.create([1, 2, 3]);

// From text — letters are mapped to keypad digits per E.161
const [channelData, sampleRate] = await tone.create('hello');
```

`create` accepts a string or array of characters. Letters are converted to their corresponding phone keypad digit (`h→4`, `e→3`, `l→5`, `o→6`), digits and `*`, `#`, ` ` are used as-is, and unrecognized characters are silently dropped.

**Returns** `[Float32Array, number]` — the raw PCM channel data and the sample rate. You bring your own encoder to convert the output into whatever format you need.

### Encoding to WAV

Pair with [ArraybufferToWav](https://github.com/bmson/ArraybufferToWav) to get a playable `Blob`:

```js
import Tone from './tone.js';
import arrayBufferToWav from '../ArraybufferToWav/lib.js';

const tone = new Tone();
const [channelData, sampleRate] = await tone.create('hello');
const blob = arrayBufferToWav(channelData, sampleRate);

// Play it
const audio = new Audio(URL.createObjectURL(blob));
audio.play();
```

## Frequency table

Each key produces two simultaneous sinusoidal tones — one from the row frequency, one from the column:

```
             1209 Hz    1336 Hz    1477 Hz
  697 Hz        1       2 ABC     3 DEF
  770 Hz      4 GHI     5 JKL     6 MNO
  852 Hz     7 PQRS     8 TUV     9 WXYZ
  941 Hz        *         0         #
```

## Timing

Each tone uses an 80 ms mark (sound) followed by an 80 ms space (silence), giving 160 ms per digit. A 10-digit phone number takes ~1.6 s to render.

## API

### `new Tone()`

Creates a DTMF generator instance.

### `tone.create(input)`

Renders the full DTMF sequence and returns a `Promise<[Float32Array, number]>` — the PCM samples and sample rate (44100 Hz).

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
