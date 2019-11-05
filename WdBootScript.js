"use strict";

// I'm not providing a contextInheritor for most of the debugger API calls, this should be changed at some point 

function add(address, val) 
{
    return host.Int64(address).add(val);
}

class MpEbGlobals 
{
    // This is horrible! This should be done using the JavaScript Visualizer, but I'm too lazy 
    // for that someday I'll probably refactor the code and do it the right way
    constructor(mpGlobals) {
        this.RegistryPath = host.createTypedObject(mpGlobals, "nt", "_UNICODE_STRING");
        this.pHandleRegistration = 
            host.createPointerObject(add(mpGlobals, 0x10), "nt", "unsigned __int64 *");
        this.IoUnregisterBootDriverCallback = 
            host.createPointerObject(add(mpGlobals, 0x18), "nt", "unsigned __int64 *");
        this.Magic = 
            host.createPointerObject(add(mpGlobals, 0x20), "nt", "unsigned long *").dereference();
        this.SignaturesVersionMajor = 
            host.createPointerObject(add(mpGlobals, 0x24), "nt", "unsigned long *").dereference();
        this.SignaturesVersionMinor = 
            host.createPointerObject(add(mpGlobals, 0x28), "nt", "unsigned long *").dereference();
        this.Unk_Unused = 
            host.createPointerObject(add(mpGlobals, 0x2C), "nt", "unsigned long *").dereference();
        this.DriversListEntry = 
            host.createTypedObject(add(mpGlobals, 0x30), "nt", "_LIST_ENTRY");
        this.pSlistEntry = 
            host.createPointerObject(add(mpGlobals, 0x40), "nt", "_SLIST_ENTRY *");
        // Symbol nt!_CALLBACK_OBJECT not found. So for now we use __int64 *
        this.pWdCallbackObject = 
            host.createPointerObject(add(mpGlobals, 0x48), "nt", "unsigned __int64 *");
        this.Cookie = 
            host.createTypedObject(add(mpGlobals, 0x50), "nt", "_LARGE_INTEGER");
        this.Unk_Unused1 = 
            host.createPointerObject(add(mpGlobals, 0x58), "nt", "unsigned __int64 *");
        this.SlistHeader
            host.createTypedObject(add(mpGlobals, 0x60), "nt", "_SLIST_HEADER");
        this.LoadedDriversCount = 
            host.createPointerObject(add(mpGlobals, 0x70), "nt", "unsigned long *").dereference();
        this.LoadedDriversArrayLen =
            host.createPointerObject(add(mpGlobals, 0x74), "nt", "unsigned long *").dereference();
        this.LoadedDriversArray =
            host.createPointerObject(add(mpGlobals, 0x78), "nt", "unsigned __int64 *");
        this.TotalModulesEntryLen =
            host.createPointerObject(add(mpGlobals, 0x80), "nt", "unsigned long *").dereference();      
        this.EntryPointWdFilter =
            this.EntryPointWdFilter = host.memory.readMemoryValues(add(mpGlobals, 0x84), 32, 1, false); 
        this.FlagWdOrMp = 
            host.createPointerObject(add(mpGlobals, 0xA4), "nt", "unsigned char *").dereference();
        this.FlagTestMode = 
            host.createPointerObject(add(mpGlobals, 0xA5), "nt", "unsigned char *").dereference();
        this.FlagPersistElamInfo =
            host.createPointerObject(add(mpGlobals, 0xA6), "nt", "unsigned char *").dereference();
        this.Alignment =
            host.createPointerObject(add(mpGlobals, 0xA7), "nt", "unsigned char *").dereference();
        this.Unk_Unused2 =
            host.createPointerObject(add(mpGlobals, 0xA8), "nt", "unsigned __int64 *").dereference();
    }
}


function __DisplayMpEbGlobals() 
{

    let mpGlobals = host.getModuleSymbolAddress("WdBoot", "MpEbGlobals");

    if (mpGlobals === null) {
        throw new Error("Unable to find specified MpEbGlobals address");
    }

    let MpEbGlobalsStruct = new MpEbGlobals(mpGlobals);

    return {MpEbGlobalsAddr: mpGlobals, MpEbGlobalsStruct};
}

function __readByte(dword, byte) 
{
    return dword >> (byte*8) & 0xFF
}

class Signatures 
{

    constructor(signaturesData, size)
    {
        this.__signaturesData = signaturesData;
        this.__size = size;
    }

