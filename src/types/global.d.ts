// src/global.d.ts

// Declare the Web Speech API interface that Chrome/Safari use (prefixed)
interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

// Optionally, you can also define the basic constructor type
declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
    prototype: webkitSpeechRecognition;
    new(): webkitSpeechRecognition;
};