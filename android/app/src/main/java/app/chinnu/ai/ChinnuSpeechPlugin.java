package app.chinnu.ai;

import android.speech.tts.TextToSpeech;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

@CapacitorPlugin(name = "ChinnuSpeech")
public class ChinnuSpeechPlugin extends Plugin {
    private TextToSpeech engine;
    private boolean ready;
    @Override public void load() {
        getActivity().runOnUiThread(() -> {
            engine = new TextToSpeech(getContext(), status -> {
                if (status == TextToSpeech.SUCCESS && engine != null) {
                    int language = engine.setLanguage(Locale.ENGLISH);
                    ready = language != TextToSpeech.LANG_MISSING_DATA && language != TextToSpeech.LANG_NOT_SUPPORTED;
                    engine.setSpeechRate(0.93f);
                }
            });
        });
    }
    @PluginMethod public void speak(PluginCall call) {
        String text = call.getString("text", "");
        getActivity().runOnUiThread(() -> {
            if (!ready || engine == null) { call.reject("Android speech is not ready. Enable or install an English text-to-speech voice in phone settings, then retry."); return; }
            int result = engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "chinnu-cue");
            if (result == TextToSpeech.ERROR) call.reject("Android could not play the spoken cue.");
            else call.resolve(new JSObject());
        });
    }
    @PluginMethod public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (engine != null) engine.stop(); call.resolve(); });
    }
    @Override protected void handleOnPause() { if (engine != null) engine.stop(); }
    @Override protected void handleOnDestroy() { if (engine != null) { engine.stop(); engine.shutdown(); engine = null; } ready = false; }
}