    __getSignatureType(type) {
        switch(type){
            case 0x1:
                return "THUMBPRINT_HASH";
            case 0x2:
                return "CERTIFICATE_PUBLISHER";
            case 0x3:
                return "ISSUER_NAME";
            case 0x4:
                return "IMAGE_HASH";
            case 0x7:
                return "VERSION_INFO";
        }
    }

    __getSignatureClassification(classification) {
        
        switch(classification){
            case 0x0:
                return "KnownGoodImage";
            case 0x1:
                return "KnownBadImage";
            case 0x2:
            case 0x3:
                return "KnownBadImageBootCritical";
            case 0x4:
                return "UnknownImage";
        }
    }

    *[Symbol.iterator]() {

        if (this.__signaturesData === undefined || this.__size === undefined) {
            return;
        }

        var i = 0;
        var code = 0x80000000;

        while (i <= this.__size) {
            var signature = {};
            var entryInfo = host.createPointerObject(add(this.__signaturesData, i), "nt", "unsigned long *").dereference();
            
            var tag = entryInfo & 0xFF;
            var entrySize = __readByte(entryInfo, 1) | 
                            (__readByte(entryInfo, 2) | 
                            (__readByte(entryInfo, 3) << 8) << 8);

            switch(tag) {
                case 0xA9:
                    var sigSize = 
                        host.createPointerObject(add(this.__signaturesData, i+4), "nt", "unsigned long *").dereference();
                    if (host.createPointerObject(add(this.__signaturesData, i+sigSize+8), "nt", "unsigned char *").dereference() == 9) {
                        signature.SignatureCode = code;
                        var sigType = 
                                host.createPointerObject(add(this.__signaturesData, i+8), "nt", "unsigned char *").dereference();
                        signature.SignatureType = this.__getSignatureType(sigType);                            
                        if (sigType == 0x7) {
                            signature.SignaturesVersionMajor = 
                                host.createPointerObject(add(this.__signaturesData, i+8+2), "nt", "unsigned ulong *").dereference();
                            signature.SignaturesVersionMinor = 
                                host.createPointerObject(add(this.__signaturesData, i+8+2+4), "nt", "unsigned ulong *").dereference();
                            yield signature;
                        } else {
                            signature.SignatureClassification = 
                                this.__getSignatureClassification(
                                    host.createPointerObject(add(this.__signaturesData, i+8+1), "nt", "unsigned char *").dereference());
                            signature.SignatureSize = sigSize - 2;
                            signature.Signature = host.memory.readMemoryValues(add(this.__signaturesData, i+8+2), sigSize - 2, 1, false);
                            yield signature;
                        }
                    }
                    break;
                case 0x5C:
                    code = host.createPointerObject(add(this.__signaturesData, i+4), "nt", "unsigned long *").dereference();
                    break;
                case 0x5D:
                    code = 0x80000000;
                    break;
            }
            i += 4 + entrySize;
        }
    }
}

// Address must be an integer so we need to provide the value with prefix "0x"
// DataSize 0x215c
function __DisplaySignaturesDatam(address, dataSize) 
{

    if (typeof address === "undefined" || typeof address === "string") {
        throw new Error("Please provide a number address");
    }

    if (typeof dataSize === "undefined" || typeof dataSize === "string") {
        throw new Error("Please provide a data size");
    }

    let Magic = host.createPointerObject(address, "nt", "unsigned char *").dereference();
    if (Magic !== 0xAC) {
        throw new Error("Address provided doesn't matcht SignaturesData Magic (0xAC)");
    }
    let byte1 = host.createPointerObject(add(address, 0x1), "nt", "unsigned char *").dereference();
    let word1 = host.createPointerObject(add(address, 0x2), "nt", "unsigned short *").dereference();

    let EncryptedKeySize = byte1.bitwiseOr(word1.bitwiseShiftLeft(8));
    let EncryptedKeyOffset = host.createPointerObject(add(address, 4), "nt", "unsigned __int64 *");

    let SignaturesDatabse = new Signatures(add(address, 0x4 + EncryptedKeySize), dataSize - EncryptedKeySize - 4);
    return { Magic, EncryptedKeySize, EncryptedKeyOffset, SignaturesDatabse};

}

function initializeScript()
{
    return [new host.apiVersionSupport(1, 2),
            new host.functionAlias(__DisplayMpEbGlobals, "wdBootGlobals"),
            new host.functionAlias(__DisplaySignaturesDatam, "wdBootSig")];
}
