package app.chinnu.ai;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(ChinnuSpeechPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
