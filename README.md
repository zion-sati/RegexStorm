# Regex Storm with NetWasm

**C# belongs in the browser. Let's put a .NET regex tester there.**

[★ Star NetWasm](https://github.com/zion-sati/NetWasm) ·
[Try the NetWasm Playground](https://playground.netwasm.com/) ·
[Meet NetWasm](https://www.netwasm.com/)

Regex Storm made testing .NET regular expressions convenient. We're bringing
that experience entirely into your browser with NetWasm: enter a pattern,
paste your text, and see the matches without sending either to a server.

**Currently under development.** The browser tester is not live yet. You can
already try NetWasm's Regex example in the
[Playground](https://playground.netwasm.com/).

## C# to WebAssembly

[NetWasm](https://github.com/zion-sati/NetWasm) compiles C# ahead of time into
WebAssembly. For this tester, that means compiling the .NET regex engine and
the C# application once, then serving the result as a static website.

Your regex stays a regex. The application runs the .NET engine, including its
pattern parser, inside WebAssembly. Editing a pattern won't require compiling
C# or downloading a compiler.

The result we're building: live match highlighting, group and capture details,
replacement previews, and split results, all evaluated on your device.

## See what NetWasm can do

Have C# code you want to run in a browser? Start with the
[NetWasm Playground](https://playground.netwasm.com/) and compile it locally in
your browser. Explore the [source and quickstart](https://github.com/zion-sati/NetWasm)
to build your own application.

**[Star NetWasm to follow the project →](https://github.com/zion-sati/NetWasm)**

## Credits

Inspired by [Regex Storm](https://github.com/lonekorean/regex-storm) by Will Boyd.
This is an independent project. The original Regex Storm source is MIT licensed.
