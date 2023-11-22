
## Usage

Start by creating a new Tuna object like so:

```js
var context = new AudioContext();
var tuna = new Tuna(context);
```

You need to pass the audio context you're using in your application. Tuna will be using it to create its effects.

You create a new Tuna node as such:

```js
var chorus = new tuna.Chorus({
    rate: 1.5,
    feedback: 0.2,
    delay: 0.0045,
    bypass: false
});
```

You can then connect the Tuna node to native Web Audio just as you would normally:

```js
// Create regular Web Audio nodes
var input = context.createGain();
var output = context.createGain();

// Use the Tuna node just like regular nodes
input.connect(chorus);
chorus.connect(output);
```

Tuna nodes mimics the API of normal Web Audio nodes, so you can seamlessly connect with AudioNodes created by the AudioContext.
