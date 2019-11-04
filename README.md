# Windbg_WdBootScript
Little script to display the type MpEbGlobasl and the SignaturesDatabase used by WdBoot. 
This was just for fun and to learn a bit on the Javascript scripting debugger for WinDBG, don't expect it to be bulletproof.

> **Tested on Windows 10 Pro Version 1903 (OS Build 19013.1) and WdBoot version `4.18.1910.4`**

### Extensions

```
!wdBootGlobals
```

This extension will display the type MpEbGlobals, the data returned by this extension is 
based on my research done on the WdBoot driver (https://n4r1b.netlify.com/en/posts/2019/10/understanding-wdboot-windows-defende-elam/)

!["wdBootGlobals"](https://cdn1.imggmi.com/uploads/2019/11/5/f6f5201b39c6742ea32482cc7bf662a1-full.png)

```
!wdBootSig([AddrOfData], [SizeOfData])
```

This extension will display all the signatures that WdBoot will load to check loaded drivers against them. The address and the size
can be obtained from the function `MpEbLoadSignatures` as out params (`rdx` and `r8`).

!["wdBootSig"](https://cdn1.imggmi.com/uploads/2019/11/5/6cbfd86e0bf1f4d8633f63962db9e42b-full.png)

### Known Issues

For extension `!wdBootGlobals`, I'm obtaining the address of `WdBoot!MpEbGlobals` from the symbols (`getModuleSymbolAddress`). 
This means that symbols for `WdBoot` must be loaded, and here comes the problem, the `WdBoot` driver that's being loaded
is the one from the folder `Systemroot\System32\drivers\wd\` and this one doesn't ship with symbols, but on the other hand the 
`WdBoot` from the folder `Systemroot\System32\drivers\` does have the symbols, and at least on the versions I have checked
you can safely load this PDB and symbols will match (Files are practically the same)
