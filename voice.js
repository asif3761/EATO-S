/* ============================================================
   EATO'S — voice lines (Web Speech API)
   Uses the visitor's own browser/OS text-to-speech — there is no
   recorded voice actor here, so tone and quality vary by device.
   Autoplay policies mean the welcome line can only fire after the
   visitor's first tap/click on the page, not instantly on load.
   ============================================================ */
window.EatosVoice = (() => {
  const hasSpeech = "speechSynthesis" in window;
  let enabled = false;
  let voice = null;
  let voicesReady = false;
  let welcomeSpoken = false;

  function pickVoice(){
    if(!hasSpeech) return;
    const voices = speechSynthesis.getVoices();
    if(!voices.length) return;
    voicesReady = true;
    const preferred = ["Samantha", "Victoria", "Zira", "Google UK English Female", "Google US English", "Female"];
    voice =
      voices.find(v => preferred.some(name => v.name.includes(name))) ||
      voices.find(v => /female/i.test(v.name)) ||
      voices.find(v => v.lang && v.lang.startsWith("en")) ||
      voices[0];
  }

  if(hasSpeech){
    pickVoice();
    speechSynthesis.addEventListener("voiceschanged", pickVoice);
  }

  function speak(text, { rate = 1, pitch = 1.08 } = {}){
    if(!hasSpeech || !enabled) return;
    speechSynthesis.cancel(); // don't let lines pile up over each other
    const utter = new SpeechSynthesisUtterance(text);
    if(voice) utter.voice = voice;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = 0.9;
    speechSynthesis.speak(utter);
  }

  return {
    setEnabled(v){ enabled = v; },
    isEnabled(){ return enabled; },
    isSupported(){ return hasSpeech; },

    sayWelcome(){
      if(welcomeSpoken) return;
      welcomeSpoken = true;
      speak("The tastiest food you will ever try.", { rate: 0.95 });
    },
    sayMenu(){ speak("Tasty.", { rate: 0.9, pitch: 1.15 }); },
    sayBook(){ speak("It's open for you now.", { rate: 0.95 }); },
  };
})();
