import { getIncluded }   from './helpers.js';
import { getCollection } from './helpers.js';

/**
 * Dual Tone Multi Frequency Signaling (DTMF)
 * You can use this to generate DTMF tones based on input key and receive as an AuditContext events
 *
 * Build on the RFC 2833 and E.161 standards
 * https://tools.ietf.org/html/rfc2833
 * https://www.itu.int/rec/T-REC-E.161
 *
 * Frequency table
 * ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
 * │                 │ 1209 Hz         │ 1336 Hz         │ 1477 Hz         │
 * ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
 * │ 697 Hz          │ 1               │ 2 [A,B,C]       │ 3 [D,E,F]       │
 * ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
 * │ 770 Hz          │ 4 [G,H,I]       │ 5 [J,K,L]       │ 6 [M,N,O]       │
 * ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
 * │ 852 Hz          │ 7 [P,Q,R,S]     │ 8 [T,U,V]       │ 9 [W,X,Y,Z]     │
 * ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
 * │ 941 Hz          │ *               │ 0               │ #               │
 * └─────────────────┴─────────────────┴─────────────────┴─────────────────┘
 *
 * Mark and Space for each tone
 * ┌───────────────────────────────────┬───────────────────────────────────┐
 * │ First tone                        │ Second tone                       │
 * ├─────────────────┬─────────────────┼────────────────┬──────────────────┤
 * │ Mark (tone)     │ Space (silent)  │ Mark (tone)    │ Space (silent)   │
 * ├─────────────────┼─────────────────┼────────────────┼──────────────────┤
 * │ 80 ms           │ 80ms            │ 80 ms          │ 80 ms            │
 * └─────────────────┴─────────────────┴────────────────┴──────────────────┘
 *
 * Example:
 *   const tone = new Tone();
 *
 *   tone.create('hello')    => Blob
 *   tone.create([1, 2, 3])  => Blob
 */

export default class {

  // Mark and space time in milliseconds
  #MARK  = 80
  #SPACE = 80

  // Dual tone frequency for each input key
  #DTMF =
    { '0': [941, 1336]
    , '1': [697, 1209]
    , '2': [697, 1336]
    , '3': [697, 1477]
    , '4': [770, 1209]
    , '5': [770, 1336]
    , '6': [770, 1477]
    , '7': [852, 1209]
    , '8': [852, 1336]
    , '9': [852, 1477]
    , '*': [941, 1209]
    , '#': [941, 1477]
    , ' ': [  0,    0] // Zero frequency to handle space character in DTMF sequence
    }

  // Mapping of characters to keys based on the E.161 standard
  #KEYPAD  =
    { a: '2' , b: '2' , c: '2'
    , d: '3' , e: '3' , f: '3'
    , g: '4' , h: '4' , i: '4'
    , j: '5' , k: '5' , l: '5'
    , m: '6' , n: '6' , o: '6'
    , p: '7' , q: '7' , r: '7' , s: '7'
    , t: '8' , u: '8' , v: '8'
    , w: '9' , x: '9' , y: '9' , z: '9'
    }

  createFrequency (context, key) {

    // Create oscillator nodes for each frequency
    const high = context.createOscillator();
    const low  = context.createOscillator();

    // Get the frequency for the input key
    const [ f1, f2 ] = this.#DTMF[key];

    // Set frequency for each oscillator
    high.frequency.setValueAtTime(f1, 0);
    low.frequency.setValueAtTime(f2, 0);

    // Create bidquad filter to remove high frequencies above 8000Hz
    const filter = context.createBiquadFilter();
    filter.type  = "lowpass";
    filter.frequency.setValueAtTime(8000, 0);

    // Pass the oscillator output to the bidquad filter
    high.connect(filter);
    low.connect(filter);

    // Add the filter to the audio context destination
    filter.connect(context.destination);

    // Return the oscillator nodes
    return { high, low }

  }

  // Generator function to create a sequence of DTMF tones we can iterate over at a later time
  * playTone (context, keys, offset = 0) {

    // Iterate through sequence until all tones are played
    while (true) {

      // Remove first value to get the next key and break iteration if there are no more keys
      const key = keys.shift();

      if (key) {
        // Create frequency for the input key and return the oscillator nodes
        const { high, low } = this.createFrequency(context, key);

        // Calculate the start and end time for the tone
        const start = offset;
        const stop  = offset + this.#MARK / 1000

        high.start(start);
        low.start(start);

        high.stop(stop);
        low.stop(stop);

        // Return the end of the current tone so we can calculate the start of the next tone
        offset = stop + (this.#SPACE / 1000);

        yield key
      } else return

    }

  }

  // Generate tone for each frequency
  async create (input = []) {

    // Cleanup input and convert to iterable DTMF array
    const array = getCollection(input, this.#KEYPAD); // Convert input to keypad object values based on object keys
    const keys  = getIncluded(array, Object.keys(this.#DTMF)); // Find all keys that are included in the DTMF object

    // Create audo context to stream the oscillator output
    const channels     = 1;
    const sampleRate   = 44100;
    const samplelength = (keys.length * (this.#MARK + this.#SPACE) / 1000) * sampleRate;

    // Create Audio Context to stream the oscillator output
    const context = new OfflineAudioContext(channels, samplelength, sampleRate);

    // Create tone for each key in the sequence by passing it through the playTone generator function
    const tones    = this.playTone(context, keys);
    const sequence = Array.from(tones);

    // Render the audio context and get channel data
    const audioBuffer = await context.startRendering()
    const channelData = audioBuffer.getChannelData(0);

    // Transpile channel data to wav format
    return transpiler(channelData, sampleRate)
  }

}
