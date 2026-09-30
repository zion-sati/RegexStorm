# Regex Storm with NetWasm

**C# belongs in the browser. Let's put a .NET regex tester there.**

[★ Star NetWasm](https://github.com/zion-sati/NetWasm) ·
[Test your regex](https://zion-sati.github.io/RegexStorm/) ·
[Try the NetWasm Playground](https://playground.netwasm.com/) ·
[Meet NetWasm](https://www.netwasm.com/)

Regex Storm made testing .NET regular expressions convenient. We've brought
that experience entirely into your browser with NetWasm: enter a pattern,
paste your text, and see the matches without sending either to a server.

**[Open Regex Storm with NetWasm →](https://zion-sati.github.io/RegexStorm/)**

- Live match highlighting, named groups and every repeated capture.
- Replacement previews and split results using .NET regex semantics.
- Regex options, start positions and bounded results.
- Shareable links, dark and light themes, and a layout that fits your phone.
- A separate worker with regex timeouts and recovery for runaway patterns.

## C# to WebAssembly

[NetWasm](https://github.com/zion-sati/NetWasm) compiles C# ahead of time into
WebAssembly. For this tester, that means compiling the .NET regex engine and
the C# 15 application once with the .NET 11 SDK, then serving the result as a static website.

Your regex stays a regex. The application runs the .NET engine, including its
pattern parser, inside WebAssembly. Editing a pattern won't require compiling
C# or downloading a compiler.

Tested in Chromium, Firefox and WebKit. Matching uses invariant culture;
positions use .NET's UTF-16 indexing. Sharing puts your pattern and text in the
link's fragment, so anyone you give that link to can read them.

## See what NetWasm can do

Have C# code you want to run in a browser? Start with the
[NetWasm Playground](https://playground.netwasm.com/) and compile it locally in
your browser. Explore the [source and quickstart](https://github.com/zion-sati/NetWasm)
to build your own application.

**[Star NetWasm to follow the project →](https://github.com/zion-sati/NetWasm)**

## Credits

Inspired by [Regex Storm](https://github.com/lonekorean/regex-storm) by Will Boyd.
This is an independent project. The original Regex Storm source is MIT licensed.
